import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, generateScenes, generateParagraphsBounding, generateParagraphs, assembleFullBook, generateBookMarkdown } from '@/lib/ai-story-generator';
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
const isTestMode = config.apiKey === 'test-api-key-for-debugging';

// 存储生成状态的简单内存存储（生产环境应使用数据库）
const generationStatus = new Map<string, {
  status: 'pending' | 'outline' | 'scenes' | 'paragraphs_bounding' | 'paragraphs' | 'assemble' | 'completed' | 'error';
  progress: number;
  data?: any;
  error?: string;
  lastUpdated: number;
}>();

// 清理过期的生成状态（防止内存泄漏）
const cleanupExpiredStatus = () => {
  const now = Date.now();
  const EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

  for (const [key, value] of generationStatus.entries()) {
    if (now - value.lastUpdated > EXPIRE_TIME) {
      generationStatus.delete(key);
    }
  }
};

// 异步故事生成函数
const generateStoryAsync = async (storyElements: any, storyId: string) => {
  try {
    console.log(`🚀 开始异步生成故事 - ID: ${storyId}`);

    // 更新状态：开始生成大纲
    generationStatus.set(storyId, {
      status: 'outline',
      progress: 20,
      lastUpdated: Date.now()
    });

    // 生成大纲
    const { outline: outlineData, story_id } = await generateStoryOutline(
      storyId,
      storyElements.protagonist,
      storyElements.plot,
      storyElements.conflict,
      storyElements.outcome,
      storyElements.length
    );

    // 更新状态：开始生成场景
    generationStatus.set(storyId, {
      status: 'scenes',
      progress: 40,
      data: { outline: outlineData, story_id },
      lastUpdated: Date.now()
    });

    const allScenes = await generateScenes(outlineData, story_id);

    // 更新状态：开始生成段落边界
    generationStatus.set(storyId, {
      status: 'paragraphs_bounding',
      progress: 60,
      data: { outline: outlineData, story_id, scenes: allScenes },
      lastUpdated: Date.now()
    });

    let scenesArray = Array.isArray(allScenes) ? allScenes : [allScenes];

    const allParagraphsBounding = [];
    for (const chapterScenes of scenesArray) {
      const chapterParagraphs = await generateParagraphsBounding(outlineData, chapterScenes, story_id);
      allParagraphsBounding.push(...chapterParagraphs);
    }

    // 更新状态：生成完整场景内容
    generationStatus.set(storyId, {
      status: 'paragraphs',
      progress: 80,
      data: { outline: outlineData, story_id, scenes: allScenes, allParagraphs: allParagraphsBounding },
      lastUpdated: Date.now()
    });

    for (const chapterScenes of scenesArray) {
      await generateParagraphs(
        outlineData,
        chapterScenes,
        allParagraphsBounding,
        story_id
      );
    }

    // 更新状态：组装完整书籍
    generationStatus.set(storyId, {
      status: 'assemble',
      progress: 90,
      lastUpdated: Date.now()
    });

    const fullBook = await assembleFullBook(story_id);
    const bookMarkdown = generateBookMarkdown(fullBook);

    // 完成
    generationStatus.set(storyId, {
      status: 'completed',
      progress: 100,
      data: { bookMarkdown, story_id },
      lastUpdated: Date.now()
    });

    console.log(`✅ 异步生成完成 - ID: ${storyId}`);

  } catch (error) {
    console.error(`❌ 异步生成失败 - ID: ${storyId}:`, error);
    generationStatus.set(storyId, {
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : '生成失败',
      lastUpdated: Date.now()
    });
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
        const generationId = uuidv4();

        // 初始化状态
        generationStatus.set(generationId, {
          status: 'pending',
          progress: 10,
          lastUpdated: Date.now()
        });

        // 启动异步生成（不等待完成）
        const storyElements = { protagonist, plot, conflict, outcome, length };
        generateStoryAsync(storyElements, generationId).catch(error => {
          console.error('异步生成过程出错:', error);
        });

        // 立即返回生成ID
        return NextResponse.json({
          success: true,
          data: {
            generationId,
            message: '故事生成已启动，请使用生成ID查询进度'
          }
        });

      case 'check-status':
        // 检查生成状态
        const statusBody = await request.json();
        const { generationId: checkId } = statusBody;

        if (!checkId) {
          return NextResponse.json(
            { success: false, error: "缺少generationId参数" },
            { status: 400 }
          );
        }

        const status = generationStatus.get(checkId);
        if (!status) {
          return NextResponse.json(
            { success: false, error: "未找到对应的生成任务" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            status: status.status,
            progress: status.progress,
            error: status.error,
            completed: status.status === 'completed',
            lastUpdated: status.lastUpdated
          }
        });

      case 'get-result':
        // 获取生成结果
        const resultBody = await request.json();
        const { generationId: resultId } = resultBody;

        if (!resultId) {
          return NextResponse.json(
            { success: false, error: "缺少generationId参数" },
            { status: 400 }
          );
        }

        const result = generationStatus.get(resultId);
        if (!result) {
          return NextResponse.json(
            { success: false, error: "未找到对应的生成任务" },
            { status: 404 }
          );
        }

        if (result.status !== 'completed') {
          return NextResponse.json(
            {
              success: false,
              error: `任务尚未完成，当前状态: ${result.status}`,
              status: result.status,
              progress: result.progress
            },
            { status: 202 } // 202 Accepted - 任务进行中
          );
        }

        // 返回生成的故事内容
        if (result.data && result.data.bookMarkdown) {
          return new NextResponse(result.data.bookMarkdown, {
            headers: { 'Content-Type': 'text/markdown' }
          });
        } else {
          return NextResponse.json(
            { success: false, error: "生成结果数据缺失" },
            { status: 500 }
          );
        }

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

        let scenesArray = Array.isArray(paragraphsBody.scenes) ? paragraphsBody.scenes : [paragraphsBody.scenes];

        const allParagraphs = [];
        for (const chapterScenes of scenesArray) {
          if (isTestMode) {
            const testParagraphs = chapterScenes.scenes.map((scene: any) => ({
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

        let fullScenesArray = Array.isArray(fullBody.scenes) ? fullBody.scenes : [fullBody.scenes];

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