"use client";

import { useState, useEffect } from "react";
import GenerateButton from "@/components/GenerateButton";
import StoryDisplay from "@/components/StoryDisplay";
import UnifiedSelector from "@/components/UnifiedSelector";
import RefreshButton from "@/components/RefreshButton";
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
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [generationStage, setGenerationStage] = useState<'idle' | 'outline' | 'scenes' | 'paragraphs' | 'full' | 'assemble'>('idle');
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
    setProgress(25);

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

      // 第一回合：生成大纲
      const outlineRes = await fetch('/api/generate-story?stage=outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyElements)
      });
      const outlineData = await outlineRes.json();

      setGenerationStage('scenes');
      setProgress(50);

      // 第二回合：生成场景
      const scenesRes = await fetch('/api/generate-story?stage=scenes', {
        method: 'POST',
        body: JSON.stringify({ outline: outlineData }),
        headers: { 'Content-Type': 'application/json' }
      });
      const scenesData = await scenesRes.json();

      setGenerationStage('paragraphs');
      setProgress(75);

      // 第三回合：生成段落 - 传递所有章节
      const paragraphsRes = await fetch('/api/generate-story?stage=paragraphs', {
        method: 'POST',
        body: JSON.stringify({
          outline: outlineData,
          scenes: scenesData // 传递所有章节，而不是只传递第一个
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const paragraphsData = await paragraphsRes.json();

      setGenerationStage('full');
      setProgress(90);

      // 第四回合：生成场景完整内容 - 传递所有章节
      const fullRes = await fetch('/api/generate-story?stage=full', {
        method: 'POST',
        body: JSON.stringify({
          outline: outlineData,
          scenes: scenesData, // 传递所有章节，而不是只传递第一个
          paragraphs: paragraphsData
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      setGeneratedStory(await fullRes.text());

      setGenerationStage('assemble');
      setProgress(95);

      // 第五回合：组装完整书籍
      // 首先保存大纲文件到data目录
      const safeTitle = (outlineData.title || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const outlineFilePath = `data/${safeTitle}-story-outline.json`;

      const assembleRes = await fetch('/api/generate-story?stage=assemble', {
        method: 'POST',
        body: JSON.stringify({ outlineFilePath }),
        headers: { 'Content-Type': 'application/json' }
      });
      const assembledBook = await assembleRes.text();

      setGenerationStage('idle');
      setProgress(100);
      setGeneratedStory(assembledBook);
    } catch (error) {
      setGenerationStage('idle');
      setProgress(0);
      console.error("生成失败:", error);
      alert("生成故事时出错，请查看控制台了解详情。");
    } finally {
      setIsGenerating(false);
    }
  };

  // 刷新书籍内容
  const handleRefreshBook = async () => {
    if (!generatedStory) {
      alert("请先生成故事内容");
      return;
    }

    setIsRefreshing(true);
    try {
      // 获取最新故事的大纲数据
      const outlineRes = await fetch('/api/generate-story?stage=outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });
      const outlineData = await outlineRes.json();
      console.log('重新生成大纲数据:', outlineData);

      // 重新组装完整书籍
      const assembleRes = await fetch('/api/generate-story?stage=assemble', {
        method: 'POST',
        body: JSON.stringify({ outlineFilePath: 'data/latest-story-outline.json' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const refreshedBook = await assembleRes.text();

      setGeneratedStory(refreshedBook);
      console.log("书籍内容刷新成功");
    } catch (error) {
      console.error("刷新书籍失败:", error);
      alert("刷新书籍时出错，请查看控制台了解详情。");
    } finally {
      setIsRefreshing(false);
    }
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
      const escapedRef = designation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        name: `谓词 ${pred.number}`,
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
        carryOns: conf.carryOns
        ,
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
              />
              <RefreshButton
                onClick={handleRefreshBook}
                disabled={isRefreshing}
                isLoading={isRefreshing}
              />
            </div>

            {/* 进度指示器 */}
            {generationStage !== 'idle' && (
              <div className="progress-container mb-8">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                <div className="progress-label">
                  {generationStage === 'outline' && "生成大纲中..."}
                  {generationStage === 'scenes' && "生成场景中..."}
                  {generationStage === 'paragraphs' && "生成段落中..."}
                  {generationStage === 'full' && "生成完整内容中..."}
                  {generationStage === 'assemble' && "组装完整书籍中..."}
                </div>
              </div>
            )}

            {generatedStory && (
              <StoryDisplay story={generatedStory} />
            )}
          </>
        )}
      </div>
    </div >
  );
}
