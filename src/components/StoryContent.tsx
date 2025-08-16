import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * 角色信息接口
 */
interface Character {
  name: string;
  description: string;
}

/**
 * 章节摘要接口
 */
interface Chapter {
  chapter: number;
  title: string;
  summary: string;
}

/**
 * 故事大纲接口
 */
interface StoryOutline {
  title: string;
  characters: Character[];
  chapters: Chapter[];
}

/**
 * 场景数据接口
 */
interface SceneData {
  sceneNumber: number;
  summary: string;
}

/**
 * 章节场景数据接口
 */
interface ChapterScenes {
  chapter_number: number;
  scenes_data: {
    scenes: SceneData[];
  };
}

/**
 * 场景段落内容接口
 */
interface SceneParagraphs {
  id: string;
  story_id: string;
  chapter_number: number;
  scene_number: number;
  title: string;
  full_content: string;
  continuity_notes: string[];
}

/**
 * 场景段落边界接口
 */
interface SceneParagraphsBounding {
  id: string;
  story_id: string;
  chapter_number: number;
  scene_number: number;
  title: string;
  opening_paragraph: string;
  closing_paragraph: string;
}

/**
 * 完整书籍数据接口
 */
interface FullStoryData {
  id: string;
  title: string;
  protagonist: string;
  plot: string;
  conflict: string;
  outcome: string;
  length: 'short' | 'medium' | 'long';
  outline_data: StoryOutline;
  created_at: string;
  updated_at: string;
  chapter_scenes: ChapterScenes[];
  scene_paragraphs: SceneParagraphs[];
  scene_paragraphs_bounding: SceneParagraphsBounding[];
}

/**
 * 组件Props接口
 */
interface StoryContentProps {
  storyId: string;
  onClose: () => void;
  isLoading?: boolean;
  error?: string;
}

/**
 * 书籍内容显示组件
 * 
 * 功能：
 * - 显示完整书籍内容
 * - 支持从数据库获取完整的书籍数据（包括大纲、章节、场景、段落等）
 * - 格式化显示书籍内容，使其具有良好的可读性
 * - 提供返回按钮或关闭功能
 * 
 * 数据获取：
 * - 使用现有的supabase客户端获取书籍相关数据
 * - 从多个表关联查询完整内容
 * - 实现适当的错误处理
 * 
 * 状态处理：
 * - 加载状态显示
 * - 错误状态显示
 * - 空内容状态显示
 * 
 * UI设计：
 * - 使用Tailwind CSS进行样式设计
 * - 响应式布局，适配不同屏幕尺寸
 * - 内容区域支持滚动
 * - 清晰的章节和场景层次结构
 * - 适当的字体大小和行间距
 * - 返回/关闭按钮的样式设计
 */
