import React from 'react';

/**
 * 书籍类型枚举
 */
export type StoryType = 'short' | 'medium' | 'long';

/**
 * 书籍列表项接口
 */
export interface StoryListItem {
  id: string;
  title: string;
  type: StoryType;
  protagonist: string;
  created_at: string;
  updated_at: string;
}

/**
 * 组件Props接口
 */
interface StoriesListProps {
  stories: StoryListItem[];
  onReadStory: (storyId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 书籍列表显示组件
 * 
 * 功能：
 * - 显示从API获取的书籍列表
 * - 每个书籍项显示：书籍类型、书籍名称、创建日期、阅读按钮
 * - 按创建日期倒序排序（由后端API处理）
 * - 点击阅读按钮触发回调函数
 * 
 * 状态处理：
 * - 加载状态显示
 * - 错误状态显示
 * - 空列表状态显示
 * 
 * UI设计：
 * - 使用Tailwind CSS进行样式设计
 * - 响应式布局，适配不同屏幕尺寸
 * - 书籍类型显示为中文（short-短篇，medium-中篇，long-长篇）
 * - 创建日期格式化为易读格式
 * - 阅读按钮使用合适的样式和图标
 * - 添加适当的间距和卡片式设计
 */
export default function StoriesList({
  stories,
  onReadStory,
  isLoading = false,
  error
}: StoriesListProps) {
  /**
   * 格式化书籍类型为中文显示
   */
  const formatStoryType = (type: StoryType): string => {
    const typeMap: Record<StoryType, string> = {
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
    } catch {
      return dateString;
    }
  };

  /**
   * 获取书籍类型的颜色样式
   */
  const getStoryTypeColor = (type: StoryType): string => {
    const colorMap: Record<StoryType, string> = {
      short: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-green-100 text-green-800 border-green-200',
      long: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 加载状态显示
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-md">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
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
            <span className="text-gray-700 font-medium">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 font-medium">加载失败</span>
          </div>
          <p className="text-red-600 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // 空列表状态显示
  if (stories.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无书籍</h3>
          <p className="text-gray-500 text-sm">还没有生成任何书籍，点击&ldquo;生成故事&rdquo;开始创作吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {stories.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    主角：{story.protagonist}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStoryTypeColor(story.type)}`}
                >
                  {formatStoryType(story.type)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDate(story.created_at)}
                </div>

                <button
                  onClick={() => onReadStory(story.id)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-1.414m-2.828 2.828a9 9 0 010-12.728"
                    />
                  </svg>
                  阅读
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}