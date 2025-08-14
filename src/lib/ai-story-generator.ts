import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// AI故事生成器配置接口
export interface AIStoryGeneratorConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  siteUrl: string;
  siteName: string;
}

// AI故事生成请求接口
export interface AIStoryRequest {
  protagonist: string;
  plot: string;
  conflict: string;
  outcome: string;
  style?: 'narrative' | 'dramatic' | 'romantic' | 'mysterious' | 'adventure';
  length?: 'short' | 'medium' | 'long';
}

// AI故事生成响应接口
export interface AIStoryResponse {
  story: string;
  title?: string;
  genre?: string;
  wordCount?: number;
}

// 角色信息接口
export interface Character {
  name: string;
  description: string;
}

// 章节摘要接口
export interface Chapter {
  chapter: number;
  title: string;
  summary: string;
}

// 高级大纲接口
export interface StoryOutline {
  title: string;
  characters: Character[];
  chapters: Chapter[];
}

/**
 * AI故事生成器类
 * 使用OpenAI API生成故事内容
 */
export class AIStoryGenerator {
  private openai: OpenAI;
  private config: AIStoryGeneratorConfig;

  constructor(config: AIStoryGeneratorConfig) {
    this.config = config;

    this.openai = new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
      defaultHeaders: {
        "HTTP-Referer": config.siteUrl,
        "X-Title": config.siteName,
      },
    });
  }

  /**
   * 生成故事
   * @param request 故事生成请求
   * @returns 生成的故事
   */
  async generateStory(request: AIStoryRequest): Promise<AIStoryResponse> {
    try {
      // 构建提示词
      const prompt = this.buildPrompt(request);

      // 记录发送给AI模型的提示
      console.log('=== AI模型调用日志 ===');
      console.log('时间:', new Date().toISOString());
      console.log('模型:', process.env.OPENAI_MODEL);
      console.log('请求参数:', JSON.stringify(request, null, 2));
      console.log('系统提示:', `你是一个专业的小说写作助手，擅长根据用户提供的故事元素创作出生动有趣的故事。请根据用户提供的主角类型、情节发展、冲突和故事结局，创作一个完整的故事。故事应该：
1. 情节发展连贯，逻辑清晰
2. 人物形象鲜明
3. 冲突设置合理
4. 故事结局符合用户要求
5. 语言生动，富有感染力`);
      console.log('用户提示:', prompt);
      console.log('=====================');

      // 对于完整故事，我们不需要严格的JSON格式，直接返回文本
      // 调用OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `你是一个专业的小说写作助手，擅长根据用户提供的故事元素创作出生动有趣的故事。请根据用户提供的主角类型、情节发展、冲突和故事结局，创作一个完整的故事。故事应该：
1. 情节发展连贯，逻辑清晰
2. 人物形象鲜明
3. 冲突设置合理
4. 故事结局符合用户要求
5. 语言生动，富有感染力`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const storyContent = completion.choices[0]?.message?.content || '';

      // 记录生成结果
      console.log('AI故事生成完成，标题:', this.extractTitle(storyContent), '字数:', this.countWords(storyContent));

      // 解析响应并返回结构化数据
      return {
        story: storyContent,
        title: this.extractTitle(storyContent),
        genre: request.style || 'narrative',
        wordCount: this.countWords(storyContent)
      };

    } catch (error) {
      console.error('AI故事生成失败:', error);
      throw new Error(`AI故事生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成故事大纲
   * @param protagonist 主角类型
   * @param plot 情节发展
   * @param conflict 主要冲突
   * @param outcome 故事结局
   * @param style 写作风格
   * @param length 故事长度
   * @returns 生成的故事大纲
   */
  async generateStoryOutline(
    protagonist: string,
    plot: string,
    conflict: string,
    outcome: string,
    style?: 'narrative' | 'dramatic' | 'romantic' | 'mysterious' | 'adventure',
    length?: 'short' | 'medium' | 'long'
  ): Promise<StoryOutline> {
    try {
      // 构建大纲生成提示词
      const prompt = this.buildOutlinePrompt(protagonist, plot, conflict, outcome, style, length);

      // 记录发送给AI模型的提示
      console.log('=== AI大纲生成调用日志 ===');
      console.log('时间:', new Date().toISOString());
      console.log('模型:', process.env.OPENAI_MODEL);
      console.log('请求参数:', { protagonist: protagonist, plot, conflict, outcome, style, length });
      console.log('系统提示:', `你是一个专业的小说写作助手，擅长为故事创建详细的大纲。请根据用户提供的故事元素，生成包含角色列表和章节摘要的故事大纲。大纲应该：
1. 角色形象鲜明，符合故事主题
2. 章节安排合理，情节发展连贯
3. 冲突设置有层次感
4. 故事结局符合用户要求
5. 大纲结构清晰，易于理解`);
      console.log('用户提示:', prompt);
      console.log('=========================');

      // 定义JSON schema
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          characters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" }
              },
              required: ["name", "description"],
              additionalProperties: false
            }
          },
          chapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                chapter: { type: "number" },
                title: { type: "string" },
                summary: { type: "string" }
              },
              required: ["chapter", "title", "summary"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "characters", "chapters"],
        additionalProperties: false
      };

      // 调用OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `你是一个专业的小说写作助手，擅长为故事创建详细的大纲。请根据用户提供的故事元素，生成包含角色列表和章节摘要的故事大纲。大纲应该：
