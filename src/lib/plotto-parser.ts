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

export class PlottoParser {
  private parsedData: PlottoData | null = null;

  /**
   * 解析 XML 字符串并将其转换为 JavaScript 对象
   * @param xmlString - 要解析的 XML 字符串
   */
  parse(xmlString: string): void {
    // 在浏览器环境中使用 DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // 检查解析错误
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('XML 解析错误: ' + parseError[0].textContent);
    }

    // 解析各个部分
    this.parsedData = {
      characters: this.parseCharacters(xmlDoc),
      subjects: this.parseSubjects(xmlDoc),
      predicates: this.parsePredicates(xmlDoc),
      outcomes: this.parseOutcomes(xmlDoc),
      conflicts: this.parseConflicts(xmlDoc)
    };
  }

  /**
   * 获取解析后的数据
   */
  getParsedData(): PlottoData {
    if (!this.parsedData) {
      throw new Error('数据尚未解析，请先调用 parse 方法');
    }
    return this.parsedData;
  }

  /**
   * 解析角色部分
   */
  private parseCharacters(xmlDoc: Document): Character[] {
    const characters: Character[] = [];
    const charactersNode = xmlDoc.getElementsByTagName('characters')[0];

    if (charactersNode) {
      const characterNodes = charactersNode.getElementsByTagName('character');

      for (let i = 0; i < characterNodes.length; i++) {
        const node = characterNodes[i];
        const designation = node.getAttribute('designation') || '';
        const sex = node.getAttribute('sex') || '';
        const description = node.textContent || '';

        characters.push({
          designation,
          sex,
          description
        });
      }
    }

    return characters;
  }

  /**
   * 解析主角类型部分
   */
  private parseSubjects(xmlDoc: Document): Subject[] {
    const subjects: Subject[] = [];
    const subjectsNode = xmlDoc.getElementsByTagName('subjects')[0];

    if (subjectsNode) {
      const subjectNodes = subjectsNode.getElementsByTagName('subject');

      for (let i = 0; i < subjectNodes.length; i++) {
        const node = subjectNodes[i];
        const number = parseInt(node.getAttribute('number') || '0', 10);
        const descriptionNode = node.getElementsByTagName('description')[0];
        const description = descriptionNode ? (descriptionNode.textContent || '') : '';

        subjects.push({
          number,
          description
        });
      }
    }

    return subjects;
  }

  /**
   * 解析情节部分
   */
  private parsePredicates(xmlDoc: Document): Predicate[] {
    const predicates: Predicate[] = [];
    const predicatesNode = xmlDoc.getElementsByTagName('predicates')[0];

    if (predicatesNode) {
      const predicateNodes = predicatesNode.getElementsByTagName('predicate');

      for (let i = 0; i < predicateNodes.length; i++) {
        const node = predicateNodes[i];
        const number = parseInt(node.getAttribute('number') || '0', 10);
        const descriptionNode = node.getElementsByTagName('description')[0];
        const description = descriptionNode ? (descriptionNode.textContent || '') : '';

        const conflictLinks: ConflictLink[] = [];
        const conflictLinkNodes = node.getElementsByTagName('conflict-link');

        for (let j = 0; j < conflictLinkNodes.length; j++) {
          const clNode = conflictLinkNodes[j];
          conflictLinks.push(this.parseConflictLink(clNode));
        }

        predicates.push({
          number,
          description,
          conflictLinks
        });
      }
    }

    return predicates;
  }

  /**
   * 解析结局部分
   */
  private parseOutcomes(xmlDoc: Document): Outcome[] {
    const outcomes: Outcome[] = [];
    const outcomesNode = xmlDoc.getElementsByTagName('outcomes')[0];

    if (outcomesNode) {
      const outcomeNodes = outcomesNode.getElementsByTagName('outcome');

      for (let i = 0; i < outcomeNodes.length; i++) {
        const node = outcomeNodes[i];
        const number = parseInt(node.getAttribute('number') || '0', 10);
        const descriptionNode = node.getElementsByTagName('description')[0];
        const description = descriptionNode ? (descriptionNode.textContent || '') : '';

        outcomes.push({
          number,
          description
        });
      }
    }

    return outcomes;
  }

  /**
   * 解析冲突部分
   */
  private parseConflicts(xmlDoc: Document): Conflict[] {
    const conflicts: Conflict[] = [];
    const conflictsNode = xmlDoc.getElementsByTagName('conflicts')[0];

    if (conflictsNode) {
      const conflictNodes = conflictsNode.getElementsByTagName('conflict');

      for (let i = 0; i < conflictNodes.length; i++) {
        const node = conflictNodes[i];
        const id = node.getAttribute('id') || '';
        const category = node.getAttribute('category') || '';
        const subcategory = node.getAttribute('subcategory') || '';

        // 解析排列
        const permutations: Permutation[] = [];
        const permutationsNode = node.getElementsByTagName('permutations')[0];
        if (permutationsNode) {
          const permutationNodes = permutationsNode.getElementsByTagName('permutation');
          for (let j = 0; j < permutationNodes.length; j++) {
            const pNode = permutationNodes[j];
            const number = parseInt(pNode.getAttribute('number') || '0', 10);
            const description = pNode.getElementsByTagName('description')[0]?.textContent || '';

            // 解析角色链接
            const characterLinks: CharacterLink[] = [];
            const characterLinkNodes = pNode.getElementsByTagName('character-link');
            for (let k = 0; k < characterLinkNodes.length; k++) {
              characterLinks.push({
                ref: characterLinkNodes[k].getAttribute('ref') || ''
              });
            }

            permutations.push({
              number,
              description,
              characterLinks
            });
          }
        }

        // 解析前置冲突组
        const leadUps = this.parseGroups(node, 'lead-ups');

        // 解析继续冲突组
        const carryOns = this.parseGroups(node, 'carry-ons');

        // 解析包含冲突组
        const includes = this.parseGroups(node, 'includes');

        conflicts.push({
          id,
          category,
          subcategory,
          permutations,
          leadUps: leadUps.length > 0 ? leadUps : undefined,
          carryOns: carryOns.length > 0 ? carryOns : undefined,
          includes: includes.length > 0 ? includes : undefined
        });
      }
    }

    return conflicts;
  }

  /**
   * 解析组（lead-ups, carry-ons, includes）
   */
  private parseGroups(node: Element, groupName: string): Group[] {
    const groups: Group[] = [];
    const groupParent = node.getElementsByTagName(groupName)[0];

    if (groupParent) {
      const groupNodes = groupParent.getElementsByTagName('group');

      for (let i = 0; i < groupNodes.length; i++) {
        const gNode = groupNodes[i];
        const mode = gNode.getAttribute('mode') || '';

        const conflictLinks: ConflictLink[] = [];
        const conflictLinkNodes = gNode.getElementsByTagName('conflict-link');

        for (let j = 0; j < conflictLinkNodes.length; j++) {
          const clNode = conflictLinkNodes[j];
          conflictLinks.push(this.parseConflictLink(clNode));
        }

        groups.push({
          mode,
          conflictLinks
        });
      }
    }

    return groups;
  }

  /**
   * 解析冲突链接
   */
  private parseConflictLink(node: Element): ConflictLink {
    const ref = node.getAttribute('ref') || '';
    const category = node.getAttribute('category') || '';
    const subcategory = node.getAttribute('subcategory') || '';
    const permutations = node.getAttribute('permutations') ? parseInt(node.getAttribute('permutations') || '0', 10) : undefined;

    let transform: Transform | undefined;
    const transformNode = node.getElementsByTagName('transform')[0];
    if (transformNode) {
      transform = {
        from: transformNode.getAttribute('from') || '',
        to: transformNode.getAttribute('to') || ''
      };
    }

    return {
      ref,
      category,
      subcategory,
      permutations,
      transform
    };
  }
}