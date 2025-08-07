// 接口定义
export interface Character {
  designation: string;  // 角色标识符，如 "A", "B", "A-2" 等
  sex: string;          // 性别，如 "男性", "女性", "任何", "无"
  description: string;  // 角色描述
}

export interface Subject {
  number: number;       // 主角类型编号
  description: string;  // 主角类型描述
}

export interface ConflictLink {
  ref: string;          // 引用的冲突 ID
  category: string;     // 分类
  subcategory: string;  // 子分类
  permutations?: number; // 排列数
  transform?: Transform; // 转换规则
}

export interface Predicate {
  number: number;             // 情节编号
  description: string;        // 情节描述
  conflictLinks: ConflictLink[]; // 关联的冲突链接
}

export interface Outcome {
  number: number;       // 结局编号
  description: string;  // 结局描述
}

export interface CharacterLink {
  ref: string;  // 引用的角色标识符
}

export interface Permutation {
  number: number;         // 排列编号
  description: string;    // 排列描述
  characterLinks: CharacterLink[]; // 引用的角色链接
}

export interface Group {
  mode: string;         // 组模式，如 "choose" 或 "include"
  conflictLinks: ConflictLink[]; // 冲突链接
}

export interface Transform {
  from: string;  // 转换来源
  to: string;    // 转换目标
}

export interface Conflict {
  id: string;              // 冲突 ID
  category: string;        // 分类
  subcategory: string;     // 子分类
  permutations: Permutation[]; // 排列
  leadUps?: Group[];       // 前置冲突组
  carryOns?: Group[];      // 继续冲突组
  includes?: Group[];      // 包含冲突组
}

export interface PlottoData {
  characters: Character[];
  subjects: Subject[];
  predicates: Predicate[];
  outcomes: Outcome[];
  conflicts: Conflict[];
}

export interface SelectedElements {
  characters: string[];
  subjects: string[];
  predicates: string[];
  conflicts: string[];
  outcomes: string[];
}

export class StoryGenerator {
  private plottoData: PlottoData;
  private generatedStory: string = "";

  constructor(plottoData: PlottoData) {
    this.plottoData = plottoData;
  }

  /**
   * 根据用户选择的元素或随机选择的元素生成故事
   * @param selectedElements 用户选择的元素
   */
  generateStory(selectedElements?: SelectedElements): void {
    // 初始化生成的故事
    this.generatedStory = "";

    // 如果没有提供选择的元素，则随机选择
    const elements = selectedElements || this.getRandomElements();

    // 根据选择的元素生成故事
    this.generatedStory = this.buildStory(elements);
  }

  /**
   * 获取生成的故事
   */
  getGeneratedStory(): string {
    return this.generatedStory;
  }

  /**
   * 随机选择元素
   */
  private getRandomElements(): SelectedElements {
    // 随机选择一个角色
    const randomCharacter = this.plottoData.characters.length > 0
      ? [this.plottoData.characters[Math.floor(Math.random() * this.plottoData.characters.length)].designation]
      : [];

    // 随机选择一个主角类型
    const randomSubject = this.plottoData.subjects.length > 0
      ? [this.plottoData.subjects[Math.floor(Math.random() * this.plottoData.subjects.length)].number.toString()]
      : [];

    // 随机选择一个情节
    const randomPredicate = this.plottoData.predicates.length > 0
      ? [this.plottoData.predicates[Math.floor(Math.random() * this.plottoData.predicates.length)].number.toString()]
      : [];

    // 随机选择一个冲突
    const randomConflict = this.plottoData.conflicts.length > 0
      ? [this.plottoData.conflicts[Math.floor(Math.random() * this.plottoData.conflicts.length)].id]
      : [];

    // 随机选择一个结局
    const randomOutcome = this.plottoData.outcomes.length > 0
      ? [this.plottoData.outcomes[Math.floor(Math.random() * this.plottoData.outcomes.length)].number.toString()]
      : [];

    return {
      characters: randomCharacter,
      subjects: randomSubject,
      predicates: randomPredicate,
      conflicts: randomConflict,
      outcomes: randomOutcome
    };
  }