1. 角色形象鲜明，符合故事主题
2. 章节安排合理，情节发展连贯
3. 冲突设置有层次感
4. 故事结局符合用户要求
5. 大纲结构清晰，易于理解`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "story_outline",
            strict: true,
            schema: schema
          }
        },
        max_tokens: 3000,
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content || '';

      // 记录生成结果
      console.log('AI大纲生成完成');

      // 由于使用了结构化输出，直接返回解析后的JSON
      try {
        const outline = JSON.parse(responseContent) as StoryOutline;
        return outline;
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        throw new Error(`AI大纲生成失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
      }

    } catch (error) {
      console.error('AI大纲生成失败:', error);
      throw new Error(`AI大纲生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构建提示词
   * @param request 故事生成请求
   * @returns 构建好的提示词
   */
  private buildPrompt(request: AIStoryRequest): string {
    const { protagonist, plot, conflict, outcome, style, length } = request;

    let styleDescription = '';
    switch (style) {
      case 'narrative':
        styleDescription = '叙事风格，注重情节发展和人物心理描写';
        break;
      case 'dramatic':
        styleDescription = '戏剧风格，强调冲突和情感张力';
        break;
      case 'romantic':
        styleDescription = '浪漫风格，注重情感描写和浪漫氛围';
        break;
      case 'mysterious':
        styleDescription = '悬疑风格，设置悬念和谜团';
        break;
      case 'adventure':
        styleDescription = '冒险风格，强调动作和探索';
        break;
      default:
        styleDescription = '叙事风格，注重情节发展和人物心理描写';
    }

    let lengthDescription = '';
    switch (length) {
      case 'short':
        lengthDescription = '短篇故事，500-800字';
        break;
      case 'medium':
        lengthDescription = '中篇故事，800-1500字';
        break;
      case 'long':
        lengthDescription = '长篇故事，1500字以上';
        break;
      default:
        lengthDescription = '中篇故事，800-1500字';
    }

    return `请根据以下故事元素创作一个${lengthDescription}的故事：

主角类型：${protagonist}
情节发展：${plot}
主要冲突：${conflict}
故事结局：${outcome}
写作风格：${styleDescription}

请创作一个完整的故事，包括：
1. 吸引人的标题
2. 生动的人物形象
3. 连贯的情节发展
4. 合理的冲突设置
5. 符合要求的故事结局
6. 丰富的细节描写

请确保故事内容积极向上，富有感染力。`;
  }

  /**
   * 从故事内容中提取标题
   * @param story 故事内容
   * @returns 提取的标题
   */
  private extractTitle(story: string): string {
    // 尝试提取第一行作为标题
    const lines = story.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // 如果第一行较短，可能是标题
      if (firstLine.length < 50 && !firstLine.includes('。') && !firstLine.includes('！') && !firstLine.includes('？')) {
        return firstLine;
      }
    }

    // 如果没有找到合适的标题，生成一个默认标题
    return 'AI生成故事';
  }

  /**
   * 计算字数
   * @param text 文本内容
   * @returns 字数
   */
  private countWords(text: string): number {
    // 移除标点符号和空白字符，然后计算字符数
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    return cleanText.length;
  }

  /**
   * 测试连接
   * @returns 连接是否成功
   */
  async testConnection(): Promise<boolean> {
    try {
      // 记录连接测试信息
      console.log('AI连接测试开始，模型:', this.config.model);

      // 检查是否为测试模式
      if (this.config.apiKey === 'test-api-key-for-debugging') {
        console.log('🔧 检测到测试模式，返回模拟连接成功');
        return true;
      }

      // 定义JSON schema
      const schema = {
        type: "object",
        properties: {
          message: {
            type: "string"
          }
        },
        required: ["message"],
        additionalProperties: false
      };

      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: "请回复'连接成功'"
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "connection_test",
            strict: true,
            schema: schema
          }
        },
        max_tokens: 10,
      });

      const response = completion.choices[0]?.message?.content || '';

      // 记录连接测试结果
      console.log('AI连接测试完成');

      // 由于使用了结构化输出，直接解析JSON
      try {
        const responseObject = JSON.parse(response);
        return responseObject.message === '连接成功';
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        return false;
      }
    } catch (error) {
      console.error('AI连接测试失败:', error);
      return false;
    }
  }

  /**
   * 构建大纲生成提示词
   * @param protagonist 主角类型
   * @param plot 情节发展
   * @param conflict 主要冲突
   * @param outcome 故事结局
   * @param style 写作风格
   * @param length 故事长度
   * @returns 构建好的提示词
   */
  private buildOutlinePrompt(
    protagonist: string,
    plot: string,
    conflict: string,
    outcome: string,
    style?: 'narrative' | 'dramatic' | 'romantic' | 'mysterious' | 'adventure',
    length?: 'short' | 'medium' | 'long'
  ): string {
    const styleDescription = style ? this.getStyleDescription(style) : '叙事风格，注重情节发展和人物心理描写';
    const lengthDescription = length ? this.getLengthDescription(length) : '中篇故事，约8-15章';

    return `请根据以下故事元素生成一个详细的故事大纲：

主角类型：${protagonist}
情节发展：${plot}
主要冲突：${conflict}
故事结局：${outcome}
写作风格：${styleDescription}
故事长度：${lengthDescription}

请生成包含以下内容的大纲：
1. 书籍标题：为这个故事创作一个吸引人的标题
2. 角色列表：包括主要角色和重要配角，每个角色包含姓名和详细描述
3. 章节摘要：按照故事发展逻辑，分章节描述情节发展要点，每个章节需要有吸引人的章节标题

请严格按照以下JSON格式返回：
{
 "title": "书籍标题",
 "characters": [
   {"name": "角色名", "description": "角色详细描述"},
   ...
 ],
 "chapters": [
   {"chapter": 1, "title": "章节标题", "summary": "第一章详细摘要"},
   ...
 ]
}

请确保大纲内容丰富，角色形象鲜明，章节安排合理，书籍标题和章节标题都要吸引人且符合故事主题。`;
  }

  /**
   * 获取风格描述
   * @param style 风格类型
   * @returns 风格描述
   */
  private getStyleDescription(style: string): string {
    const styleMap: Record<string, string> = {
      'narrative': '叙事风格，注重情节发展和人物心理描写',
      'dramatic': '戏剧风格，强调冲突和情感张力',
      'romantic': '浪漫风格，注重情感描写和浪漫氛围',
      'mysterious': '悬疑风格，设置悬念和谜团',
      'adventure': '冒险风格，强调动作和探索'
    };
    return styleMap[style] || '叙事风格，注重情节发展和人物心理描写';
  }

  /**
   * 获取长度描述
   * @param length 长度类型
   * @returns 长度描述
   */
  private getLengthDescription(length: string): string {
    const lengthMap: Record<string, string> = {
      'short': '短篇故事，约5-8章',
      'medium': '中篇故事，约8-15章',
      'long': '长篇故事，15章以上'
    };
    return lengthMap[length] || '中篇故事，约8-15章';
  }

  /**
   * 从文本中提取大纲信息
   * @param text AI返回的文本内容
   * @returns 提取的大纲信息
   */
  private extractOutlineFromText(text: string): StoryOutline {
    const outline: StoryOutline = {
      title: 'AI生成故事',
      characters: [],
      chapters: []
    };

    // 尝试提取角色信息
    const characterRegex = /"characters"\s*:\s*\[\s*([\s\S]*?)\s*\]/;
    const characterMatch = text.match(characterRegex);
    if (characterMatch) {
      try {
        const charactersText = characterMatch[1];
        const characterArray = JSON.parse(`[${charactersText}]`);
        outline.characters = characterArray.map((char: {
          name?: string;
          description?: string;
        }) => ({
          name: char.name || '未知角色',
          description: char.description || '角色描述'
        }));
      } catch {
        console.warn('角色信息解析失败');
      }
    }

    // 尝试提取章节信息
    const chapterRegex = /"chapters"\s*:\s*\[\s*([\s\S]*?)\s*\]/;
    const chapterMatch = text.match(chapterRegex);
    if (chapterMatch) {
      try {
        const chaptersText = chapterMatch[1];
        const chapterArray = JSON.parse(`[${chaptersText}]`);
        outline.chapters = chapterArray.map((chapter: {
          chapter?: number;
          title?: string;
          summary?: string;
        }) => ({
          chapter: chapter.chapter || 0,
          title: chapter.title || `第${chapter.chapter || 0}章`,
          summary: chapter.summary || '章节摘要'
        }));
      } catch {
        console.warn('章节信息解析失败');
      }
    }

    return outline;
  }

}

// 完整场景内容接口
export interface FullSceneContent {
  sceneNumber: number;
  title: string;
  fullContent: string;
  continuityNotes: string[];
}

// 完整书籍内容接口
export interface FullBookContent {
  title: string;
  chapters: FullChapterContent[];
}

// 完整章节内容接口
export interface FullChapterContent {
  chapterNumber: number;
  title: string;
  scenes: FullSceneContent[];
}

// 场景信息接口
export interface Scene {
  sceneNumber: number;
  title: string;
  summary: string;
}

// 章节场景接口
export interface ChapterScenes {
  chapter: number;
  scenes: Scene[];
}

/**
 * 生成章节场景
 * @param outline 大纲数据（内存数据）
 * @param startChapter 起始章节号（默认1）
 * @param chapterCount 生成章节数（默认1）
 * @returns 生成的章节场景数据
 */
async function generateChapterScenes(
  outline: StoryOutline,
  startChapter: number = 1,
  chapterCount: number = outline.chapters.length // 修复：生成所有章节而不是只生成1个
): Promise<ChapterScenes[]> {
  try {

    const results: ChapterScenes[] = [];

    // 生成指定章节的场景
    for (let i = 0; i < chapterCount; i++) {
      const chapterNumber = startChapter + i;
      const chapter = outline.chapters.find((ch: {
        chapter: number;
        title: string;
        summary: string;
      }) => ch.chapter === chapterNumber);

      if (!chapter) {
        console.warn(`章节 ${chapterNumber} 未找到，跳过`);
        continue;
      }

      // 调用AI模型生成该章节所有场景
      const scenes = await generateScenesForChapter(chapter.summary, chapterNumber);

      // 构建章节场景数据
      const chapterScenes: ChapterScenes = {
        chapter: chapterNumber,
        scenes: scenes
      };

      results.push(chapterScenes);

      // 保存场景数据到文件，使用动态文件名
      const safeTitle = (outline.title || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const fileName = `data/${safeTitle}-chapter-${chapterNumber}-scenes.json`;
      await fs.promises.writeFile(fileName, JSON.stringify(chapterScenes, null, 2), 'utf8');
      console.log(`章节 ${chapterNumber} 场景已保存到 ${fileName}`);
    }

    return results;

  } catch (error) {
    console.error('生成章节场景失败:', error);
    throw new Error(`生成章节场景失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 为指定章节生成场景
 * @param chapterSummary 章节摘要
 * @param chapterNumber 章节号
 * @returns 生成的场景列表
 */
async function generateScenesForChapter(chapterSummary: string, _chapterNumber: number): Promise<Scene[]> {
  try {
    // 构建场景生成提示词
    const prompt = `请为以下章节生成3-5个具体的场景：

章节摘要：${chapterSummary}

请按照以下JSON格式返回场景列表：
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "场景标题",
      "summary": "场景摘要（50-100字）"
    },
    ...
  ]
}

要求：
1. 场景应该连贯地展现章节情节发展
2. 每个场景应该有明确的标题和摘要
3. 场景数量控制在3-5个
4. 摘要要简洁明了，50-100字
5. 确保场景之间的逻辑连贯性`;

    // 记录关键提示词信息
    console.log('AI场景生成提示词:', prompt);

    // 定义JSON schema
    const schema = {
      type: "object",
      properties: {
        scenes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sceneNumber: { type: "number" },
              title: { type: "string" },
              summary: { type: "string" }
            },
            required: ["sceneNumber", "title", "summary"],
            additionalProperties: false
          }
        }
      },
      required: ["scenes"],
      additionalProperties: false
    };

    // 调用OpenAI API
    const completion = await new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL,
        "X-Title": process.env.SITE_NAME,
      },
    }).chat.completions.create({
      model: process.env.OPENAI_MODEL || '',
      messages: [
        {
          role: "system",
          content: `你是一个专业的小说写作助手，擅长根据章节摘要生成具体的场景。请为每个章节创建3-5个连贯的场景，每个场景包含标题和摘要。场景应该：
1. 连贯地展现章节情节发展
2. 有明确的标题和50-100字的摘要
3. 数量控制在3-5个
4. 确保场景之间的逻辑连贯性`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chapter_scenes",
          strict: true,
          schema: schema
        }
      },
      max_tokens: 3000,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI场景生成完成');

    // 由于使用了结构化输出，直接返回解析后的JSON
    try {
      const response = JSON.parse(responseContent);
      const scenes = response.scenes || [];

      // 确保场景编号正确
      return scenes.map((scene: {
        sceneNumber: number;
        title: string;
        summary: string;
      }, index: number) => ({
        sceneNumber: index + 1,
        title: scene.title || `场景 ${index + 1}`,
        summary: scene.summary || '场景摘要'
      }));
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      throw new Error(`生成场景失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

  } catch (error) {
    console.error('生成场景失败:', error);
    throw new Error(`生成场景失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 场景段落生成接口
export interface SceneParagraphs {
  sceneNumber: number;
  title: string;
  openingParagraph: string;
  closingParagraph: string;
}

// 连续性检查数据接口
export interface ContinuityData {
  sceneNumber: number;
  importantDetails: string[];
  facts: string[];
  characters: string[];
  locations: string[];
}

/**
 * 生成场景段落
 * @param outline 大纲数据（内存数据）
 * @param scenes 场景数据（内存数据）
 * @param startSceneNumber 起始场景号（默认1）
 * @param sceneCount 生成场景数（默认1）
 * @returns 生成的场景段落数据
 */
/**
 * 生成场景段落（批量生成多个场景的段落）
 * @param outline 大纲数据（内存数据）
 * @param scenes 场景数据（内存数据）
 * @param startSceneNumber 起始场景号（默认1）
 * @param sceneCount 生成场景数（默认1）
 * @returns 生成的场景段落数据
 */
async function generateSceneParagraphsBatch(
  outline: StoryOutline,
  scenes: ChapterScenes,
  startSceneNumber: number = 1,
  sceneCount: number = scenes.scenes.length // 修复：生成所有场景而不是只生成1个
): Promise<SceneParagraphs[]> {
  try {
    // 记录关键参数信息
    console.log('开始生成场景段落，起始场景号:', startSceneNumber, '生成场景数:', sceneCount, '书籍标题:', outline.title);

    const results: SceneParagraphs[] = [];
    const continuityData: ContinuityData[] = [];

    // 获取指定章节的场景
    const chapter = scenes.chapter;
    const sceneList = scenes.scenes;

    // 生成指定场景的段落

    for (let i = 0; i < sceneCount; i++) {
      const sceneNumber = startSceneNumber + i;
      console.log(`\n--- 查找场景 ${sceneNumber} ---`);
      console.log(`sceneList 长度: ${sceneList.length}`);

      const scene = sceneList.find((s: {
        sceneNumber: number;
        title: string;
        summary: string;
      }) => s.sceneNumber === sceneNumber);
      console.log('找到的场景:', scene);

      if (!scene) {
        console.warn(`❌ 场景 ${sceneNumber} 未找到，跳过`);
        console.log('可用的场景编号:', sceneList.map(s => s.sceneNumber));
        continue;
      }

      console.log(`✅ 生成场景 ${sceneNumber} 段落 ===`);
      console.log(`场景标题: ${scene.title}`);
      console.log(`场景摘要: ${scene.summary}`);

      // 调用新的合并函数同时生成开头和结尾段落
      const paragraphs = await generateSceneParagraphs(
        scene.title,
        scene.summary,
        outline.characters
      );

      // 构建场景段落数据
      const sceneParagraphs: SceneParagraphs = {
        sceneNumber: sceneNumber,
        title: scene.title,
        openingParagraph: paragraphs.openingParagraph,
        closingParagraph: paragraphs.closingParagraph
      };

      results.push(sceneParagraphs);

      // 记录连续性数据
      recordContinuityData(sceneNumber, scene, outline.characters, continuityData);

      // 保存段落数据到文件，使用动态书籍名称和章节号
      const safeTitle = (outline.title || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const fileName = `data/${safeTitle}-chapter-${chapter}-scene-${sceneNumber}-paragraphs.json`;
      await fs.promises.writeFile(fileName, JSON.stringify(sceneParagraphs, null, 2), 'utf8');
      console.log(`场景 ${sceneNumber} 段落已保存到 ${fileName}`);
    }

    console.log('场景段落生成完成');
    return results;

  } catch (error) {
    console.error('生成场景段落失败:', error);
    throw new Error(`生成场景段落失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成场景段落（同时生成开头和结尾段落）
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param characters 角色列表
 * @returns 包含开头和结尾段落的对象
 */
async function generateSceneParagraphs(
  sceneTitle: string,
  sceneSummary: string,
  characters: Character[]
): Promise<{ openingParagraph: string; closingParagraph: string }> {
  try {
    // 检查是否为测试模式
    const isTestMode = process.env.OPENAI_API_KEY === 'test-api-key-for-debugging';

    if (isTestMode) {
      console.log('🔧 检测到测试模式，生成模拟段落');
      return {
        openingParagraph: generateTestOpeningParagraph(sceneTitle),
        closingParagraph: generateTestClosingParagraph(sceneTitle)
      };
    }

    // 构建段落生成提示词
    const prompt = `请为以下场景同时生成一个吸引人的开头段落和一个引人深思的结尾段落：

场景标题：${sceneTitle}
场景摘要：${sceneSummary}
主要角色：${characters.map(c => c.name).join('、')}

要求：
开头段落（100-150字）：
1. 设置场景氛围，引入主要角色
2. 语言生动，富有感染力
3. 字数控制在100-150字
4. 与前一个场景保持连续性（如果有）
5. 为后续情节发展埋下伏笔

结尾段落（100-150字）：
1. 总结场景要点，留下悬念或过渡到下一个场景
2. 语言生动，富有感染力
3. 字数控制在100-150字
4. 为后续场景发展做好铺垫
5. 保持故事的连贯性和吸引力

请严格按照以下JSON格式返回：
{
  "openingParagraph": "开头段落内容",
  "closingParagraph": "结尾段落内容"
}`;

    // 记录关键提示词信息
    console.log('AI场景段落生成提示词:', prompt);

    // 定义JSON schema
    const schema = {
      type: "object",
      properties: {
        openingParagraph: {
          type: "string",
          description: "开头段落内容（100-150字）"
        },
        closingParagraph: {
          type: "string",
          description: "结尾段落内容（100-150字）"
        }
      },
      required: ["openingParagraph", "closingParagraph"],
      additionalProperties: false
    };

    // 调用OpenAI API
    const completion = await new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY || "",
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL,
        "X-Title": process.env.SITE_NAME || "",
      },
    }).chat.completions.create({
      model: process.env.OPENAI_MODEL || '',
      messages: [
        {
          role: "system",
          content: `你是一个专业的小说写作助手，擅长为场景创作完整的段落。请根据场景标题、摘要和角色信息，同时创作一个吸引人的开头段落和一个引人深思的结尾段落。段落应该：
1. 开头段落：设置场景氛围，引入主要角色，字数100-150字
2. 结尾段落：总结场景要点，留下悬念，字数100-150字
3. 语言生动，富有感染力
4. 保持故事的连贯性和吸引力
5. 严格按照JSON格式返回结果`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "scene_paragraphs",
          strict: true,
          schema: schema
        }
      },
      max_tokens: 600,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI场景段落生成完成');

    // 由于使用了结构化输出，直接解析JSON
    try {
      const response = JSON.parse(responseContent);
      return {
        openingParagraph: response.openingParagraph?.trim() || '',
        closingParagraph: response.closingParagraph?.trim() || ''
      };
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      throw new Error(`生成场景段落失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

  } catch (error) {
    console.error('生成场景段落失败:', error);
    return {
      openingParagraph: `场景${sceneTitle}的开头段落生成失败`,
      closingParagraph: `场景${sceneTitle}的结尾段落生成失败`
    };
  }
}

/**
 * 生成开头段落（保持向后兼容）
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param characters 角色列表
 * @param continuityData 连续性数据
 * @returns 开头段落内容
 */
async function _generateOpeningParagraph(
  sceneTitle: string,
  sceneSummary: string,
  characters: Character[]
): Promise<string> {
  try {
    const result = await generateSceneParagraphs(sceneTitle, sceneSummary, characters);
    return result.openingParagraph;
  } catch (error) {
    console.error('生成开头段落失败:', error);
    return `场景${sceneTitle}的开头段落生成失败`;
  }
}

/**
 * 生成测试用的开头段落
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @returns 测试用的开头段落
 */
function generateTestOpeningParagraph(sceneTitle: string): string {
  // 根据场景标题生成不同的测试段落
  if (sceneTitle.includes('残卷') || sceneTitle.includes('幻影')) {
    return "工作室里，林深小心翼翼地修复着那本民国日记本。破损的内页突然渗出墨渍，在灯光下形成了一个穿月白旗袍的女子剪影。他屏住呼吸，伸手触碰那幻影般的画面...";
  } else if (sceneTitle.includes('雨夜') || sceneTitle.includes('废墟')) {
    return "暴雨倾盆的深夜，林深抱着修复箱匆匆赶路。途经图书馆废墟时，他看到断墙处有手电筒光束在晃动。一个身影正在瓦砾堆中翻找，沾满泥浆的旗袍下摆在雨中若隐若现...";
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    return "闪电划破天际的刹那，林深与那个四目相对的身影同时抬头。雨幕中，她耳垂的朱砂痣清晰可见，与日记中的幻影、母亲遗照上的印记完全重叠。废墟间飘起若有若无的茉莉香...";
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    return "陆知秋慌乱中掉落的鎏金怀表在泥水中闪烁着微光。林深弯腰捡起，发现表盖内侧刻着母亲的名字。表针永远停在1943年立秋，那是一个改变一切的秋天...";
  } else {
    return `在${sceneTitle}中，林深感受到了前所未有的紧张与期待。空气中弥漫着神秘的味道，仿佛有什么重要的事情即将发生...`;
  }
}

/**
 * 生成结尾段落
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param characters 角色列表
 * @param continuityData 连续性数据
 * @returns 结尾段落内容
 */
async function _generateClosingParagraph(
  sceneTitle: string,
  sceneSummary: string,
  characters: Character[]
): Promise<string> {
  try {
    // 检查是否为测试模式
    const isTestMode = process.env.OPENAI_API_KEY === 'test-api-key-for-debugging';

    if (isTestMode) {
      console.log('🔧 检测到测试模式，生成模拟结尾段落');
      return generateTestClosingParagraph(sceneTitle);
    }

    // 构建结尾段落生成提示词
    const prompt = `请为以下场景生成一个引人深思的结尾段落（100-150字）：

场景标题：${sceneTitle}
场景摘要：${sceneSummary}
主要角色：${characters.map(c => c.name).join('、')}

要求：
1. 结尾段落应该总结场景要点，留下悬念或过渡到下一个场景
2. 语言生动，富有感染力
3. 字数控制在100-150字
4. 为后续场景发展做好铺垫
5. 保持故事的连贯性和吸引力

请直接返回段落内容，不要包含标题或其他格式。`;

    // 记录关键提示词信息
    console.log('AI结尾段落生成提示词:', prompt);

    // 对于结尾段落，我们不需要严格的JSON格式，直接返回文本
    // 调用OpenAI API
    const completion = await new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL,
        "X-Title": process.env.SITE_NAME,
      },
    }).chat.completions.create({
      model: process.env.OPENAI_MODEL || '',
      messages: [
        {
          role: "system",
          content: `你是一个专业的小说写作助手，擅长为场景创作引人深思的结尾段落。请根据场景标题、摘要和角色信息，创作一个总结性的结尾段落。段落应该：
1. 总结场景要点，留下悬念或过渡到下一个场景
2. 语言生动，富有感染力
3. 字数控制在100-150字
4. 为后续场景发展做好铺垫
5. 保持故事的连贯性和吸引力

请直接返回段落内容，不要包含标题或其他格式。`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI结尾段落生成完成');

    return responseContent.trim();

  } catch (error) {
    console.error('生成结尾段落失败:', error);
    return `场景${sceneTitle}的结尾段落生成失败`;
  }
}

/**
 * 生成测试用的结尾段落
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @returns 测试用的结尾段落
 */
function generateTestClosingParagraph(sceneTitle: string): string {
  // 根据场景标题生成不同的测试段落
  if (sceneTitle.includes('残卷') || sceneTitle.includes('幻影')) {
    return "林深的手指停留在幻影之上，心中涌起莫名的悸动。那女子的身影渐渐淡去，但耳垂的朱砂痣却清晰地烙印在他的记忆里，仿佛在诉说着一个尘封已久的故事...";
  } else if (sceneTitle.includes('雨夜') || sceneTitle.includes('废墟')) {
    return "雨幕中，陆知秋抬起头，四目相对的瞬间，林深看到了她眼中的惊讶与疑惑。泥泞的废墟上，两个身影在暴雨中相遇，命运的齿轮开始转动...";
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    return "茉莉的香气在雨中弥漫，林深的心跳加速。那朱砂痣的巧合绝非偶然，母亲的遗照、日记的幻影、眼前的女子，三者之间一定存在着某种神秘的联系...";
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    return "林深紧紧握住那枚怀表，1943年的立秋永远定格在这一刻。泛黄照片上的少女面容与母亲年轻时的模样惊人相似，时间的迷雾中，真相若隐若现...";
  } else {
    return `随着${sceneTitle}的结束，林深意识到这只是故事的开始。更多的谜团和挑战在前方等待着他，但他已经准备好面对这一切...`;
  }
}

/**
 * 记录连续性数据
 * @param sceneNumber 场景号
 * @param scene 场景信息
 * @param characters 角色列表
 * @param continuityData 连续性数据数组
 */
function recordContinuityData(
  sceneNumber: number,
  scene: Scene,
  characters: Character[],
  continuityData: ContinuityData[]
): void {
  // 提取场景中的重要细节和事实
  const importantDetails = [
    `场景${sceneNumber}: ${scene.title}`,
    `摘要: ${scene.summary}`
  ];

  // 提取涉及的角色
  const sceneCharacters = characters
    .filter(char => scene.summary.includes(char.name))
    .map(char => char.name);

  // 创建连续性记录
  const continuity: ContinuityData = {
    sceneNumber: sceneNumber,
    importantDetails: importantDetails,
    facts: [scene.summary],
    characters: sceneCharacters,
    locations: [] // 可以从场景摘要中提取地点信息
  };

  continuityData.push(continuity);
  console.log(`记录场景 ${sceneNumber} 的连续性数据:`, continuity);
}

/**
 * 检查连续性
 * @param continuityData 连续性数据数组
 * @returns 连续性检查结果
 */
function checkContinuity(continuityData: ContinuityData[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // 检查角色一致性
  for (let i = 1; i < continuityData.length; i++) {
    const prevScene = continuityData[i - 1];
    const currScene = continuityData[i];

    // 检查角色是否合理过渡
    const prevCharacters = new Set(prevScene.characters);
    const currCharacters = new Set(currScene.characters);

    // 检查是否有突然出现的新角色没有合理解释
    currCharacters.forEach(char => {
      if (!prevCharacters.has(char) && !currScene.importantDetails.some(detail => detail.includes(`${char}首次出现`))) {
        issues.push(`场景 ${currScene.sceneNumber}: 角色 ${char} 突然出现，缺乏合理过渡`);
      }
    });
  }

  // 检查情节发展连贯性
  for (let i = 1; i < continuityData.length; i++) {
    const prevScene = continuityData[i - 1];
    const currScene = continuityData[i];

    // 检查场景之间是否有逻辑联系
    const hasLogicalConnection = currScene.importantDetails.some(detail =>
      detail.includes('继续') || detail.includes('随后') || detail.includes('接着') ||
      prevScene.importantDetails.some(prevDetail =>
        prevDetail.includes('开始') || prevDetail.includes('准备') || prevDetail.includes('计划')
      )
    );

    if (!hasLogicalConnection) {
      issues.push(`场景 ${currScene.sceneNumber} 与场景 ${prevScene.sceneNumber} 之间缺乏逻辑联系`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues: issues
  };
}


/**
 * 生成完整场景内容
 * @param outline 大纲数据（内存数据）
 * @param scenes 场景数据（内存数据）
 * @param paragraphs 段落数据（内存数据）
 * @param startSceneNumber 起始场景号（默认1）
 * @param sceneCount 生成场景数（默认1）
 * @returns 生成的完整场景内容
 */
async function generateFullSceneContent(
  outline: StoryOutline,
  scenes: ChapterScenes,
  paragraphs: SceneParagraphs[],
  startSceneNumber: number = 1,
  sceneCount: number = scenes.scenes.length // 修复：生成所有场景而不是只生成1个
): Promise<FullSceneContent[]> {
  try {
    // 记录关键参数信息
    console.log('开始生成完整场景内容，起始场景号:', startSceneNumber, '生成场景数:', sceneCount, '书籍标题:', outline.title);

    const results: FullSceneContent[] = [];

    // 获取指定章节的场景
    const chapter = scenes.chapter;
    const sceneList = scenes.scenes;

    // 生成指定场景的完整内容
    for (let i = 0; i < sceneCount; i++) {
      const sceneNumber = startSceneNumber + i;
      const scene = sceneList.find((s: {
        sceneNumber: number;
        title: string;
        summary: string;
      }) => s.sceneNumber === sceneNumber);

      if (!scene) {
        console.warn(`场景 ${sceneNumber} 未找到，跳过`);
        continue;
      }

      console.log(`生成场景 ${sceneNumber} 完整内容，标题: ${scene.title}`);

      // 获取该场景的段落信息
      const sceneParagraphs = paragraphs.find((p: {
        sceneNumber: number;
        title: string;
        openingParagraph: string;
        closingParagraph: string;
      }) => p.sceneNumber === sceneNumber);
      if (!sceneParagraphs) {
        console.warn(`场景 ${sceneNumber} 的段落信息未找到，跳过`);
        continue;
      }

      // 调用AI模型生成完整的场景内容
      const fullContent = await generateCompleteSceneContent(
        scene.title,
        scene.summary,
        sceneParagraphs.openingParagraph,
        sceneParagraphs.closingParagraph,
        outline.characters,
        chapter
      );

      // 记录重要细节和事实以确保连续性
      const continuityNotes = await generateContinuityNotes(
        scene.title,
        scene.summary,
        fullContent,
        outline.characters
      );

      // 构建完整场景内容数据
      const fullSceneContent: FullSceneContent = {
        sceneNumber: sceneNumber,
        title: scene.title,
        fullContent: fullContent,
        continuityNotes: continuityNotes
      };

      results.push(fullSceneContent);

      // 保存完整场景内容到文件，使用动态书籍名称和章节号
      const safeTitle = (outline.title || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const fileName = `data/${safeTitle}-chapter-${chapter}-scene-${sceneNumber}-full.json`;
      await fs.promises.writeFile(fileName, JSON.stringify(fullSceneContent, null, 2), 'utf8');
      console.log(`场景 ${sceneNumber} 完整内容已保存到 ${fileName}`);
    }

    console.log('完整场景内容生成完成');
    return results;

  } catch (error) {
    console.error('生成完整场景内容失败:', error);
    throw new Error(`生成完整场景内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成完整的场景内容
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param openingParagraph 开头段落
 * @param closingParagraph 结尾段落
 * @param characters 角色列表
 * @param chapter 章节信息
 * @returns 完整的场景内容
 */
async function generateCompleteSceneContent(
  sceneTitle: string,
  sceneSummary: string,
  openingParagraph: string,
  closingParagraph: string,
  characters: Character[],
  chapter: number
): Promise<string> {
  try {
    // 构建完整场景内容生成提示词
    const prompt = `请根据以下信息生成一个完整的场景内容：

场景标题：${sceneTitle}
场景摘要：${sceneSummary}
章节信息：第${chapter}章
主要角色：${characters.map(c => c.name).join('、')}

开头段落（必须以此开始）：
${openingParagraph}

结尾段落（必须以此结束）：
${closingParagraph}

要求：
1. 必须以提供的开头段落开始
2. 必须以提供的结尾段落结束
3. 中间内容要连贯自然，符合场景摘要的描述
4. 字数控制在300-500字
5. 包含适当的对话和动作描写
6. 保持角色性格的一致性
7. 确保情节发展的逻辑性

请直接返回完整的场景内容，不要包含标题或其他格式。`;

    // 记录关键提示词信息
    console.log('AI完整场景内容生成提示词:', prompt);

    // 对于完整场景内容，我们不需要严格的JSON格式，直接返回文本
    // 调用OpenAI API
    const completion = await new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL,
        "X-Title": process.env.SITE_NAME,
      },
    }).chat.completions.create({
      model: process.env.OPENAI_MODEL || '',
      messages: [
        {
          role: "system",
          content: `你是一个专业的小说写作助手，擅长创作完整的场景内容。请根据场景标题、摘要、开头段落和结尾段落，创作一个连贯完整的场景。场景应该：
1. 以提供的开头段落开始
2. 以提供的结尾段落结束
3. 中间内容连贯自然，符合场景描述
4. 包含适当的对话和动作描写
5. 保持角色性格的一致性
6. 确保情节发展的逻辑性

请直接返回完整的场景内容，不要包含标题或其他格式。`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI完整场景内容生成完成');

    return responseContent.trim();

  } catch (error) {
    console.error('生成完整场景内容失败:', error);
    return `${openingParagraph}\n\n场景内容生成失败，请重试。\n\n${closingParagraph}`;
  }
}

/**
 * 生成连续性注释
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param fullContent 完整场景内容
 * @param characters 角色列表
 * @returns 连续性注释列表
 */
async function generateContinuityNotes(
  sceneTitle: string,
  sceneSummary: string,
  fullContent: string,
  characters: Character[]
): Promise<string[]> {
  try {
    // 构建连续性注释生成提示词
    const prompt = `请为以下场景生成连续性注释，确保故事连贯性：

场景标题：${sceneTitle}
场景摘要：${sceneSummary}
完整场景内容：
${fullContent}

主要角色：${characters.map(c => c.name).join('、')}

要求：
1. 提取3-5个重要的细节和事实
2. 确保这些细节对后续场景的连续性很重要
3. 包括角色状态、关键事件、重要决定等
4. 语言简洁明了，每个注释20-30字

请按照以下JSON格式返回：
{
  "continuityNotes": [
    "注释1",
    "注释2",
    "注释3",
    "注释4",
    "注释5"
  ]
}`;

    // 记录关键提示词信息
    console.log('AI连续性注释生成提示词:', prompt);

    // 定义JSON schema
    const schema = {
      type: "object",
      properties: {
        continuityNotes: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["continuityNotes"],
      additionalProperties: false
    };

    // 调用OpenAI API
    const completion = await new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL,
        "X-Title": process.env.SITE_NAME,
      },
    }).chat.completions.create({
      model: process.env.OPENAI_MODEL || '',
      messages: [
        {
          role: "system",
          content: `你是一个专业的小说写作助手，擅长为场景生成连续性注释。请根据场景信息，提取重要的细节和事实，确保故事连贯性。注释应该：
1. 包含3-5个重要的细节和事实
2. 确保这些细节对后续场景的连续性很重要
3. 包括角色状态、关键事件、重要决定等
4. 语言简洁明了，每个注释20-30字`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "continuity_notes",
          strict: true,
          schema: schema
        }
      },
      max_tokens: 300,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI连续性注释生成完成');

    // 由于使用了结构化输出，直接返回解析后的JSON
    try {
      const response = JSON.parse(responseContent);
      return response.continuityNotes || [];
    } catch (parseError) {
      console.error('连续性注释JSON解析失败:', parseError);
      throw new Error(`生成连续性注释失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

  } catch (error) {
    console.error('生成连续性注释失败:', error);
    return [
      `场景${sceneTitle}: 连续性注释生成失败`,
      `需要手动检查连续性`,
      `确保角色状态一致`,
      `检查情节发展逻辑性`,
      `验证时间线连贯性`
    ];
  }
}

/**
 * 组装完整书籍
 * @param outlineFilePath 大纲文件路径
 * @param scenesDirectory 场景文件目录
 * @param fullScenesDirectory 完整场景文件目录
 * @returns 完整书籍内容
 */
async function assembleFullBook(
  outlineFilePath: string,
  scenesDirectory: string = 'data',
  fullScenesDirectory: string = 'data'
): Promise<FullBookContent> {
  try {
    // 记录关键参数信息
    console.log('开始组装完整书籍，大纲文件路径:', outlineFilePath);

    // 读取并解析大纲JSON
    const outlineData = JSON.parse(fs.readFileSync(outlineFilePath, 'utf8'));

    // 使用大纲中的书籍标题
    const bookTitle = outlineData.title || `${outlineData.characters[0]?.name || '主角'}的故事`;

    const chapters: FullChapterContent[] = [];

    // 遍历所有章节
    for (const chapter of outlineData.chapters) {

      // 查找对应的场景文件，使用动态书籍名称
      const safeTitle = (bookTitle || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const scenesFilePath = path.join(scenesDirectory, `${safeTitle}-chapter-${chapter.chapter}-scenes.json`);

      try {
        const scenesData = JSON.parse(fs.readFileSync(scenesFilePath, 'utf8'));
        const scenes = scenesData.scenes;

        const chapterScenes: FullSceneContent[] = [];

        // 遍历章节中的所有场景
        for (const scene of scenes) {

          // 查找对应的完整场景文件，使用动态书籍名称和章节号
          const fullSceneFilePath = path.join(fullScenesDirectory, `${safeTitle}-chapter-${chapter.chapter}-scene-${scene.sceneNumber}-full.json`);

          try {
            const fullSceneData = JSON.parse(fs.readFileSync(fullSceneFilePath, 'utf8'));
            chapterScenes.push(fullSceneData);
          } catch {
            console.warn(`无法读取完整场景文件 ${fullSceneFilePath}，跳过`);
          }
        }

        // 构建章节内容，使用AI生成的章节标题
        const chapterContent: FullChapterContent = {
          chapterNumber: chapter.chapter,
          title: chapter.title || `第${chapter.chapter}章`,
          scenes: chapterScenes
        };

        chapters.push(chapterContent);

      } catch {
        console.warn(`无法读取场景文件 ${scenesFilePath}，跳过该章节`);
      }
    }

    // 构建完整书籍内容
    const fullBookContent: FullBookContent = {
      title: bookTitle,
      chapters: chapters
    };

    // 保存完整书籍到文件，使用动态书籍名称
    const safeBookTitle = (bookTitle || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const bookFilePath = path.join(fullScenesDirectory, `${safeBookTitle}-full-book.md`);
    await fs.promises.writeFile(bookFilePath, generateBookMarkdown(fullBookContent), 'utf8');
    console.log(`完整书籍已保存到 ${bookFilePath}`);

    console.log('完整书籍组装完成');
    return fullBookContent;

  } catch (error) {
    console.error('组装完整书籍失败:', error);
    throw new Error(`组装完整书籍失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成书籍Markdown格式
 * @param fullBookContent 完整书籍内容
 * @returns Markdown格式的书籍内容
 */
function generateBookMarkdown(fullBookContent: FullBookContent): string {
  console.log('=== generateBookMarkdown 调试日志 ===');
  console.log('时间:', new Date().toISOString());
  console.log('书籍标题:', fullBookContent.title);
  console.log('章节数量:', fullBookContent.chapters.length);

  let markdown = `# ${fullBookContent.title}\n\n`;

  for (const chapter of fullBookContent.chapters) {
    console.log(`处理章节: ${chapter.title} (${chapter.chapterNumber})`);
    console.log(`场景数量: ${chapter.scenes.length}`);

    markdown += `第${chapter.chapterNumber}章 ${chapter.title}\n\n`;

    for (const scene of chapter.scenes) {
      console.log(`场景 ${scene.sceneNumber}: ${scene.title}`);
      console.log(`连续性注释数量: ${scene.continuityNotes?.length || 0}`);
      console.log(`连续性注释内容:`, scene.continuityNotes);

      markdown += `${scene.fullContent}\n\n`;
    }

    markdown += '\n---\n\n';
  }

  console.log('=== generateBookMarkdown 完成 ===');
  return markdown;
}

// 导出函数
export {
  generateChapterScenes,
  generateSceneParagraphsBatch,
  generateSceneParagraphs,
  checkContinuity,
  generateFullSceneContent,
  assembleFullBook,
  generateBookMarkdown
};

/**
 * 生成故事大纲
 * @returns 生成的故事大纲
 */
export async function generateStoryOutline(
  protagonist: string = "未指定主角类型",
  plot: string = "未指定情节发展",
  conflict: string = "未指定冲突",
  outcome: string = "未指定故事结局"
): Promise<StoryOutline> {
  const generator = new AIStoryGenerator({
    apiKey: process.env.OPENAI_API_KEY || 'test-api-key-for-debugging',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || '',
    siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    siteName: process.env.SITE_NAME || '小说写作助手',
  });
  const outline = await generator.generateStoryOutline(protagonist, plot, conflict, outcome);

  // 保存大纲到文件
  // 确保data目录存在
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 使用动态文件名保存大纲
  const safeTitle = (outline.title || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  const outputPath = path.join(dataDir, `${safeTitle}-story-outline.json`);
  fs.writeFileSync(outputPath, JSON.stringify(outline, null, 2), 'utf8');

  console.log('大纲已保存到:', outputPath);

  return outline;
}
/**
 * 从文本中提取大纲信息
 * @param text AI返回的文本内容
 * @returns 提取的大纲信息
 */