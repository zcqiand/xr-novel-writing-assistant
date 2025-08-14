/**
 * Plotto客户端工具类
 * 用于通过API调用获取Plotto数据
 */

export interface PlottoCharacter {
  designation: string;
  sex: string;
  description: string;
}

export interface PlottoSubject {
  number: number;
  description: string;
}

export interface PlottoPredicate {
  number: number;
  description: string;
  conflictLinks: ConflictLink[];
}

export interface PlottoOutcome {
  number: number;
  description: string;
}

export interface PlottoConflict {
  id: string;
  category: string;
  subcategory: string;
  permutations: Permutation[];
  leadUps?: Group[];
  carryOns?: Group[];
  includes?: Group[];
}

export interface ConflictLink {
  ref: string;
  category: string;
  subcategory: string;
  permutations?: number;
  transform?: Transform;
}

export interface Permutation {
  number: number;
  description: string;
  characterLinks: CharacterLink[];
}

export interface CharacterLink {
  ref: string;
}

export interface Group {
  mode: string;
  conflictLinks: ConflictLink[];
}

export interface Transform {
  from: string;
  to: string;
}

export interface PlottoData {
  characters: PlottoCharacter[];
  subjects: PlottoSubject[];
  predicates: PlottoPredicate[];
  outcomes: PlottoOutcome[];
  conflicts: PlottoConflict[];
}

export interface PlottoSearchResult {
  type: 'character' | 'subject' | 'predicate' | 'outcome' | 'conflict';
  data: unknown;
}

export interface PlottoSearchResponse {
  success: boolean;
  data: PlottoSearchResult[];
  query: string;
  category?: string;
  subcategory?: string;
  total: number;
}

export class PlottoClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/plotto') {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取所有Plotto数据
   */
  async getAllData(): Promise<PlottoData> {
    const response = await fetch(`${this.baseUrl}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取Plotto数据失败');
    }

    return result.data;
  }

  /**
   * 获取角色数据
   */
  async getCharacters(): Promise<PlottoCharacter[]> {
    const response = await fetch(`${this.baseUrl}?type=characters`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取角色数据失败');
    }

    return result.data;
  }

  /**
   * 获取特定角色
   */
  async getCharacter(id: string): Promise<PlottoCharacter | null> {
    const response = await fetch(`${this.baseUrl}?type=characters&id=${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取角色数据失败');
    }

    return result.data;
  }

  /**
   * 获取主角类型数据
   */
  async getSubjects(): Promise<PlottoSubject[]> {
    const response = await fetch(`${this.baseUrl}?type=subjects`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取主角类型数据失败');
    }

    return result.data;
  }

  /**
   * 获取特定主角类型
   */
  async getSubject(id: number): Promise<PlottoSubject | null> {
    const response = await fetch(`${this.baseUrl}?type=subjects&id=${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取主角类型数据失败');
    }

    return result.data;
  }

  /**
   * 获取情节发展数据
   */
  async getPredicates(): Promise<PlottoPredicate[]> {
    const response = await fetch(`${this.baseUrl}?type=predicates`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取情节发展数据失败');
    }

    return result.data;
  }

  /**
   * 获取特定情节发展
   */
  async getPredicate(id: number): Promise<PlottoPredicate | null> {
    const response = await fetch(`${this.baseUrl}?type=predicates&id=${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取情节发展数据失败');
    }

    return result.data;
  }

  /**
   * 获取故事结局数据
   */
  async getOutcomes(): Promise<PlottoOutcome[]> {
    const response = await fetch(`${this.baseUrl}?type=outcomes`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取故事结局数据失败');
    }

    return result.data;
  }

  /**
   * 获取特定故事结局
   */
  async getOutcome(id: number): Promise<PlottoOutcome | null> {
    const response = await fetch(`${this.baseUrl}?type=outcomes&id=${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取故事结局数据失败');
    }

    return result.data;
  }

  /**
   * 获取冲突数据
   */
  async getConflicts(): Promise<PlottoConflict[]> {
    const response = await fetch(`${this.baseUrl}?type=conflicts`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取冲突数据失败');
    }

    return result.data;
  }

  /**
   * 获取特定冲突
   */
  async getConflict(id: string): Promise<PlottoConflict | null> {
    const response = await fetch(`${this.baseUrl}?type=conflicts&id=${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取冲突数据失败');
    }

    return result.data;
  }

  /**
   * 搜索Plotto数据
   */
  async search(query: string, type: 'all' | 'characters' | 'subjects' | 'predicates' | 'outcomes' | 'conflicts' = 'all', category?: string, subcategory?: string): Promise<PlottoSearchResponse> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        type,
        category,
        subcategory,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '搜索Plotto数据失败');
    }

    return result;
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<string[]> {
    const data = await this.getAllData();
    const conflicts = data.conflicts;
    const categories = [...new Set(conflicts.map(c => c.category))];
    return categories;
  }

  /**
   * 获取指定分类的所有子分类
   */
  async getSubcategories(category: string): Promise<string[]> {
    const data = await this.getAllData();
    const conflicts = data.conflicts.filter(c => c.category === category);
    const subcategories = [...new Set(conflicts.map(c => c.subcategory))];
    return subcategories;
  }

  /**
   * 随机获取一个角色
   */
  async getRandomCharacter(): Promise<PlottoCharacter> {
    const characters = await this.getCharacters();
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }

  /**
   * 随机获取一个主角类型
   */
  async getRandomSubject(): Promise<PlottoSubject> {
    const subjects = await this.getSubjects();
    const randomIndex = Math.floor(Math.random() * subjects.length);
    return subjects[randomIndex];
  }

  /**
   * 随机获取一个情节发展
   */
  async getRandomPredicate(): Promise<PlottoPredicate> {
    const predicates = await this.getPredicates();
    const randomIndex = Math.floor(Math.random() * predicates.length);
    return predicates[randomIndex];
  }

  /**
   * 随机获取一个故事结局
   */
  async getRandomOutcome(): Promise<PlottoOutcome> {
    const outcomes = await this.getOutcomes();
    const randomIndex = Math.floor(Math.random() * outcomes.length);
    return outcomes[randomIndex];
  }

  /**
   * 随机获取一个冲突
   */
  async getRandomConflict(): Promise<PlottoConflict> {
    const conflicts = await this.getConflicts();
    const randomIndex = Math.floor(Math.random() * conflicts.length);
    return conflicts[randomIndex];
  }

  /**
   * 随机生成一个故事元素组合
   */
  async getRandomStoryElements(): Promise<{
    character: PlottoCharacter;
    subject: PlottoSubject;
    predicate: PlottoPredicate;
    outcome: PlottoOutcome;
    conflict: PlottoConflict;
  }> {
    const [character, subject, predicate, outcome, conflict] = await Promise.all([
      this.getRandomCharacter(),
      this.getRandomSubject(),
      this.getRandomPredicate(),
      this.getRandomOutcome(),
      this.getRandomConflict(),
    ]);

    return {
      character,
      subject,
      predicate,
      outcome,
      conflict,
    };
  }
}

// 创建默认实例
export const plottoClient = new PlottoClient();