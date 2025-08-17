"use client";

import { useState, useEffect, useCallback } from "react";

// 调试日志：检查环境变量在客户端的加载情况
console.log('[DEBUG] 页面组件环境变量检查:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置');
import GenerateButton from "@/components/GenerateButton";
import StoryDisplay from "@/components/StoryDisplay";
import UnifiedSelector from "@/components/UnifiedSelector";
import GeneratedStoriesButton from "@/components/GeneratedStoriesButton";
import StoriesList, { StoryListItem } from "@/components/StoriesList";
import StoryContent from "@/components/StoryContent";
import { PlottoParser } from "@/lib/plotto-parser";
import { StoryGenerator } from "@/lib/story-generator";
import { PlottoData, CharacterLink } from "@/lib/plotto-parser";

// 主角类型接口定义
interface Protagonist {
  id: string;
  description: string;
}

// 从XML文件加载数据
const loadPlottoData = async (): Promise<PlottoData | null> => {
  try {
    // 在实际应用中，这里应该从API获取数据
    // 目前我们使用fetch来获取public目录下的XML文件
    const response = await fetch('/data/plotto.xml');
    const xmlContent = await response.text();

    const parser = new PlottoParser();
    parser.parse(xmlContent);
    return parser.getParsedData();
  } catch (error) {
    console.error('加载Plotto数据失败:', error);
    return null;
  }
};

// 转换后的元素类型
interface TransformedElement {
  id: string;
  name: string;
  description: string;
  details?: string;
  leadUps?: Array<{
    mode: string;
    conflictLinks: Array<{
      ref: string;
      category: string;
      subcategory: string;
    }>;
  }>;
  carryOns?: Array<{
    mode: string;
    conflictLinks: Array<{
      ref: string;
      category: string;
      subcategory: string;
    }>;
  }>;
  includes?: Array<{
    mode: string;
    conflictLinks: Array<{
      ref: string;
      category: string;
      subcategory: string;
    }>;
  }>;
}

// 选择的元素类型
interface SelectedElements {
  characters: string[];
  subjects: string[];
  predicates: string | null;
  conflicts: string[];
  outcomes: string[];
}

