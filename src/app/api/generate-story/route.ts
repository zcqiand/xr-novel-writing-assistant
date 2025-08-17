import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, generateScenes, generateParagraphsBounding, generateParagraphs, assembleFullBook, generateBookMarkdown, StoryOutline, ChapterScenes, SceneParagraphs } from '@/lib/ai-story-generator';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// 环境变量配置
const config = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || '',
  model: process.env.OPENAI_MODEL || '',
  siteUrl: process.env.SITE_URL || '',
  siteName: process.env.SITE_NAME || '',
};

// 检查是否为测试模式
interface StoryElements {
  protagonist: string;
  plot: string;
  conflict: string;
  outcome: string;
  length: 'short' | 'medium' | 'long';
}

// 定义故事状态的精确类型
type StoryStatus = 'pending' | 'outline' | 'scenes' | 'paragraphs_bounding' | 'paragraphs' | 'assemble' | 'completed' | 'error';

// 定义数据库更新数据的精确类型
interface StoryStatusUpdateData {
  status: StoryStatus;
  updated_at: string;
  total_chapters?: number;
  completed_chapters?: number;
  next_chapter_total_scenes?: number;
  next_chapter_completed_scenes?: number;
  error?: string;
}

interface CompletedData {
  bookMarkdown: string;
  story_id: string;
}

interface OutlineData {
  outline: StoryOutline;
  story_id: string;
}

interface SceneData {
  outline: StoryOutline;
  story_id: string;
  scenes: ChapterScenes[];
}

interface ParagraphsBoundingData {
  outline: StoryOutline;
  story_id: string;
  scenes: ChapterScenes[];
  allParagraphs: SceneParagraphs[];
}

type GenerationData = OutlineData | SceneData | ParagraphsBoundingData | CompletedData;

const isTestMode = config.apiKey === 'test-api-key-for-debugging';

// 存储生成状态的简单内存存储（生产环境应使用数据库）
const generationStatus = new Map<string, {
  status: 'pending' | 'outline' | 'scenes' | 'paragraphs_bounding' | 'paragraphs' | 'assemble' | 'completed' | 'error';
  data?: GenerationData;
  error?: string;
  lastUpdated: number;
}>();

// 计算生成进度的辅助函数
const calculateProgress = (status: string): number => {
  switch (status) {
    case 'pending': return 0;
    case 'outline': return 20;
    case 'scenes': return 40;
    case 'paragraphs_bounding': return 60;
    case 'paragraphs': return 80;
    case 'assemble': return 90;
    case 'completed': return 100;
    case 'error': return 0;
    default: return 0;
  }
};

// 清理过期的生成状态（防止内存泄漏）
const cleanupExpiredStatus = () => {
  const now = Date.now();
  const EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时
  
  console.log(`🧹 [DEBUG] 开始清理过期状态 - 当前时间: ${new Date(now).toISOString()}`);
  console.log(`🧹 [DEBUG] 过期时间: ${EXPIRE_TIME}ms (${EXPIRE_TIME / 1000 / 60}分钟)`);
  
  const entriesToDelete = [];
  for (const [key, value] of generationStatus.entries()) {
    const timeSinceLastUpdate = now - value.lastUpdated;
    console.log(`🧹 [DEBUG] 检查任务 ${key}:`, {
      status: value.status,
      lastUpdated: new Date(value.lastUpdated).toISOString(),
      timeSinceLastUpdate: timeSinceLastUpdate,
      isExpired: timeSinceLastUpdate > EXPIRE_TIME
    });
    
    if (timeSinceLastUpdate > EXPIRE_TIME) {
      entriesToDelete.push(key);
    }
  }
  
  if (entriesToDelete.length > 0) {
    console.log(`🧹 [DEBUG] 清理过期状态 - 删除 ${entriesToDelete.length} 个任务:`, entriesToDelete);
    entriesToDelete.forEach(key => generationStatus.delete(key));
  }
  
  console.log(`🧹 [DEBUG] 清理完成 - 当前内存中的任务数量: ${generationStatus.size}`);
  console.log(`🧹 [DEBUG] 剩余任务ID:`, Array.from(generationStatus.keys()));
};

