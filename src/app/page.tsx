"use client";

import { useState, useEffect } from "react";
import GenerateButton from "@/components/GenerateButton";
import StoryDisplay from "@/components/StoryDisplay";
import UnifiedSelector from "@/components/UnifiedSelector";
import { PlottoParser } from "@/lib/plotto-parser";
import { StoryGenerator } from "@/lib/story-generator";
import { PlottoData, CharacterLink } from "@/lib/plotto-parser";

// 主角类型接口定义
interface Theme {
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
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

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

    setIsGenerating(true);

    try {
      // 检查是否选择了必要的故事元素
      if (!selectedTheme && !selectedElements.predicates && !selectedElements.conflicts.length && !selectedElements.outcomes.length) {
        alert("请至少选择一个故事元素（主角类型、情节、冲突或结局）");
        return;
      }

      // 创建新的选择元素，包含主角名称和主角类型选择
      const newSelectedElements = {
        ...selectedElements,
        // 如果选择了主角类型，更新subjects数组
        subjects: selectedTheme ? [selectedTheme.id] : selectedElements.subjects,
        // 将 predicates 转换为数组格式（兼容 StoryGenerator）
        predicates: selectedElements.predicates ? [selectedElements.predicates] : []
      };

      // 首先尝试使用AI生成故事
      const aiStory = await generateAIStory();
      if (aiStory) {
        setGeneratedStory(aiStory);
      } else {
        // 如果AI生成失败，回退到传统方式
        storyGenerator.generateStory(newSelectedElements);
        const story = storyGenerator.getGeneratedStory();
        setGeneratedStory(story);
      }
    } catch (error) {
      console.error("生成故事时出错:", error);
      alert("生成故事时出错，请查看控制台了解详情。");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 使用AI生成故事
   */
  const generateAIStory = async (): Promise<string | null> => {
    try {
      // 获取选择的故事元素描述
      const themeDescription = selectedTheme?.description || '';
      const plotDescription = selectedElements.predicates
        ? plottoData?.predicates.find(p => p.number.toString() === selectedElements.predicates)?.description || ''
        : '';
      const conflictDescriptions = selectedElements.conflicts.map(conflictId => {
        const conflict = plottoData?.conflicts.find(c => c.id === conflictId);
        const details = conflict ? (conflict.permutations.length > 0
          ? replaceCharacterReferences(conflict.permutations[0].description, conflict.permutations[0].characterLinks)
          : '') : '';
        return details;
      }).join('；');
      const outcomeDescription = selectedElements.outcomes.length > 0
        ? plottoData?.outcomes.find(o => o.number.toString() === selectedElements.outcomes[0])?.description || ''
        : '';

      // 如果没有选择任何元素，返回null
      if (!themeDescription && !plotDescription && !conflictDescriptions && !outcomeDescription) {
        return null;
      }

      // 首先尝试使用真实的AI生成API
      try {
        const response = await fetch('/api/generate-story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: themeDescription || '未指定主角类型',
            plot: plotDescription || '未指定情节',
            conflict: conflictDescriptions || '未指定冲突',
            outcome: outcomeDescription || '未指定结局',
            style: 'narrative',
            length: 'medium',
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            return result.data.story;
          }
        }
      } catch (error) {
        console.log('AI生成API不可用，使用测试模式:', error instanceof Error ? error.message : '未知错误');
      }

      // 如果真实API不可用，使用测试端点
      const testResponse = await fetch('/api/generate-story/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: themeDescription || '未指定主题',
          plot: plotDescription || '未指定情节',
          conflict: conflictDescriptions || '未指定冲突',
          outcome: outcomeDescription || '未指定结局',
          style: 'narrative',
          length: 'medium',
        }),
      });

      if (!testResponse.ok) {
        throw new Error(`测试API错误! status: ${testResponse.status}`);
      }

      const testResult = await testResponse.json();

      if (testResult.success) {
        return testResult.data.story;
      } else {
        throw new Error(testResult.error || '测试API生成故事失败');
      }
    } catch (error) {
      console.error('AI生成故事失败:', error);
      return null;
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
      })),
      outcomes: plottoData.outcomes.map(outcome => ({
        id: outcome.number.toString(),
        name: `结局 ${outcome.number}`,
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
              themes={transformedData.subjects.map(subject => ({
                id: subject.id,
                description: subject.description
              }))}
              selectedTheme={selectedTheme}
              onThemeChange={setSelectedTheme}

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
            />


            <div className="flex justify-center mb-12">
              <GenerateButton
                onClick={handleGenerateStory}
                disabled={isGenerating}
              />
            </div>

            {generatedStory && (
              <StoryDisplay story={generatedStory} />
            )}
          </>
        )}
      </div>
    </div >
  );
}