export default function Home() {
  const [plottoData, setPlottoData] = useState<PlottoData | null>(null);
  const [storyGenerator, setStoryGenerator] = useState<StoryGenerator | null>(null);
  const [selectedElements, setSelectedElements] = useState<SelectedElements>({
    characters: [],
    subjects: [],
    predicates: null,
    conflicts: [],
    outcomes: [],
  });
  const [generatedStory, setGeneratedStory] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedProtagonist, setSelectedProtagonist] = useState<Protagonist | null>(null);
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('short');
  const [generationStage, setGenerationStage] = useState<'idle' | 'outline' | 'scenes' | 'paragraphs_bounding' | 'paragraphs' | 'assemble'>('idle');
  const [progress, setProgress] = useState(0);

  // 新增：异步生成相关状态
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // 新增：已生成故事相关状态
  const [showStoriesList, setShowStoriesList] = useState<boolean>(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState<boolean>(false);
  const [storiesError, setStoriesError] = useState<string | null>(null);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      const data = await loadPlottoData();
      if (data) {
        setPlottoData(data);
        setStoryGenerator(new StoryGenerator(data));
      }
    };

    initializeData();
  }, []);

  // 清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // 获取生成结果的函数
  const getGenerationResult = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/generate-story?action=get-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: id })
      });

      if (response.ok) {
        const storyContent = await response.text();
        setGeneratedStory(storyContent);
        setIsGenerating(false);
        setGenerationStage('idle');
        setProgress(100);

        // 清理轮询
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }

        console.log('✅ 故事生成完成');
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.error || '获取结果失败');
      }
    } catch (error) {
      console.error('获取生成结果失败:', error);
      setIsGenerating(false);
      setGenerationStage('idle');
      setProgress(0);
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      alert(`获取结果失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [setGeneratedStory, setIsGenerating, setGenerationStage, setProgress, pollInterval, setPollInterval]);

  // 轮询生成状态的函数
  const pollGenerationStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/generate-story?action=check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: id })
      });

      const result = await response.json();

      if (result.success) {
        const { status, progress: statusProgress, error, completed } = result.data;

        // 更新进度和状态
        setProgress(statusProgress);
        setGenerationStage(status);

        if (completed) {
          // 生成完成，获取结果
          await getGenerationResult(id);
        } else if (status === 'error') {
          // 生成出错
          setIsGenerating(false);
          setGenerationStage('idle');
          setProgress(0);
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          alert(`生成失败：${error || '未知错误'}`);
        }
        // 如果还在进行中，继续轮询
      } else {
        console.error('轮询状态失败:', result.error);
        // 如果找不到任务，停止轮询
        if (response.status === 404) {
          setIsGenerating(false);
          setGenerationStage('idle');
          setProgress(0);
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          alert('生成任务已过期或不存在');
        }
      }
    } catch (error) {
      console.error('轮询状态出错:', error);
    }
  }, [pollInterval, getGenerationResult]);

  const handleSelectElement = (category: keyof SelectedElements, elementId: string) => {
    setSelectedElements(prev => {
      // 如果是 predicates 或 outcomes，直接替换为新的选择（单选）
      if (category === 'predicates' || category === 'outcomes') {
        return {
          ...prev,
          [category]: prev[category] === elementId ? null : elementId
        };
      }

      // 其他类别保持多选逻辑
      const categoryElements = prev[category] as string[];
      const isSelected = categoryElements.includes(elementId);

      // 如果是冲突类别且是新增选择，需要检查是否是前置冲突
      if (category === 'conflicts' && !isSelected) {
        // 查找当前选中的最后一个冲突
        const lastConflictId = categoryElements[categoryElements.length - 1];

        // 如果有已选冲突，检查新选择的冲突是否是最后一个冲突的前置冲突
        if (lastConflictId && plottoData) {
          const lastConflict = plottoData.conflicts.find(c => c.id === lastConflictId);

          // 检查新冲突是否是最后一个冲突的前置冲突
          const isLeadUpConflict = lastConflict?.leadUps?.some(group =>
            group.conflictLinks.some(link => link.ref === elementId)
          );

          if (isLeadUpConflict) {
            // 如果是前置冲突，插入到最后一个冲突的前面
            const lastConflictIndex = categoryElements.length - 1;
            return {
              ...prev,
              [category]: [
                ...categoryElements.slice(0, lastConflictIndex),
                elementId,
                categoryElements[lastConflictIndex]
              ]
            };
          }
        }
      }

      return {
        ...prev,
        [category]: isSelected
          ? categoryElements.filter(id => id !== elementId)
          : [...categoryElements, elementId]
      };
    });
  };

  const handleGenerateStory = async () => {
    if (!storyGenerator) {
      alert("数据尚未加载完成，请稍后再试。");
      return;
    }

    // 检查是否选择了必要的故事元素
    if (!selectedProtagonist && !selectedElements.predicates && !selectedElements.conflicts.length && !selectedElements.outcomes.length) {
      alert("请至少选择一个故事元素（主角类型、情节发展、冲突或故事结局）");
      return;
    }

    setIsGenerating(true);
    setGenerationStage('outline');
    setProgress(10);

    try {
      // 构建故事元素参数
      const storyElements = {
        protagonist: selectedProtagonist?.description || "未指定主角类型",
        plot: selectedElements.predicates ?
          transformedData.predicates.find(p => p.id === selectedElements.predicates)?.description || "未指定情节发展" :
          "未指定情节发展",
        conflict: selectedElements.conflicts.length > 0 ?
          selectedElements.conflicts.map(id => {
            const conflict = transformedData.conflicts.find(c => c.id === id);
            return conflict?.details || id;
          }).join('、') :
          "未指定冲突",
        outcome: selectedElements.outcomes.length > 0 ?
          transformedData.outcomes.find(o => o.id === selectedElements.outcomes[0])?.description || "未指定故事结局" :
          "未指定故事结局",
        length: selectedLength
      };

      console.log('=== 发送到API的故事元素 ===');
      console.log('主角类型:', storyElements.protagonist);
      console.log('情节发展:', storyElements.plot);
      console.log('主要冲突:', storyElements.conflict);
      console.log('故事结局:', storyElements.outcome);
      console.log('===========================');

      // 启动异步生成
      const response = await fetch('/api/generate-story?action=generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyElements)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '启动生成失败');
      }

      // 获取生成ID并开始轮询
      const newGenerationId = result.data.generationId;
      setGenerationId(newGenerationId);

      console.log(`🔄 开始轮询生成状态 - ID: ${newGenerationId}`);

      // 设置轮询定时器（每3秒检查一次状态）
      const interval = setInterval(() => {
        pollGenerationStatus(newGenerationId);
      }, 3000);

      setPollInterval(interval);

      // 立即检查一次状态
      pollGenerationStatus(newGenerationId);

    } catch (error) {
      setIsGenerating(false);
      setGenerationStage('idle');
      setProgress(0);
      console.error("生成失败:", error);
      alert(`启动生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理显示故事列表
  const handleShowStoriesList = async () => {
    setIsLoadingStories(true);
    setStoriesError(null);

    try {
      const response = await fetch('/api/stories/list');
      const result = await response.json();

      if (result.success) {
        setStories(result.data || []);
        setShowStoriesList(true);
        setSelectedStoryId(null); // 重置选中的故事
      } else {
        setStoriesError(result.error || '获取故事列表失败');
        console.error('获取故事列表失败:', result.error);
      }
    } catch (error) {
      console.error('获取故事列表失败:', error);
      setStoriesError('网络错误，请稍后重试');
    } finally {
      setIsLoadingStories(false);
    }
  };

  // 处理返回到故事生成器
  const handleBackToGenerator = () => {
    setShowStoriesList(false);
    setSelectedStoryId(null);
    setStories([]);
    setStoriesError(null);
    // 重置滚动位置到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理阅读故事
  const handleReadStory = (storyId: string) => {
    setSelectedStoryId(storyId);
    setShowStoriesList(false);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理关闭故事内容
  const handleCloseStoryContent = () => {
    setSelectedStoryId(null);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 替换描述中的角色标识符为角色描述
  const replaceCharacterReferences = (description: string, characterLinks: CharacterLink[]): string => {
    if (!plottoData?.characters || plottoData.characters.length === 0) {
      return description;
    }

    let result = description;

    // 创建所有可用角色的映射，优先使用 characterLinks 中的角色
    const characterMap = new Map<string, string>();

    // 首先添加所有在 XML 中定义的角色
    plottoData.characters.forEach(character => {
      characterMap.set(character.designation, character.description);
    });

    // 如果有 characterLinks，优先使用这些角色（可能包含动态转换的角色）
    if (characterLinks && characterLinks.length > 0) {
      characterLinks.forEach(link => {
        if (link.ref) {
          // 从 XML 角色定义中查找描述
          const character = plottoData.characters.find(char => char.designation === link.ref);
          if (character) {
            characterMap.set(link.ref, character.description);
          }
        }
      });
    }

    // 按长度倒序排序角色标识符，确保长的标识符优先匹配（如 A-2 在 A 之前匹配）
    const sortedDesignations = Array.from(characterMap.keys()).sort((a, b) => b.length - a.length);

    for (const designation of sortedDesignations) {
      const characterDescription = characterMap.get(designation);
      if (!designation || !characterDescription) continue;

      // 转义正则表达式中的特殊字符
      const escapedRef = designation.replace(/[.*+?^${}()|[\]\\]/g, '\\  // 处理返回到');
      const regexPattern = `\\b${escapedRef}\\b`;

      // 执行替换
      result = result.replace(new RegExp(regexPattern, 'g'), characterDescription);
    }

    return result;
  };

  // 转换Plotto数据为页面组件可使用的格式
  const transformData = (): {
    characters: TransformedElement[];
    subjects: TransformedElement[];
    predicates: TransformedElement[];
    conflicts: TransformedElement[];
    outcomes: TransformedElement[];
  } => {
    if (!plottoData) return {
      characters: [],
      subjects: [],
      predicates: [],
      conflicts: [],
      outcomes: []
    };

    return {
      characters: plottoData.characters.map(char => ({
        id: char.designation,
        name: `${char.designation} (${char.sex})`,
        description: char.description
      })),
      subjects: plottoData.subjects.map(subj => ({
        id: subj.number.toString(),
        name: `主题 ${subj.number}`,
        description: subj.description
      })),
      predicates: plottoData.predicates.map(pred => ({
        id: pred.number.toString(),
        name: `谓语 ${pred.number}`,
        description: pred.description,
        conflictLinks: pred.conflictLinks
      })),
      conflicts: plottoData.conflicts.map(conf => ({
        id: conf.id,
        name: `冲突 ${conf.id}`,
        description: `${conf.category} - ${conf.subcategory}`,
        details: conf.permutations.length > 0
          ? replaceCharacterReferences(conf.permutations[0].description, conf.permutations[0].characterLinks)
          : "无详细描述",
        leadUps: conf.leadUps,
        carryOns: conf.carryOns,
        includes: conf.includes
      })),
      outcomes: plottoData.outcomes.map(outcome => ({
        id: outcome.number.toString(),
        name: `故事结局 ${outcome.number}`,
        description: outcome.description
      }))
    };
  };

  const transformedData = transformData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">小说写作助手</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            打造一个智能、直观、可个性化的写作辅助工具。
          </p>
        </header>

        {!plottoData ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">正在加载数据...</p>
          </div>
        ) : (
          <>
            <UnifiedSelector
              protagonists={transformedData.subjects.map(subject => ({
                id: subject.id,
                description: subject.description
              }))}
              selectedProtagonist={selectedProtagonist}
              onProtagonistChange={setSelectedProtagonist}

              predicates={transformedData.predicates}
              selectedPredicate={selectedElements.predicates}
              onPredicateChange={(id: string) => handleSelectElement('predicates', id)}

              outcomes={transformedData.outcomes}
              selectedOutcome={selectedElements.outcomes.length > 0 ? selectedElements.outcomes[0] : null}
              onOutcomeChange={(id: string) => handleSelectElement('outcomes', id)}

              conflicts={transformedData.conflicts}
              selectedConflicts={selectedElements.conflicts}
              onConflictSelect={(id: string) => handleSelectElement('conflicts', id)}
              onConflictRemove={(id: string) => handleSelectElement('conflicts', id)}

              selectedLength={selectedLength}
              onLengthChange={setSelectedLength}
            />

            <div className="flex justify-center gap-4 mb-12">
              <GenerateButton
                onClick={handleGenerateStory}
                disabled={isGenerating}
                isGenerating={isGenerating}
                progress={progress}
                stage={generationStage}
              />
              <GeneratedStoriesButton
                onClick={handleShowStoriesList}
                disabled={isLoadingStories}
                isLoading={isLoadingStories}
              />
            </div>

            {/* 进度指示器 */}
            {generationStage !== 'idle' && (
              <div className="progress-container mb-8">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                <div className="progress-label">
                  {generationStage === 'outline' && "生成大纲中..."}
                  {generationStage === 'scenes' && "生成场景中..."}
                  {generationStage === 'paragraphs_bounding' && "生成段落边界中..."}
                  {generationStage === 'paragraphs' && "生成段落内容中..."}
                  {generationStage === 'assemble' && "组装完整书籍中..."}
                  {isGenerating && (
                    <div className="text-sm text-gray-500 mt-2">
                      这可能需要几分钟时间，请耐心等待...
                      {generationId && (
                        <div className="text-xs mt-1">
                          生成ID: {generationId}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {generatedStory && (
              <StoryDisplay story={generatedStory} />
            )}

            {/* 已生成故事列表 */}
            {showStoriesList && (
              <div className="mt-8 animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">已生成的故事</h2>
                  <button
                    onClick={handleBackToGenerator}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回
                  </button>
                </div>
                <StoriesList
                  stories={stories}
                  onReadStory={handleReadStory}
                  isLoading={isLoadingStories}
                  error={storiesError}
                />
              </div>
            )}

            {/* 故事内容显示 */}
            {selectedStoryId && (
              <StoryContent
                storyId={selectedStoryId}
                onClose={handleCloseStoryContent}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}