  /**
   * 根据选择的元素构建故事
   * @param elements 选择的元素
   */
  private buildStory(elements: SelectedElements): string {
    // 获取选择的元素对象
    const selectedCharacters = this.plottoData.characters.filter(c => elements.characters.includes(c.designation));
    const selectedSubjects = this.plottoData.subjects.filter(s => elements.subjects.includes(s.number.toString()));
    const selectedPredicates = this.plottoData.predicates.filter(p => elements.predicates.includes(p.number.toString()));
    const selectedConflicts = this.plottoData.conflicts.filter(c => elements.conflicts.includes(c.id));
    const selectedOutcomes = this.plottoData.outcomes.filter(o => elements.outcomes.includes(o.number.toString()));

    // 构建故事文本
    let story = "故事开始：\n\n";

    // 添加角色信息
    if (selectedCharacters.length > 0) {
      story += "角色介绍：\n";
      selectedCharacters.forEach(character => {
        story += `- ${character.description} (${character.designation})\n`;
      });
      story += "\n";
    }

    // 添加主角类型信息
    if (selectedSubjects.length > 0) {
      story += "主角类型：\n";
      selectedSubjects.forEach(subject => {
        story += `- ${subject.description}\n`;
      });
      story += "\n";
    }

    // 添加情节信息
    if (selectedPredicates.length > 0) {
      story += "情节：\n";
      selectedPredicates.forEach(predicate => {
        story += `- ${predicate.description}\n`;
      });
      story += "\n";
    }

    // 添加冲突信息
    if (selectedConflicts.length > 0) {
      story += "主要冲突：\n";
      selectedConflicts.forEach(conflict => {
        // 获取第一个排列的描述作为冲突描述
        const conflictDescription = conflict.permutations.length > 0
          ? this.formatConflictDescription(conflict.permutations[0].description, conflict.permutations[0].characterLinks)
          : `冲突 ${conflict.id} (${conflict.category} - ${conflict.subcategory})`;
        story += `- ${conflictDescription}\n`;
      });
      story += "\n";
    }

    // 添加结局信息
    if (selectedOutcomes.length > 0) {
      story += "故事结局：\n";
      selectedOutcomes.forEach(outcome => {
        story += `- ${outcome.description}\n`;
      });
      story += "\n";
    }

    // 如果有冲突，尝试添加前置冲突和后续冲突
    if (selectedConflicts.length > 0) {
      story += "情节：\n";
      selectedConflicts.forEach(conflict => {
        // 添加前置冲突信息
        if (conflict.leadUps && conflict.leadUps.length > 0) {
          story += `在冲突 ${conflict.id} 发生之前：\n`;
          conflict.leadUps.forEach((group, groupIndex) => {
            story += `  组 ${groupIndex + 1} (${group.mode}):\n`;
            group.conflictLinks.forEach((link, linkIndex) => {
              const linkedConflict = this.plottoData.conflicts.find(c => c.id === link.ref);
              if (linkedConflict) {
                const description = linkedConflict.permutations.length > 0
                  ? this.formatConflictDescription(linkedConflict.permutations[0].description, linkedConflict.permutations[0].characterLinks)
                  : `冲突 ${linkedConflict.id} (${linkedConflict.category} - ${linkedConflict.subcategory})`;
                story += `    ${linkIndex + 1}. ${description}\n`;
              }
            });
          });
        }

        // 添加后续冲突信息
        if (conflict.carryOns && conflict.carryOns.length > 0) {
          story += `在冲突 ${conflict.id} 发生之后：\n`;
          conflict.carryOns.forEach((group, groupIndex) => {
            story += `  组 ${groupIndex + 1} (${group.mode}):\n`;
            group.conflictLinks.forEach((link, linkIndex) => {
              const linkedConflict = this.plottoData.conflicts.find(c => c.id === link.ref);
              if (linkedConflict) {
                const description = linkedConflict.permutations.length > 0
                  ? this.formatConflictDescription(linkedConflict.permutations[0].description, linkedConflict.permutations[0].characterLinks)
                  : `冲突 ${linkedConflict.id} (${linkedConflict.category} - ${linkedConflict.subcategory})`;
                story += `    ${linkIndex + 1}. ${description}\n`;
              }
            });
          });
        }

        // 添加包含冲突信息
        if (conflict.includes && conflict.includes.length > 0) {
          story += `与冲突 ${conflict.id} 同时发生的事件：\n`;
          conflict.includes.forEach((group, groupIndex) => {
            story += `  组 ${groupIndex + 1} (${group.mode}):\n`;
            group.conflictLinks.forEach((link, linkIndex) => {
              const linkedConflict = this.plottoData.conflicts.find(c => c.id === link.ref);
              if (linkedConflict) {
                const description = linkedConflict.permutations.length > 0
                  ? this.formatConflictDescription(linkedConflict.permutations[0].description, linkedConflict.permutations[0].characterLinks)
                  : `冲突 ${linkedConflict.id} (${linkedConflict.category} - ${linkedConflict.subcategory})`;
                story += `    ${linkIndex + 1}. ${description}\n`;
              }
            });
          });
        }
      });
      story += "\n";
    }

    // 添加结尾
    story += "故事结束。";

    return story;
  }

  /**
   * 格式化冲突描述，替换角色链接
   * @param description 冲突描述
   * @param characterLinks 角色链接
   */
  private formatConflictDescription(description: string, characterLinks: CharacterLink[]): string {
    let formattedDescription = description;

    // 替换角色链接
    characterLinks.forEach((link, _index) => {
      // TODO: 验证 index 参数是否需要使用
      console.log('🔍 [story-generator] characterLinks index 未使用:', _index);
      const character = this.plottoData.characters.find(c => c.designation === link.ref);
      if (character) {
        // 使用正则表达式替换角色链接
        const regex = new RegExp(`<character-link[^>]*ref="${link.ref}"[^>]*>[^<]*</character-link>`, 'g');
        formattedDescription = formattedDescription.replace(regex, character.description);
      }
    });

    // 移除剩余的HTML标签
    formattedDescription = formattedDescription.replace(/<[^>]*>/g, '');

    return formattedDescription;
  }
}