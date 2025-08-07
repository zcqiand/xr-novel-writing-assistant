import OpenAI from 'openai';

// AI故事生成器配置接口
export interface AIStoryGeneratorConfig {
  baseUrl?: string;
  apiKey: string;
  model?: string;
  siteUrl?: string;
  siteName?: string;
}

// AI故事生成请求接口
export interface AIStoryRequest {
  theme: string;
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
      baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
      apiKey: config.apiKey,
      defaultHeaders: {
        "HTTP-Referer": config.siteUrl || "https://novel-writing-assistant.com",
        "X-Title": config.siteName || "Novel Writing Assistant",
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
      console.log('模型: z-ai/glm-4.5-air:free');
      console.log('请求参数:', JSON.stringify(request, null, 2));
      console.log('系统提示:', `你是一个专业的小说写作助手，擅长根据用户提供的故事元素创作出生动有趣的故事。请根据用户提供的主题、情节、冲突和结局，创作一个完整的故事。故事应该：
1. 情节连贯，逻辑清晰
2. 人物形象鲜明
3. 冲突设置合理
4. 结局符合用户要求
5. 语言生动，富有感染力`);
      console.log('用户提示:', prompt);
      console.log('=====================');

      // 调用OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.config.model || "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: `你是一个专业的小说写作助手，擅长根据用户提供的故事元素创作出生动有趣的故事。请根据用户提供的主题、情节、冲突和结局，创作一个完整的故事。故事应该：
1. 情节连贯，逻辑清晰
2. 人物形象鲜明
3. 冲突设置合理
4. 结局符合用户要求
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

      // 记录AI模型返回的内容
      console.log('=== AI模型返回内容 ===');
      console.log('时间:', new Date().toISOString());
      console.log('返回内容:', storyContent);
      console.log('标题:', this.extractTitle(storyContent));
      console.log('类型:', request.style || 'narrative');
      console.log('字数:', this.countWords(storyContent));
      console.log('=====================');

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
   * 构建提示词
   * @param request 故事生成请求
   * @returns 构建好的提示词
   */
  private buildPrompt(request: AIStoryRequest): string {
    const { theme, plot, conflict, outcome, style, length } = request;

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

故事主题：${theme}
情节发展：${plot}
主要冲突：${conflict}
故事结局：${outcome}
写作风格：${styleDescription}

请创作一个完整的故事，包括：
1. 吸引人的标题
2. 生动的人物形象
3. 连贯的情节发展
4. 合理的冲突设置
5. 符合要求的结局
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
      console.log('=== AI连接测试日志 ===');
      console.log('时间:', new Date().toISOString());
      console.log('测试模型: deepseek/deepseek-r1:free');
      console.log('测试请求: 请回复\'连接成功\'');
      console.log('=====================');

      const completion = await this.openai.chat.completions.create({
        model: this.config.model || "deepseek/deepseek-r1:free",

        messages: [
          {
            role: "user",
            content: "请回复'连接成功'"
          }
        ],
        max_tokens: 10,
      });

      const response = completion.choices[0]?.message?.content || '';

      console.log('=== AI连接测试返回内容 ===');
      console.log('时间:', new Date().toISOString());
      console.log('返回内容:', response);
      console.log('连接是否成功:', response.includes('连接成功'));
      console.log('=========================');

      return response.includes('连接成功');
    } catch (error) {
      console.error('AI连接测试失败:', error);
      return false;
    }
  }
}