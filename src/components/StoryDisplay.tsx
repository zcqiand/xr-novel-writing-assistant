import React from 'react';

interface StoryDisplayProps {
  story: string;
}

export default function StoryDisplay({ story }: StoryDisplayProps) {
  // 解析故事文本，提取各个部分
  const parseStory = (storyText: string) => {
    if (!storyText) return null;

    const sections = {
      characters: '',
      subjects: '',
      predicates: '',
      conflicts: '',
      outcomes: '',
      leadUps: '',
      carryOns: '',
      includes: ''
    };

    // 按行分割故事文本
    const lines = storyText.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.includes('角色介绍：')) {
        currentSection = 'characters';
        sections.characters += line + '\n';
      } else if (line.includes('故事主题：')) {
        currentSection = 'subjects';
        sections.subjects += line + '\n';
      } else if (line.includes('情节发展：')) {
        currentSection = 'predicates';
        sections.predicates += line + '\n';
      } else if (line.includes('主要冲突：')) {
        currentSection = 'conflicts';
        sections.conflicts += line + '\n';
      } else if (line.includes('故事结局：')) {
        currentSection = 'outcomes';
        sections.outcomes += line + '\n';
      } else if (line.includes('在冲突') && line.includes('发生之前：')) {
        currentSection = 'leadUps';
        sections.leadUps += line + '\n';
      } else if (line.includes('在冲突') && line.includes('发生之后：')) {
        currentSection = 'carryOns';
        sections.carryOns += line + '\n';
      } else if (line.includes('与冲突') && line.includes('同时发生的事件：')) {
        currentSection = 'includes';
        sections.includes += line + '\n';
      } else if (line.includes('故事结束。')) {
        break;
      } else if (currentSection && line.trim() !== '') {
        sections[currentSection as keyof typeof sections] += line + '\n';
      }
    }

    return sections;
  };

  const sections = parseStory(story);

  if (!sections) {
    return null;
  }

  // 渲染部分的函数
  const renderSection = (title: string, content: string, color: string) => {
    if (!content) return null;

    // 移除标题行并清理内容
    const contentLines = content.split('\n').filter(line => line.trim() !== '' && !line.includes(title));
    if (contentLines.length === 0) return null;

    return (
      <div className={`border-l-4 ${color} pl-4 py-2 mb-6`}>
        <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
        <div className="space-y-2">
          {contentLines.map((line, index) => (
            <p key={index} className="text-gray-700 whitespace-pre-wrap">
              {line.replace(/^- /, '• ')}
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-purple-200">
        生成的故事
      </h2>

      <div className="space-y-6">
        {renderSection('角色介绍', sections.characters, 'border-purple-500')}
        {renderSection('故事主题', sections.subjects, 'border-blue-500')}
        {renderSection('情节发展', sections.predicates, 'border-green-500')}
        {renderSection('主要冲突', sections.conflicts, 'border-red-500')}
        {renderSection('故事结局', sections.outcomes, 'border-yellow-500')}
        {renderSection('前置冲突', sections.leadUps, 'border-indigo-500')}
        {renderSection('后续冲突', sections.carryOns, 'border-pink-500')}
        {renderSection('包含冲突', sections.includes, 'border-teal-500')}
      </div>

      {story && !sections.characters && !sections.subjects && !sections.predicates &&
        !sections.conflicts && !sections.outcomes && (
          <div className="whitespace-pre-wrap text-gray-700">
            {story}
          </div>
        )}
    </div>
  );
}