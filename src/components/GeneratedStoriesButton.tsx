import React from 'react';

interface GeneratedStoriesButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * 已生成故事按钮组件
 * 用于显示和管理已生成的故事列表
 * 支持加载状态和禁用状态
 */
export default function GeneratedStoriesButton({ onClick, disabled = false, isLoading = false }: GeneratedStoriesButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"
            clipRule="evenodd"
          />
        </svg>
        {isLoading ? '加载中...' : '已生成故事'}
      </span>
    </button>
  );
}