export default function StoryContent({
  storyId,
  onClose,
  isLoading = false,
  error
}: StoryContentProps) {
  /**
   * 组件状态
   */
  const [storyData, setStoryData] = useState<FullStoryData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  /**
   * 获取完整书籍数据
   */
  const fetchFullStoryData = async () => {
    if (!storyId) return;

    // 调试日志：检查 Supabase 客户端状态
    console.log('[DEBUG] StoryContent fetchFullStoryData:');
    console.log('- storyId:', storyId);
    console.log('- supabase 客户端存在:', !!supabase);
    console.log('- supabase 客户端状态:', supabase ? '已初始化' : '未初始化');

    setIsDataLoading(true);
    setDataError(null);

    try {
      // 获取基本信息
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) {
        throw new Error(`获取故事基本信息失败: ${storyError.message}`);
      }

      // 获取章节场景数据
      const { data: chapterScenes, error: chapterScenesError } = await supabase
        .from('story_chapter_scenes')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true });

      if (chapterScenesError) {
        throw new Error(`获取章节场景数据失败: ${chapterScenesError.message}`);
      }

      // 获取场景段落内容数据
      const { data: sceneParagraphs, error: sceneParagraphsError } = await supabase
        .from('story_chapter_scene_paragraphs')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true })
        .order('scene_number', { ascending: true });

      if (sceneParagraphsError) {
        throw new Error(`获取场景段落内容数据失败: ${sceneParagraphsError.message}`);
      }

      // 获取场景段落边界数据
      const { data: sceneParagraphsBounding, error: sceneParagraphsBoundingError } = await supabase
        .from('story_chapter_scene_paragraphs_bounding')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true })
        .order('scene_number', { ascending: true });

      if (sceneParagraphsBoundingError) {
        throw new Error(`获取场景段落边界数据失败: ${sceneParagraphsBoundingError.message}`);
      }

      // 合并所有数据
      const fullStoryData: FullStoryData = {
        ...story,
        chapter_scenes: chapterScenes || [],
        scene_paragraphs: sceneParagraphs || [],
        scene_paragraphs_bounding: sceneParagraphsBounding || []
      };

      setStoryData(fullStoryData);
    } catch (error) {
      console.error('获取书籍数据失败:', error);
      setDataError(error instanceof Error ? error.message : '获取书籍数据失败');
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    if (storyId) {
      fetchFullStoryData();
    }
  }, [storyId]);

  /**
   * 格式化书籍类型为中文显示
   */
  const formatStoryType = (type: 'short' | 'medium' | 'long'): string => {
    const typeMap: Record<'short' | 'medium' | 'long', string> = {
      short: '短篇',
      medium: '中篇',
      long: '长篇'
    };
    return typeMap[type] || type;
  };

  /**
   * 格式化日期为易读格式
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * 获取书籍类型的颜色样式
   */
  const getStoryTypeColor = (type: 'short' | 'medium' | 'long'): string => {
    const colorMap: Record<'short' | 'medium' | 'long', string> = {
      short: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-green-100 text-green-800 border-green-200',
      long: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  /**
   * 渲染角色介绍
   */
  const renderCharacters = (characters: Character[]) => {
    if (!characters || characters.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          角色介绍
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {characters.map((character, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-400">
              <h4 className="font-semibold text-gray-800 mb-2">{character.name}</h4>
              <p className="text-gray-600 text-sm">{character.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * 渲染章节大纲
   */
  const renderChapterOutline = (chapters: Chapter[]) => {
    if (!chapters || chapters.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          章节大纲
        </h3>
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">
                  第{chapter.chapter}章 - {chapter.title}
                </h4>
                <span className="text-sm text-gray-500">章节 {index + 1}/{chapters.length}</span>
              </div>
              <p className="text-gray-600 text-sm">{chapter.summary}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * 计算文本字数
   */
  const calculateWordCount = (text: string): number => {
    if (!text) return 0;
    // 移除空白字符后计算字符数
    return text.replace(/\s/g, '').length;
  };

  /**
   * 计算书籍总字数
   */
  const calculateTotalWordCount = (): number => {
    if (!storyData?.scene_paragraphs) return 0;

    let totalWords = 0;
    storyData.scene_paragraphs.forEach(scene => {
      totalWords += calculateWordCount(scene.full_content);
    });

    return totalWords;
  };

  /**
   * 计算每章字数
   */
  const calculateChapterWordCounts = (): { [key: number]: number } => {
    if (!storyData?.scene_paragraphs) return {};

    const chapterWordCounts: { [key: number]: number } = {};

    storyData.scene_paragraphs.forEach(scene => {
      if (!chapterWordCounts[scene.chapter_number]) {
        chapterWordCounts[scene.chapter_number] = 0;
      }
      chapterWordCounts[scene.chapter_number] += calculateWordCount(scene.full_content);
    });

    return chapterWordCounts;
  };

  /**
   * 获取章节标题
   */
  const getChapterTitle = (chapterNumber: number): string => {
    if (!storyData?.outline_data?.chapters) return `第${chapterNumber}章`;

    const chapter = storyData.outline_data.chapters.find(ch => ch.chapter === chapterNumber);
    return chapter ? `第${chapterNumber}章 - ${chapter.title}` : `第${chapterNumber}章`;
  };

  /**
   * 渲染章节内容
   */
  const renderChapterContent = () => {
    if (!storyData?.scene_paragraphs || storyData.scene_paragraphs.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">暂无章节内容</p>
        </div>
      );
    }

    // 按章节分组场景内容
    const chaptersByNumber: { [key: number]: SceneParagraphs[] } = {};
    storyData.scene_paragraphs.forEach(scene => {
      if (!chaptersByNumber[scene.chapter_number]) {
        chaptersByNumber[scene.chapter_number] = [];
      }
      chaptersByNumber[scene.chapter_number].push(scene);
    });

    // 计算各章字数
    const chapterWordCounts = calculateChapterWordCounts();
    const totalWordCount = calculateTotalWordCount();

    return (
      <div className="space-y-8">
        {/* 显示书籍总字数 */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-800">书籍总字数</span>
            <span className="text-lg font-bold text-yellow-900">{totalWordCount.toLocaleString()} 字</span>
          </div>
        </div>

        {Object.entries(chaptersByNumber).map(([chapterNumber, scenes]) => {
          const chapterWordCount = chapterWordCounts[parseInt(chapterNumber)] || 0;
          const chapterTitle = getChapterTitle(parseInt(chapterNumber));

          return (
            <div key={chapterNumber} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {chapterTitle}
                  </h3>
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {chapterWordCount.toLocaleString()} 字
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {scenes.map((scene) => (
                  <div key={scene.id} className="border-l-4 border-green-400 pl-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {scene.full_content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * 加载状态显示
   */
  if (isLoading || isDataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载中...</h3>
            <p className="text-gray-500 text-sm">正在获取书籍内容，请稍候...</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 错误状态显示
   */
  if (error || dataError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-500 text-sm mb-4">
              {error || dataError || '获取书籍内容时发生错误'}
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 空内容状态显示
   */
  if (!storyData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
            <p className="text-gray-500 text-sm mb-4">未找到书籍内容</p>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{storyData.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              主角：{storyData.protagonist}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              类型：
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium border ${getStoryTypeColor(storyData.length)}`}>
                {formatStoryType(storyData.length)}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              创建：{formatDate(storyData.created_at)}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 故事概要 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              故事概要
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-400">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">情节</h4>
                  <p className="text-gray-600 text-sm">{storyData.plot}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">主要冲突</h4>
                  <p className="text-gray-600 text-sm">{storyData.conflict}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">故事结局</h4>
                  <p className="text-gray-600 text-sm">{storyData.outcome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 角色介绍 */}
          {renderCharacters(storyData.outline_data.characters)}

          {/* 章节大纲 */}
          {renderChapterOutline(storyData.outline_data.chapters)}

          {/* 章节内容 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              章节内容
            </h3>
            {renderChapterContent()}
          </div>
        </div>

        {/* 底部 */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>最后更新：{formatDate(storyData.updated_at)}</div>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}