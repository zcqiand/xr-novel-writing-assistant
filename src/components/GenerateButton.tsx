import React from 'react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  progress?: number;
  stage?: string;
}

export default function GenerateButton({
  onClick,
  disabled = false,
  isGenerating = false,
  progress = 0,
  stage = ''
}: GenerateButtonProps) {

  const getButtonText = () => {
    if (!isGenerating) {
      return '生成故事';
    }

    const stageTexts: { [key: string]: string } = {
      'outline': '构思大纲',
      'scenes': '设计场景',
      'paragraphs_bounding': '设计段落',
      'paragraphs': '编写段落',
      'assemble': '组装成书'
    };

    const stageText = stageTexts[stage] || '生成中';
    return `${stageText}... ${Math.round(progress)}%`;
  };

  const getLoadingIcon = () => {
    if (!isGenerating) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg
        className="animate-spin h-5 w-5 mr-2"
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
    );
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 
          text-white font-bold rounded-xl shadow-lg 
          hover:from-purple-700 hover:to-indigo-700 
          transform hover:scale-105 transition-all duration-300 ease-in-out
          min-w-[200px]
          ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
        `}
      >
        <span className="flex items-center justify-center">
          {getLoadingIcon()}
          <span className="text-center">{getButtonText()}</span>
        </span>

        {/* 进度条 */}
        {isGenerating && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
            <div
              className="h-full bg-white/60 transition-all duration-500 ease-out rounded-b-xl"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>

      {/* 提示文本 */}
      {isGenerating && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-sm text-gray-600 text-center whitespace-nowrap">
          <div className="bg-white px-3 py-1 rounded-lg shadow-sm border">
            🤖 AI正在创作中，请稍候...
          </div>
        </div>
      )}
    </div>
  );
}