// 异步故事生成函数
const generateStoryAsync = async (storyElements: StoryElements, storyId: string) => {
  try {
    console.log(`🚀 开始异步生成故事 - ID: ${storyId}`);
    console.log(`📝 故事元素:`, JSON.stringify(storyElements, null, 2));

    // 生成大纲
    const { outline: newOutlineData, story_id } = await generateStoryOutline(
      storyId,
      storyElements.protagonist,
      storyElements.plot,
      storyElements.conflict,
      storyElements.outcome,
      storyElements.length
    );

    // 从数据库获取故事信息以获取总章节数
    console.log(`🔍 尝试从数据库获取故事信息 - ID: ${storyId}`);
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('outline_data, status, error, total_chapters, completed_chapters')
      .eq('id', storyId)
      .single();

    console.log(`📊 数据库查询结果:`);
    console.log(`- storyData:`, storyData);
    console.log(`- storyError:`, storyError);

    if (storyError || !storyData) {
      console.error(`❌ 数据库查询失败:`, storyError);
      throw new Error(`无法获取故事信息: ${storyError?.message || '故事不存在'}`);
    }

    // 检查outline_data是否为有效的JSON对象
    console.log(`🔍 检查outline_data格式:`);
    console.log(`- outline_data类型:`, typeof storyData.outline_data);
    console.log(`- outline_data值:`, storyData.outline_data);
    
    let outlineData;
    try {
      if (typeof storyData.outline_data === 'string') {
        outlineData = JSON.parse(storyData.outline_data);
        console.log(`✅ 成功解析字符串格式的outline_data`);
      } else if (typeof storyData.outline_data === 'object') {
        outlineData = storyData.outline_data;
        console.log(`✅ outline_data已经是对象格式`);
      } else {
        throw new Error(`outline_data类型不支持: ${typeof storyData.outline_data}`);
      }
    } catch (parseError) {
      console.error(`❌ outline_data解析失败:`, parseError);
      throw new Error(`outline_data解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

    console.log(`✅ outline_data解析成功:`, outlineData);
    const totalChapters = outlineData.chapters?.length || 0;

    // 更新状态：大纲生成完成，开始生成场景
    await updateStoryStatus(storyId, {
      status: 'scenes',
      progress: 40, // 修正进度：outline应该是20%，scenes应该是40%
      total_chapters: totalChapters,
      completed_chapters: 0,
      next_chapter_total_scenes: 0,
      next_chapter_completed_scenes: 0
    });

    const allScenes = await generateScenes(newOutlineData, story_id);

    // 计算第一个章节的场景数
    const firstChapterScenes = allScenes[0]?.scenes?.length || 0;

    // 更新状态：开始生成段落边界
    await updateStoryStatus(storyId, {
      status: 'paragraphs_bounding',
      progress: 40,
      total_chapters: totalChapters,
      completed_chapters: 0,
      next_chapter_total_scenes: firstChapterScenes,
      next_chapter_completed_scenes: 0
    });

    const scenesArray = Array.isArray(allScenes) ? allScenes : [allScenes];

    const allParagraphsBounding = [];
    for (const chapterScenes of scenesArray) {
      const chapterParagraphs = await generateParagraphsBounding(newOutlineData, chapterScenes, story_id);
      allParagraphsBounding.push(...chapterParagraphs);
      
      // 更新当前章节的完成场景数
      const completedScenes = chapterParagraphs.length;
      const chapterNumber = chapterScenes.chapter;
      
      await updateStoryStatus(storyId, {
        status: 'paragraphs_bounding',
        progress: 40,
        total_chapters: totalChapters,
        completed_chapters: chapterNumber - 1,
        next_chapter_total_scenes: chapterScenes.scenes?.length || 0,
        next_chapter_completed_scenes: completedScenes
      });
    }

    // 更新状态：生成完整场景内容
    await updateStoryStatus(storyId, {
      status: 'paragraphs',
      progress: 60,
      total_chapters: totalChapters,
      completed_chapters: 0,
      next_chapter_total_scenes: firstChapterScenes,
      next_chapter_completed_scenes: 0
    });

    for (let i = 0; i < scenesArray.length; i++) {
      const chapterScenes = scenesArray[i];
      await generateParagraphs(
        newOutlineData,
        chapterScenes,
        allParagraphsBounding,
        story_id
      );
      
      // 更新当前章节的完成场景数
      const chapterNumber = chapterScenes.chapter;
      const totalScenesInChapter = chapterScenes.scenes?.length || 0;
      
      await updateStoryStatus(storyId, {
        status: 'paragraphs',
        progress: 60,
        total_chapters: totalChapters,
        completed_chapters: chapterNumber - 1,
        next_chapter_total_scenes: totalScenesInChapter,
        next_chapter_completed_scenes: totalScenesInChapter // 假设所有场景都已完成
      });
    }

    // 更新状态：组装完整书籍
    await updateStoryStatus(storyId, {
      status: 'assemble',
      progress: 90,
      total_chapters: totalChapters,
      completed_chapters: totalChapters,
      next_chapter_total_scenes: 0,
      next_chapter_completed_scenes: 0
    });

    // 生成完整的书籍内容
    console.log(`📝 [DEBUG] 开始组装完整书籍 - ID: ${storyId}`);
    const fullBook = await assembleFullBook(story_id);
    const bookMarkdown = generateBookMarkdown(fullBook);
    
    console.log(`📝 [DEBUG] 书籍内容生成完成 - 长度: ${bookMarkdown.length} 字符`);
    
    // 保存到内存存储
    const completedData: CompletedData = {
      bookMarkdown: bookMarkdown,
      story_id: story_id
    };
    
    console.log(`📝 [DEBUG] 准备保存到内存存储 - ID: ${storyId}`);
    generationStatus.set(storyId, {
      status: 'completed',
      data: completedData,
      lastUpdated: Date.now()
    });
    
    console.log(`📝 [DEBUG] 书籍内容已保存到内存存储 - ID: ${storyId}`);
    console.log(`📝 [DEBUG] 内存存储状态:`, generationStatus.get(storyId));
    
    console.log(`📝 [DEBUG] 准备更新数据库状态为completed - ID: ${storyId}`);
    await updateStoryStatus(storyId, {
      status: 'completed',
      progress: 100,
      total_chapters: totalChapters,
      completed_chapters: totalChapters,
      next_chapter_total_scenes: 0,
      next_chapter_completed_scenes: 0
    });
    
    console.log(`📝 [DEBUG] 数据库状态更新完成 - ID: ${storyId}`);

    console.log(`✅ 异步生成完成 - ID: ${storyId}`);

  } catch (error) {
    console.error(`❌ 异步生成失败 - ID: ${storyId}:`, error);
    await updateStoryStatus(storyId, {
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : '生成失败'
    });
  }
};

// 异步故事生成函数（支持从指定进度继续）
const generateStoryAsyncWithProgress = async (storyElements: StoryElements, storyId: string, existingStory: any) => {
  try {
    console.log(`🚀 开始异步生成故事（带进度）- ID: ${storyId}`);
    console.log(`📝 故事元素:`, JSON.stringify(storyElements, null, 2));
    console.log(`📊 现有故事进度:`, existingStory);

    // 从数据库获取故事信息以获取总章节数
    console.log(`🔍 尝试从数据库获取故事信息 - ID: ${storyId}`);
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('outline_data, status, error, total_chapters, completed_chapters')
      .eq('id', storyId)
      .single();

    console.log(`📊 数据库查询结果:`);
    console.log(`- storyData:`, storyData);
    console.log(`- storyError:`, storyError);

    if (storyError || !storyData) {
      console.error(`❌ 数据库查询失败:`, storyError);
      throw new Error(`无法获取故事信息: ${storyError?.message || '故事不存在'}`);
    }

    // 检查outline_data是否为有效的JSON对象
    console.log(`🔍 检查outline_data格式:`);
    console.log(`- outline_data类型:`, typeof storyData.outline_data);
    console.log(`- outline_data值:`, storyData.outline_data);
    
    let outlineData;
    try {
      if (typeof storyData.outline_data === 'string') {
        outlineData = JSON.parse(storyData.outline_data);
        console.log(`✅ 成功解析字符串格式的outline_data`);
      } else if (typeof storyData.outline_data === 'object') {
        outlineData = storyData.outline_data;
        console.log(`✅ outline_data已经是对象格式`);
      } else {
        throw new Error(`outline_data类型不支持: ${typeof storyData.outline_data}`);
      }
    } catch (parseError) {
      console.error(`❌ outline_data解析失败:`, parseError);
      throw new Error(`outline_data解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

    console.log(`✅ outline_data解析成功:`, outlineData);
    const totalChapters = outlineData.chapters?.length || 0;

    // 根据现有状态决定从哪个阶段继续
    const currentStatus = existingStory.status;
    console.log(`🔄 当前状态: ${currentStatus}, 将从该阶段继续`);

    let allScenes: any[] = [];
    let allParagraphsBounding: any[] = [];

    // 如果当前状态是outline或更早，重新生成大纲
    if (currentStatus === 'outline' || currentStatus === 'pending') {
      console.log(`📝 重新生成大纲 - ID: ${storyId}`);
      const { outline: newOutlineData } = await generateStoryOutline(
        storyId,
        storyElements.protagonist,
        storyElements.plot,
        storyElements.conflict,
        storyElements.outcome,
        storyElements.length
      );

      await updateStoryStatus(storyId, {
        status: 'scenes',
        progress: 40,
        total_chapters: totalChapters,
        completed_chapters: 0,
        next_chapter_total_scenes: 0,
        next_chapter_completed_scenes: 0
      });
    }

    // 如果当前状态是scenes或更早，生成场景
    if (currentStatus === 'scenes' || currentStatus === 'outline' || currentStatus === 'pending') {
      console.log(`🎭 生成场景 - ID: ${storyId}`);
      allScenes = await generateScenes(outlineData, storyId);

      // 计算第一个章节的场景数
      const firstChapterScenes = allScenes[0]?.scenes?.length || 0;

      await updateStoryStatus(storyId, {
        status: 'paragraphs_bounding',
        progress: 40,
        total_chapters: totalChapters,
        completed_chapters: 0,
        next_chapter_total_scenes: firstChapterScenes,
        next_chapter_completed_scenes: 0
      });
    }

    // 如果当前状态是paragraphs_bounding或更早，生成段落边界
    if (currentStatus === 'paragraphs_bounding' || currentStatus === 'scenes' || currentStatus === 'outline' || currentStatus === 'pending') {
      console.log(`📏 生成段落边界 - ID: ${storyId}`);
      const scenesArray = Array.isArray(allScenes) ? allScenes : [allScenes];

      for (const chapterScenes of scenesArray) {
        const chapterParagraphs = await generateParagraphsBounding(outlineData, chapterScenes, storyId);
        allParagraphsBounding.push(...chapterParagraphs);
        
        // 更新当前章节的完成场景数
        const completedScenes = chapterParagraphs.length;
        const chapterNumber = chapterScenes.chapter;
        
        await updateStoryStatus(storyId, {
          status: 'paragraphs_bounding',
          progress: 40,
          total_chapters: totalChapters,
          completed_chapters: chapterNumber - 1,
          next_chapter_total_scenes: chapterScenes.scenes?.length || 0,
          next_chapter_completed_scenes: completedScenes
        });
      }
    }

    // 如果当前状态是paragraphs或更早，生成完整场景内容
    if (currentStatus === 'paragraphs' || currentStatus === 'paragraphs_bounding' || currentStatus === 'scenes' || currentStatus === 'outline' || currentStatus === 'pending') {
      console.log(`📝 生成完整场景内容 - ID: ${storyId}`);
      await updateStoryStatus(storyId, {
        status: 'paragraphs',
        progress: 60,
        total_chapters: totalChapters,
        completed_chapters: existingStory.completed_chapters || 0,
        next_chapter_total_scenes: existingStory.next_chapter_total_scenes || 0,
        next_chapter_completed_scenes: existingStory.next_chapter_completed_scenes || 0
      });

      // 从未完成的章节开始生成
      const scenesArray = Array.isArray(allScenes) ? allScenes : [allScenes];
      const startChapter = (existingStory.completed_chapters || 0) + 1;
      
      for (let i = startChapter - 1; i < scenesArray.length; i++) {
        const chapterScenes = scenesArray[i];
        await generateParagraphs(
          outlineData,
          chapterScenes,
          allParagraphsBounding,
          storyId
        );
        
        // 更新当前章节的完成场景数
        const chapterNumber = chapterScenes.chapter;
        const totalScenesInChapter = chapterScenes.scenes?.length || 0;
        
        await updateStoryStatus(storyId, {
          status: 'paragraphs',
          progress: 60,
          total_chapters: totalChapters,
          completed_chapters: chapterNumber,
          next_chapter_total_scenes: totalScenesInChapter,
          next_chapter_completed_scenes: totalScenesInChapter
        });
      }
    }

    // 更新状态：组装完整书籍
    console.log(`📚 组装完整书籍 - ID: ${storyId}`);
    await updateStoryStatus(storyId, {
      status: 'assemble',
      progress: 90,
      total_chapters: totalChapters,
      completed_chapters: totalChapters,
      next_chapter_total_scenes: 0,
      next_chapter_completed_scenes: 0
    });

    // 生成完整的书籍内容
    console.log(`📝 [DEBUG] 开始组装完整书籍 - ID: ${storyId}`);
    const fullBook = await assembleFullBook(storyId);
    const bookMarkdown = generateBookMarkdown(fullBook);
    
    console.log(`📝 [DEBUG] 书籍内容生成完成 - 长度: ${bookMarkdown.length} 字符`);
    
    // 保存到内存存储
    const completedData: CompletedData = {
      bookMarkdown: bookMarkdown,
      story_id: storyId
    };
    
    console.log(`📝 [DEBUG] 准备保存到内存存储 - ID: ${storyId}`);
    generationStatus.set(storyId, {
      status: 'completed',
      data: completedData,
      lastUpdated: Date.now()
    });
    
    console.log(`📝 [DEBUG] 书籍内容已保存到内存存储 - ID: ${storyId}`);
    console.log(`📝 [DEBUG] 内存存储状态:`, generationStatus.get(storyId));
    
    console.log(`📝 [DEBUG] 准备更新数据库状态为completed - ID: ${storyId}`);
    await updateStoryStatus(storyId, {
      status: 'completed',
      progress: 100,
      total_chapters: totalChapters,
      completed_chapters: totalChapters,
      next_chapter_total_scenes: 0,
      next_chapter_completed_scenes: 0
    });
    
    console.log(`📝 [DEBUG] 数据库状态更新完成 - ID: ${storyId}`);

    console.log(`✅ 异步生成完成（带进度）- ID: ${storyId}`);

  } catch (error) {
    console.error(`❌ 异步生成失败（带进度） - ID: ${storyId}:`, error);
    await updateStoryStatus(storyId, {
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : '生成失败'
    });
  }
};

// 更新故事状态的辅助函数
const updateStoryStatus = async (
  storyId: string,
  statusData: {
    status: string;
    progress: number,
    total_chapters?: number;
    completed_chapters?: number;
    next_chapter_total_scenes?: number;
    next_chapter_completed_scenes?: number;
    error?: string;
  }
) => {
  try {
    console.log(`🔄 更新故事状态 - ID: ${storyId}`, statusData);

    // 更新内存中的状态 - 使用类型断言确保类型安全
    const existingStatus = generationStatus.get(storyId);
    generationStatus.set(storyId, {
      status: statusData.status as StoryStatus,
      lastUpdated: Date.now(),
      data: existingStatus?.data, // 保留现有数据
      error: statusData.error // 设置新的错误信息
    });
    
    console.log(`🔄 [DEBUG] 内存状态已更新 - ID: ${storyId}`, {
      newStatus: statusData.status,
      hasData: !!generationStatus.get(storyId)?.data,
      hasError: !!statusData.error
    });
    
    console.log(`🔧 [DEBUG] 准备更新数据库状态 - ID: ${storyId}`, statusData);

    // 更新数据库中的状态 - 使用精确的类型定义
    const updateData: StoryStatusUpdateData = {
      status: statusData.status as StoryStatus,
      updated_at: new Date().toISOString()
    };

    if (statusData.total_chapters !== undefined) {
      updateData.total_chapters = statusData.total_chapters;
    }
    if (statusData.completed_chapters !== undefined) {
      updateData.completed_chapters = statusData.completed_chapters;
    }
    if (statusData.next_chapter_total_scenes !== undefined) {
      updateData.next_chapter_total_scenes = statusData.next_chapter_total_scenes;
    }
    if (statusData.next_chapter_completed_scenes !== undefined) {
      updateData.next_chapter_completed_scenes = statusData.next_chapter_completed_scenes;
    }
    if (statusData.error) {
      updateData.error = statusData.error;
      console.log(`📝 设置错误信息: ${statusData.error}`);
    }

    console.log(`📊 准备更新的数据:`, updateData);

    console.log(`🔧 [DEBUG] 准备执行数据库更新 - ID: ${storyId}`);
    console.log(`🔧 [DEBUG] 更新数据:`, updateData);
    
    const { error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', storyId);

    if (error) {
      console.error(`❌ 更新故事状态失败 - ID: ${storyId}:`, error);
      console.error(`- 错误代码: ${error.code}`);
      console.error(`- 错误消息: ${error.message}`);
      console.error(`- 错误详情: ${error.details}`);
      console.error(`- 错误提示: ${error.hint}`);
      console.error(`🔧 [DEBUG] 数据库更新失败，但内存状态已更新 - ID: ${storyId}`);
    } else {
      console.log(`✅ 故事状态已更新 - ID: ${storyId}:`, statusData);
      console.log(`🔧 [DEBUG] 数据库更新成功 - ID: ${storyId}`);
    }
  } catch (error) {
    console.error(`❌ 更新故事状态时发生错误 - ID: ${storyId}:`, error);
  }
};

/**
 * POST /api/generate-story
 * 统一的故事生成API端点
 * 通过action参数控制不同的生成阶段
 */
export async function POST(request: NextRequest) {
  const { action } = Object.fromEntries(request.nextUrl.searchParams);

  // 清理过期状态
  cleanupExpiredStatus();

  const requestStartTime = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] API请求开始 - action: ${action}`);

  try {
    switch (action) {
      case 'generate-story':
        // 这个action改为启动异步生成并立即返回
        const outlineBody = await request.json();

        const protagonist = outlineBody.protagonist || "未指定主角类型";
        const plot = outlineBody.plot || "未指定情节发展";
        const conflict = outlineBody.conflict || "未指定冲突";
        const outcome = outlineBody.outcome || "未指定故事结局";
        const length = outlineBody.length || 'short';

        console.log('=== 大纲生成参数 ===');
        console.log('主角类型:', protagonist);
        console.log('情节发展:', plot);
        console.log('主要冲突:', conflict);
        console.log('故事结局:', outcome);
        console.log('故事篇幅:', length);
        console.log('==================');

        // 生成唯一的生成ID
        const generateStoryGenerationId = uuidv4();

        // 初始化状态 - 从outline开始，因为大纲创建完成后才有outline状态
        console.log(`🔧 [DEBUG] 初始化生成状态为 'outline' - ID: ${generateStoryGenerationId}`);
        generationStatus.set(generateStoryGenerationId, {
          status: 'outline',
          lastUpdated: Date.now()
        });

        // 立即更新数据库状态为outline
        console.log(`🔧 [DEBUG] 更新数据库状态为 'outline' - ID: ${generateStoryGenerationId}`);
        await updateStoryStatus(generateStoryGenerationId, {
          status: 'outline',
          progress: 20,
          total_chapters: 0, // 将在生成大纲后更新
          completed_chapters: 0,
          next_chapter_total_scenes: 0,
          next_chapter_completed_scenes: 0
        });
        
        console.log(`✅ [DEBUG] 状态初始化完成 - ID: ${generateStoryGenerationId}, 状态: outline`);

        // 启动异步生成（不等待完成）
        const generateStoryElements = { protagonist, plot, conflict, outcome, length };
        generateStoryAsync(generateStoryElements, generateStoryGenerationId).catch(error => {
          console.error('异步生成过程出错:', error);
        });

        // 立即返回生成ID
        return NextResponse.json({
          success: true,
          data: {
            generationId: generateStoryGenerationId,
            message: '故事生成已启动，请使用生成ID查询进度'
          }
        });

      case 'continue-story':
        // 继续生成故事 - 基于当前进度继续
        const continueBody = await request.json();
        const { storyId, storyElements: continueStoryElements } = continueBody;

        if (!storyId || !continueStoryElements) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数: storyId 或 storyElements" },
            { status: 400 }
          );
        }

        console.log('=== 继续生成参数 ===');
        console.log('故事ID:', storyId);
        console.log('主角类型:', continueStoryElements.protagonist);
        console.log('情节发展:', continueStoryElements.plot);
        console.log('主要冲突:', continueStoryElements.conflict);
        console.log('故事结局:', continueStoryElements.outcome);
        console.log('故事篇幅:', continueStoryElements.length);
        console.log('====================');

        // 获取现有故事的当前状态
        console.log(`🔍 [DEBUG] 获取现有故事状态 - ID: ${storyId}`);
        const { data: existingStory, error: storyError } = await supabase
          .from('stories')
          .select('status, total_chapters, completed_chapters, next_chapter_total_scenes, next_chapter_completed_scenes, outline_data')
          .eq('id', storyId)
          .single();

        if (storyError || !existingStory) {
          return NextResponse.json(
            { success: false, error: "找不到指定的故事" },
            { status: 404 }
          );
        }

        console.log(`🔍 [DEBUG] 现有故事状态:`, existingStory);

        // 检查故事是否已完成
        if (existingStory.status === 'completed') {
          return NextResponse.json(
            { success: false, error: "故事已完成，无需继续生成" },
            { status: 400 }
          );
        }

        // 生成唯一的生成ID（使用原故事ID）
        const continueStoryGenerationId = storyId;

        // 根据当前状态设置初始状态
        let continueStatus = existingStory.status;
        let continueProgress = calculateProgress(continueStatus);
        
        console.log(`🔧 [DEBUG] 基于当前状态继续 - 当前状态: ${continueStatus}, 进度: ${continueProgress}%`);

        // 初始化状态 - 保持当前状态
        generationStatus.set(continueStoryGenerationId, {
          status: continueStatus as StoryStatus,
          lastUpdated: Date.now()
        });

        // 立即更新数据库状态，保持现有进度
        await updateStoryStatus(continueStoryGenerationId, {
          status: continueStatus as StoryStatus,
          progress: continueProgress,
          total_chapters: existingStory.total_chapters || 0,
          completed_chapters: existingStory.completed_chapters || 0,
          next_chapter_total_scenes: existingStory.next_chapter_total_scenes || 0,
          next_chapter_completed_scenes: existingStory.next_chapter_completed_scenes || 0
        });
        
        console.log(`✅ [DEBUG] 继续生成状态初始化完成 - ID: ${continueStoryGenerationId}, 状态: ${continueStatus}`);

        // 启动异步继续生成（不等待完成），传入现有进度
        generateStoryAsyncWithProgress(continueStoryElements, continueStoryGenerationId, existingStory).catch(error => {
          console.error('异步继续生成过程出错:', error);
        });

        // 立即返回生成ID
        return NextResponse.json({
          success: true,
          data: {
            generationId: continueStoryGenerationId,
            message: `故事继续生成已启动，从${continueStatus}阶段继续，当前进度: ${continueProgress}%`
          }
        });

      case 'check-status':
        // 检查生成状态
        const statusBody = await request.json();
        const { generationId: checkId } = statusBody;

        console.log(`🔍 [DEBUG] 检查状态请求 - ID: ${checkId}`);

        if (!checkId) {
          return NextResponse.json(
            { success: false, error: "缺少generationId参数" },
            { status: 400 }
          );
        }

        const status = generationStatus.get(checkId);
        console.log(`🔍 [DEBUG] 内存中的状态:`, status);

        if (!status) {
          // 如果内存中没有状态，尝试从数据库获取
          try {
            console.log(`🔍 [DEBUG] 尝试从数据库获取状态 - ID: ${checkId}`);
            const { data: dbStory, error: dbError } = await supabase
              .from('stories')
              .select('status, total_chapters, completed_chapters, next_chapter_total_scenes, next_chapter_completed_scenes, error, updated_at')
              .eq('id', checkId)
              .single();

            console.log(`🔍 [DEBUG] 数据库查询结果:`, { dbStory, dbError });

            if (!dbError && dbStory) {
              const progress = calculateProgress(dbStory.status || 'unknown');
              console.log(`🔍 [DEBUG] 计算的进度: ${progress}%`);
              
              return NextResponse.json({
                success: true,
                data: {
                  status: dbStory.status || 'unknown',
                  progress: progress,
                  total_chapters: dbStory.total_chapters || 0,
                  completed_chapters: dbStory.completed_chapters || 0,
                  next_chapter_total_scenes: dbStory.next_chapter_total_scenes || 0,
                  next_chapter_completed_scenes: dbStory.next_chapter_completed_scenes || 0,
                  error: dbStory.error || undefined,
                  completed: dbStory.status === 'completed',
                  lastUpdated: dbStory.updated_at ? new Date(dbStory.updated_at).getTime() : Date.now()
                }
              });
            }
          } catch (dbError) {
            console.error('从数据库获取状态失败:', dbError);
          }

          return NextResponse.json(
            { success: false, error: "未找到对应的生成任务" },
            { status: 404 }
          );
        }

        // 如果内存中有状态，尝试从数据库获取详细信息
        let dbDetails = null;
        try {
          console.log(`🔧 [DEBUG] 从数据库获取详细信息 - ID: ${checkId}`);
          const { data: dbStory } = await supabase
            .from('stories')
            .select('total_chapters, completed_chapters, next_chapter_total_scenes, next_chapter_completed_scenes, status')
            .eq('id', checkId)
            .single();

          dbDetails = dbStory;
          console.log(`🔧 [DEBUG] 数据库详细信息:`, dbDetails);
        } catch (dbError) {
          console.error('从数据库获取详细信息失败:', dbError);
        }

        const progress = calculateProgress(status.status);
        console.log(`🔍 [DEBUG] 内存状态计算的进度: ${progress}%`);
        console.log(`🔧 [DEBUG] 最终返回的状态: ${status.status}, 进度: ${progress}%`);

        return NextResponse.json({
          success: true,
          data: {
            status: status.status,
            progress: progress,
            error: status.error,
            completed: status.status === 'completed',
            lastUpdated: status.lastUpdated,
            // 添加详细状态信息
            total_chapters: dbDetails?.total_chapters || 0,
            completed_chapters: dbDetails?.completed_chapters || 0,
            next_chapter_total_scenes: dbDetails?.next_chapter_total_scenes || 0,
            next_chapter_completed_scenes: dbDetails?.next_chapter_completed_scenes || 0
          }
        });


      // 保留原有的单步生成endpoints用于调试
      case 'generate-outline':
        // 生成故事大纲
        const single_outlineBody = await request.json();

        // 构建故事元素参数，优先使用前端传递的值，否则使用默认值
        const single_protagonist = single_outlineBody.protagonist || "未指定主角类型";
        const single_plot = single_outlineBody.plot || "未指定情节发展";
        const single_conflict = single_outlineBody.conflict || "未指定冲突";
        const single_outcome = single_outlineBody.outcome || "未指定故事结局";
        const single_length = single_outlineBody.length || 'short';

        console.log('=== 大纲生成参数 ===');
        console.log('主角类型:', single_protagonist);
        console.log('情节发展:', single_plot);
        console.log('主要冲突:', single_conflict);
        console.log('故事结局:', single_outcome);
        console.log('故事篇幅:', single_length);
        console.log('==================');
        // 生成唯一的生成ID
        const single_generationId = uuidv4();

        const { outline: outlineData, story_id } = await generateStoryOutline(single_generationId, single_protagonist, single_plot, single_conflict, single_outcome, single_length);

        // 返回大纲数据和ID
        return NextResponse.json({
          success: true,
          data: {
            outline: outlineData,
            story_id: story_id // 使用从数据库返回的真实ID
          },
          message: '故事大纲生成成功'
        });
      case 'generate-scenes':
        const scenesBody = await request.json();
        if (!scenesBody.outline) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数: outline" },
            { status: 400 }
          );
        }
        if (!scenesBody.story_id) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数: story_id" },
            { status: 400 }
          );
        }

        const scenes = await generateScenes(scenesBody.outline, scenesBody.story_id);
        return NextResponse.json({
          success: true,
          data: scenes,
          message: '场景生成成功'
        });

      case 'generate-paragraphs-bounding':
        const paragraphsBody = await request.json();
        if (!paragraphsBody.outline || !paragraphsBody.scenes || !paragraphsBody.story_id) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数" },
            { status: 400 }
          );
        }

        const scenesArray = Array.isArray(paragraphsBody.scenes) ? paragraphsBody.scenes : [paragraphsBody.scenes];

        const allParagraphs = [];
        for (const chapterScenes of scenesArray) {
          if (isTestMode) {
            const testParagraphs = chapterScenes.scenes.map((scene: { sceneNumber: number; title: string; }) => ({
              sceneNumber: scene.sceneNumber,
              title: scene.title,
              openingParagraph: `开头段落示例：${scene.title} 开始的精彩故事。`,
              closingParagraph: `结尾段落示例：${scene.title} 结束的精彩故事。`
            }));
            allParagraphs.push(...testParagraphs);
          } else {
            const chapterParagraphs = await generateParagraphsBounding(paragraphsBody.outline, chapterScenes, paragraphsBody.story_id);
            allParagraphs.push(...chapterParagraphs);
          }
        }

        return NextResponse.json({
          success: true,
          data: allParagraphs,
          message: '段落（边界）生成成功'
        });

      case 'generate-paragraphs':
        const fullBody = await request.json();
        if (!fullBody.outline || !fullBody.scenes || !fullBody.paragraphs || !fullBody.story_id) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数" },
            { status: 400 }
          );
        }

        const fullScenesArray = Array.isArray(fullBody.scenes) ? fullBody.scenes : [fullBody.scenes];

        const allFullContent = [];
        for (const chapterScenes of fullScenesArray) {
          const chapterFullContent = await generateParagraphs(
            fullBody.outline,
            chapterScenes,
            fullBody.paragraphs,
            fullBody.story_id
          );
          allFullContent.push(...chapterFullContent);
        }

        return NextResponse.json({
          success: true,
          data: allFullContent,
          message: '段落（完整场景内容）生成成功'
        });

      case 'assemble-book':
        const assembleBody = await request.json();
        if (!assembleBody.story_id) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数: story_id" },
            { status: 400 }
          );
        }

        const fullBook = await assembleFullBook(assembleBody.story_id);
        return new NextResponse(generateBookMarkdown(fullBook), {
          headers: { 'Content-Type': 'text/markdown' }
        });

      case 'get-result':
        const getResultBody = await request.json();
        const resultGenerationId = getResultBody.generationId || getResultBody.story_id;
        
        if (!resultGenerationId) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数: generationId 或 story_id" },
            { status: 400 }
          );
        }

        console.log(`🔍 [DEBUG] 获取生成结果 - ID: ${resultGenerationId}`);
        console.log(`🔍 [DEBUG] 当前内存中的任务数量: ${generationStatus.size}`);
        console.log(`🔍 [DEBUG] 内存中的所有任务ID:`, Array.from(generationStatus.keys()));
        
        // 从内存存储中获取生成结果
        const generationData = generationStatus.get(resultGenerationId);
        
        console.log(`🔍 [DEBUG] 内存中的任务数据:`, {
          hasData: !!generationData,
          status: generationData?.status,
          hasError: !!generationData?.error,
          hasCompletedData: !!generationData?.data,
          lastUpdated: generationData?.lastUpdated,
          dataKeys: generationData?.data ? Object.keys(generationData.data) : []
        });
        
        if (!generationData) {
          console.log(`🔍 [DEBUG] 任务未在内存中找到，尝试从数据库查询...`);
          
          // 详细记录数据库查询过程
          try {
            console.log(`🔍 [DEBUG] 开始从数据库查询任务 - ID: ${resultGenerationId}`);
            const { data: dbStory, error: dbError } = await supabase
              .from('stories')
              .select('id, status, created_at, updated_at, error, book_content, full_content')
              .eq('id', resultGenerationId)
              .single();
            
            console.log(`🔍 [DEBUG] 数据库查询结果:`, {
              hasData: !!dbStory,
              status: dbStory?.status,
              hasError: !!dbStory?.error,
              hasContent: !!(dbStory?.book_content || dbStory?.full_content),
              createdAt: dbStory?.created_at,
              updatedAt: dbStory?.updated_at,
              dbError: dbError?.message
            });
            
            if (dbError) {
              console.error(`🔍 [DEBUG] 数据库查询错误:`, dbError);
            }
            
            if (!dbStory) {
              console.log(`🔍 [DEBUG] 数据库中也没有找到任务，确认任务已过期或不存在`);
              // 输出错误日志而不是弹窗
              console.error(`❌ [ERROR] 获取结果失败：未找到生成任务或任务已过期 - ID: ${resultGenerationId}`);
              return NextResponse.json(
                { success: false, error: "未找到生成任务或任务已过期" },
                { status: 404 }
              );
            }
            
            // 如果数据库中有任务但内存中没有，说明可能是清理过程中被误删
            // 重新加载任务到内存中
            console.log(`🔍 [DEBUG] 从数据库重新加载任务到内存 - ID: ${resultGenerationId}`);
            const reloadedData: {
              status: StoryStatus;
              lastUpdated: number;
              error?: string;
              data?: CompletedData;
            } = {
              status: dbStory.status as StoryStatus,
              lastUpdated: new Date(dbStory.updated_at).getTime(),
              error: dbStory.error
            };
            
            // 如果任务已完成且有内容，添加数据
            if (dbStory.status === 'completed' && (dbStory.book_content || dbStory.full_content)) {
              reloadedData.data = {
                bookMarkdown: dbStory.book_content || dbStory.full_content,
                story_id: resultGenerationId
              };
            }
            
            generationStatus.set(resultGenerationId, reloadedData);
            console.log(`🔍 [DEBUG] 任务已重新加载到内存 - ID: ${resultGenerationId}`);
            
            // 重新获取generationData变量
            const updatedGenerationData = generationStatus.get(resultGenerationId);
            if (!updatedGenerationData) {
              console.error(`❌ [ERROR] 重新加载任务失败：无法从内存获取数据 - ID: ${resultGenerationId}`);
              return NextResponse.json(
                { success: false, error: "重新加载任务失败" },
                { status: 500 }
              );
            }
            
            // 使用重新加载的数据继续处理
            console.log(`🔍 [DEBUG] 使用重新加载的数据继续处理 - ID: ${resultGenerationId}`);
          } catch (dbQueryError) {
            console.error(`🔍 [DEBUG] 数据库查询异常:`, dbQueryError);
            console.error(`❌ [ERROR] 获取结果失败：数据库查询异常 - ID: ${resultGenerationId}`);
            return NextResponse.json(
              { success: false, error: "数据库查询异常" },
              { status: 500 }
            );
          }
        }

        // 确保generationData不为undefined
        if (!generationData) {
          console.error(`❌ [ERROR] generationData为undefined - ID: ${resultGenerationId}`);
          return NextResponse.json(
            { success: false, error: "内部错误：任务数据丢失" },
            { status: 500 }
          );
        }

        if (generationData.status === 'error') {
          console.error(`❌ [ERROR] 任务生成失败 - ID: ${resultGenerationId}, 错误: ${generationData.error}`);
          return NextResponse.json(
            {
              success: false,
              error: generationData.error || "生成过程中发生错误"
            },
            { status: 500 }
          );
        }

        if (generationData.status === 'completed' && generationData.data) {
          console.log(`🔍 [DEBUG] 任务已完成且有数据，返回结果`);
          // 如果是 CompletedData 类型，返回完整的书籍内容
          if ('bookMarkdown' in generationData.data) {
            console.log(`🔍 [DEBUG] 返回书籍内容，长度: ${(generationData.data as CompletedData).bookMarkdown.length}`);
            return new NextResponse((generationData.data as CompletedData).bookMarkdown, {
              headers: { 'Content-Type': 'text/markdown' }
            });
          }
          
          // 否则返回 JSON 格式的数据
          console.log(`🔍 [DEBUG] 返回JSON格式数据`);
          return NextResponse.json({
            success: true,
            data: generationData.data,
            message: '生成结果获取成功'
          });
        }

        // 如果还在生成中，返回进行中状态
        console.log(`🔍 [DEBUG] get-result 检查 - ID: ${resultGenerationId}`);
        console.log(`🔍 [DEBUG] 内存状态详情:`, {
          status: generationData.status,
          hasData: !!generationData.data,
          hasError: !!generationData.error,
          lastUpdated: generationData.lastUpdated,
          dataKeys: generationData.data ? Object.keys(generationData.data) : [],
          timeSinceLastUpdate: Date.now() - (generationData.lastUpdated || 0)
        });
        
        // 检查是否真的完成了但没有数据
        if (generationData.status === 'completed' && !generationData.data) {
          console.log(`🔍 [DEBUG] 状态矛盾: completed但没有数据，尝试从数据库获取`);
          
          // 尝试从数据库获取完整数据
          try {
            console.log(`🔍 [DEBUG] 从数据库查询书籍内容 - ID: ${resultGenerationId}`);
            const { data: dbStory, error: dbError } = await supabase
              .from('stories')
              .select('book_content, full_content, status, updated_at')
              .eq('id', resultGenerationId)
              .single();
            
            console.log(`🔍 [DEBUG] 数据库书籍内容查询结果:`, {
              hasData: !!dbStory,
              status: dbStory?.status,
              hasContent: !!(dbStory?.book_content || dbStory?.full_content),
              contentLength: (dbStory?.book_content || dbStory?.full_content)?.length,
              updatedAt: dbStory?.updated_at,
              dbError: dbError?.message
            });
            
            if (dbStory && (dbStory.book_content || dbStory.full_content)) {
              console.log(`🔍 [DEBUG] 从数据库获取到书籍内容，返回完整结果`);
              return new NextResponse(dbStory.book_content || dbStory.full_content, {
                headers: { 'Content-Type': 'text/markdown' }
              });
            } else if (dbStory && !dbStory.book_content && !dbStory.full_content) {
              console.log(`🔍 [DEBUG] 数据库中任务状态为completed但没有内容，可能是生成未完成`);
            }
          } catch (dbError) {
            console.error(`🔍 [DEBUG] 从数据库获取书籍内容失败:`, dbError);
          }
        }
        
        console.log(`🔍 [DEBUG] 任务未完成，返回进行中状态`);
        return NextResponse.json({
          success: false,
          error: "生成任务尚未完成",
          data: {
            status: generationData.status,
            progress: calculateProgress(generationData.status),
            debug: {
              hasData: !!generationData.data,
              hasError: !!generationData.error,
              lastUpdated: generationData.lastUpdated,
              timeSinceLastUpdate: Date.now() - (generationData.lastUpdated || 0)
            }
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: "无效的操作类型" },
          { status: 400 }
        );
    }
  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    console.error(`❌ [${new Date().toISOString()}] API调用失败，总耗时: ${totalDuration}ms -`, error);
    return NextResponse.json(
      {
        success: false,
        error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date().toISOString(),
        duration: totalDuration
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-story
 * 测试API连接
 */
export async function GET() {
  try {
    if (!config.apiKey) {
      return NextResponse.json(
        { success: false, error: '服务器配置错误：缺少API密钥' },
        { status: 500 }
      );
    }

    const { AIStoryGenerator } = await import('@/lib/ai-story-generator');
    const aiGenerator = new AIStoryGenerator(config);
    const isConnected = await aiGenerator.testConnection();

    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'API连接正常' : 'API连接失败',
    });

  } catch (error) {
    console.error('测试API连接时出错:', error);

    return NextResponse.json(
      {
        success: false,
        error: '测试API连接失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}