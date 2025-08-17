import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { SYSTEM_PROMPT_STORY_OUTLINE, SYSTEM_PROMPT_STORY_CHAPTER_SCENES, SYSTEM_PROMPT_STORY_CHAPTER_PARAGRAPHS_BOUNDING, SYSTEM_PROMPT_PARAGRAPHS, SYSTEM_PROMPT_CONTINUITY_NOTES, USER_PROMPT_STORY_OUTLINE, USER_PROMPT_STORY_CHAPTER_SCENES, USER_PROMPT_STORY_CHAPTER_PARAGRAPHS_BOUNDING, USER_PROMPT_PARAGRAPHS, CUSER_PROMPT_CONTINUITY_NOTES } from './constants';
import { supabase } from './supabase';

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
 * 生成故事大纲
 * @returns 生成的故事大纲
 */
async function generateStoryOutline(
  id: string = '未指定ID',
  protagonist: string = "未指定主角类型",
  plot: string = "未指定情节发展",
  conflict: string = "未指定冲突",
  outcome: string = "未指定故事结局",
  length: 'short' | 'medium' | 'long' = 'medium'
): Promise<{ outline: StoryOutline; story_id: string }> {
  const generator = new AIStoryGenerator({
    apiKey: process.env.OPENAI_API_KEY || 'test-api-key-for-debugging',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || '',
    siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    siteName: process.env.SITE_NAME || '小说写作助手',
  });
  const outline = await generator.generateStoryOutlineForOpenAI(protagonist, plot, conflict, outcome, length);

  // 保存故事到Supabase数据库
  let story_id: string;
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        id: id, // 使用传入的ID
        title: outline.title,
        protagonist,
        plot,
        conflict,
        outcome,
        length,
        outline_data: outline
      })
      .select()
      .single();

    if (error) {
      console.error('保存故事到Supabase失败:', error);
      throw new Error(`保存故事到Supabase失败: ${error.message}`);
    }

    if (!data || !data.id) {
      throw new Error('数据库返回的数据中没有ID');
    }

    story_id = data.id;
    console.log('故事已保存到Supabase:', data);
  } catch (error) {
    console.error('保存故事到Supabase时发生错误:', error);
    throw new Error(`保存故事到Supabase失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }

  return { outline, story_id };
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
   * 生成故事大纲
   * @param protagonist 主角类型
   * @param plot 情节发展
   * @param conflict 主要冲突
   * @param outcome 故事结局
   * @param length 故事篇幅
   * @returns 生成的故事大纲
   */
  async generateStoryOutlineForOpenAI(
    protagonist: string,
    plot: string,
    conflict: string,
    outcome: string,
    length?: 'short' | 'medium' | 'long'
  ): Promise<StoryOutline> {
    try {
      // 构建大纲生成提示词
      const prompt = this.buildOutlinePrompt(protagonist, plot, conflict, outcome, length);

      // 记录发送给AI模型的提示
      console.log('=== AI大纲生成调用日志 ===');
      console.log('时间:', new Date().toISOString());
      console.log('模型:', process.env.OPENAI_MODEL);
      console.log('请求参数:', { protagonist: protagonist, plot, conflict, outcome, length });
      console.log('系统提示:', SYSTEM_PROMPT_STORY_OUTLINE);
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

      console.log(`⏰ [${new Date().toISOString()}] 开始调用OpenAI API生成大纲`);
      const apiStartTime = Date.now();

      // 调用OpenAI API，添加超时控制
      const completion = await Promise.race([
        this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT_STORY_OUTLINE
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
          temperature: 0.7,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenAI API调用超时（120秒）')), 120000)
        )
      ]);

      const apiDuration = Date.now() - apiStartTime;
      console.log(`✅ [${new Date().toISOString()}] OpenAI API调用完成，耗时: ${apiDuration}ms`);

      const responseContent = (completion as any).choices[0]?.message?.content || '';

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
   * @param length 故事篇幅
   * @returns 构建好的提示词
   */
  private buildOutlinePrompt(
    protagonist: string,
    plot: string,
    conflict: string,
    outcome: string,
    length?: 'short' | 'medium' | 'long'
  ): string {
    const lengthDescription = length ? this.getLengthDescription(length) : '短篇故事，约5-8章';

    return USER_PROMPT_STORY_OUTLINE
      .replace(/{protagonist}/g, protagonist)
      .replace(/{plot}/g, plot)
      .replace(/{conflict}/g, conflict)
      .replace(/{outcome}/g, outcome)
      .replace(/{lengthDescription}/g, lengthDescription);
  }

  /**
   * 获取长度描述
   * @param length 长度类型
   * @returns 长度描述
   */
  private getLengthDescription(length: string): string {
    const lengthMap: Record<string, string> = {
      'short': '短篇故事，约5-8章',
      'medium': '中篇故事，约15-30章',
      'long': '长篇故事，50章以上'
    };
    return lengthMap[length] || '短篇故事，约5-8章';
  }

}

// 段落（完整场景内容）接口
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
  summary: string;
}

// 章节场景接口
export interface ChapterScenes {
  chapter: number;
  scenes: Scene[];
}

/**
 * 生成场景
 * @param outline 大纲数据（内存数据）
 * @param story_id 故事ID（用于关联数据库记录）
 * @param startChapter 起始章节号（默认1）
 * @param chapterCount 生成章节数（默认1）
 * @returns 生成的场景数据
 */
async function generateScenes(
  outline: StoryOutline,
  story_id: string,
  startChapter: number = 1,
  chapterCount: number = outline.chapters.length // 修复：生成所有章节而不是只生成1个
): Promise<ChapterScenes[]> {
  try {
    console.log('=== generateScenes 函数开始 ===');
    console.log('时间:', new Date().toISOString());
    console.log('故事ID:', story_id);
    console.log('书籍标题:', outline.title);
    console.log('起始章节:', startChapter);
    console.log('生成章节数:', chapterCount);
    console.log('总章节数:', outline.chapters.length);

    const results: ChapterScenes[] = [];
    if (process.env.DEBUG_MODE === 'true') {
      console.log('DEBUG_MODE=true，限制生成1个章节');
      chapterCount = 1;
    }

    // 验证outline数据结构
    if (!outline.chapters || !Array.isArray(outline.chapters)) {
      throw new Error('outline.chapters 必须是数组');
    }

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

      console.log(`\n--- 处理章节 ${chapterNumber} ---`);
      console.log('章节标题:', chapter.title);
      console.log('章节摘要:', chapter.summary);

      try {
        // 调用AI模型生成该章节所有场景
        console.log('开始调用AI生成场景...');
        const scenes = await generateScenesTitleForOpenAI(chapter.summary);
        console.log('AI场景生成完成，生成场景数:', scenes.length);

        // 构建章节场景数据
        const chapterScenes: ChapterScenes = {
          chapter: chapterNumber,
          scenes: scenes
        };

        results.push(chapterScenes);

        // 保存场景数据到Supabase数据库
        console.log('开始保存场景到Supabase数据库...');
        console.log('表名: story_chapter_scenes');
        console.log('插入数据:', {
          story_id: story_id,
          chapter_number: chapterNumber,
          scenes_data: chapterScenes
        });

        try {
          const { data, error } = await supabase
            .from('story_chapter_scenes')
            .insert({
              story_id: story_id,
              chapter_number: chapterNumber,
              scenes_data: chapterScenes
            })
            .select()
            .single();

          if (error) {
            console.error(`❌ 保存章节 ${chapterNumber} 场景到Supabase失败:`, error);
            console.error('错误代码:', error.code);
            console.error('错误详情:', error.details);
            console.error('错误 hint:', error.hint);
            throw new Error(`保存章节 ${chapterNumber} 场景到Supabase失败: ${error.message}`);
          }

          console.log(`✅ 章节 ${chapterNumber} 场景已保存到Supabase:`, data);
        } catch (dbError) {
          console.error(`❌ 保存章节 ${chapterNumber} 场景到Supabase时发生数据库错误:`, dbError);
          console.error('错误类型:', dbError instanceof Error ? dbError.constructor.name : '未知类型');
          console.error('错误消息:', dbError instanceof Error ? dbError.message : '未知错误');
          throw new Error(`保存章节 ${chapterNumber} 场景到Supabase失败: ${dbError instanceof Error ? dbError.message : '未知错误'}`);
        }
      } catch (chapterError) {
        console.error(`❌ 处理章节 ${chapterNumber} 时发生错误:`, chapterError);
        throw new Error(`处理章节 ${chapterNumber} 失败: ${chapterError instanceof Error ? chapterError.message : '未知错误'}`);
      }
    }

    console.log('=== generateScenes 函数成功完成 ===');
    console.log('总共生成章节:', results.length);
    return results;

  } catch (error) {
    console.error('❌ generateScenes 函数失败:', error);
    console.error('错误类型:', error instanceof Error ? error.constructor.name : '未知类型');
    console.error('错误消息:', error instanceof Error ? error.message : '未知错误');
    console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');

    throw new Error(`生成章节场景失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 为指定章节生成场景
 * @param chapterSummary 章节摘要
 * @param chapterNumber 章节号
 * @returns 生成的场景列表
 */
async function generateScenesTitleForOpenAI(chapterSummary: string): Promise<Scene[]> {
  try {
    console.log('=== generateScenesTitleForOpenAI 函数开始 ===');
    console.log('时间:', new Date().toISOString());
    console.log('章节摘要长度:', chapterSummary.length);
    console.log('章节摘要:', chapterSummary.substring(0, 100) + '...');

    // 检查环境变量
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL;

    console.log('API配置检查:');
    console.log('- API Key存在:', !!apiKey);
    console.log('- Base URL:', baseUrl || '未设置');
    console.log('- Model:', model || '未设置');

    // 检查是否为测试模式
    const isTestMode = apiKey === 'test-api-key-for-debugging';
    console.log('测试模式:', isTestMode);

    if (isTestMode) {
      console.log('🔧 检测到测试模式，返回模拟场景数据');
      return [
        { sceneNumber: 1, summary: '测试场景1' },
        { sceneNumber: 2, summary: '测试场景2' }
      ];
    }

    // 构建场景生成提示词
    const prompt = USER_PROMPT_STORY_CHAPTER_SCENES
      .replace(/{chapterSummary}/g, chapterSummary);

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
              summary: { type: "string" }
            },
            required: ["sceneNumber", "summary"],
            additionalProperties: false
          }
        }
      },
      required: ["scenes"],
      additionalProperties: false
    };

    console.log('开始调用OpenAI API...');

    // 调用OpenAI API，添加超时控制
    const apiStartTime = Date.now();
    const completion = await Promise.race([
      new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
        defaultHeaders: {
          "HTTP-Referer": process.env.SITE_URL,
          "X-Title": process.env.SITE_NAME,
        },
      }).chat.completions.create({
        model: model || '',
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT_STORY_CHAPTER_SCENES
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
        temperature: 0.7,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI API调用超时（120秒）')), 120000)
      )
    ]);

    const apiDuration = Date.now() - apiStartTime;
    console.log(`✅ [${new Date().toISOString()}] OpenAI API调用完成，耗时: ${apiDuration}ms`);

    const responseContent = (completion as any).choices[0]?.message?.content || '';
    console.log('OpenAI API响应内容:', responseContent);

    // 记录生成结果
    console.log('AI场景生成完成');

    // 由于使用了结构化输出，直接返回解析后的JSON
    try {
      const response = JSON.parse(responseContent);
      const scenes = response.scenes || [];
      console.log('解析后的场景数量:', scenes.length);

      // 确保场景编号正确
      const processedScenes = scenes.map((scene: {
        sceneNumber: number;
        summary: string;
      }, index: number) => ({
        sceneNumber: index + 1,
        summary: scene.summary || '场景摘要'
      }));

      console.log('处理后的场景:', processedScenes);
      return processedScenes;
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError);
      console.error('响应内容:', responseContent);
      throw new Error(`生成场景失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

  } catch (error) {
    console.error('❌ generateScenesTitleForOpenAI 函数失败:', error);
    console.error('错误类型:', error instanceof Error ? error.constructor.name : '未知类型');
    console.error('错误消息:', error instanceof Error ? error.message : '未知错误');
    console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');

    throw new Error(`生成场景失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 段落（边界）生成接口
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
 * 生成段落（边界）
 * @param outline 大纲数据（内存数据）
 * @param scenes 场景数据（内存数据）
 * @param story_id 故事ID（用于关联数据库记录）
 * @param startSceneNumber 起始场景号（默认1）
 * @param sceneCount 生成场景数（默认1）
 * @returns 生成的段落（边界）数据
 */
async function generateParagraphsBounding(
  outline: StoryOutline,
  scenes: ChapterScenes,
  story_id: string,
  startSceneNumber: number = 1,
  sceneCount: number = scenes.scenes.length // 修复：生成所有场景而不是只生成1个
): Promise<SceneParagraphs[]> {
  try {
    // 记录关键参数信息
    console.log('开始生成段落（边界），起始场景号:', startSceneNumber, '生成场景数:', sceneCount, '书籍标题:', outline.title);

    const results: SceneParagraphs[] = [];
    const continuityData: ContinuityData[] = [];

    // 获取指定章节的场景
    const chapter = scenes.chapter;
    const sceneList = scenes.scenes;

    // 生成指定场景的段落（边界）

    for (let i = 0; i < sceneCount; i++) {
      const sceneNumber = startSceneNumber + i;
      console.log(`\n--- 查找场景 ${sceneNumber} ---`);
      console.log(`sceneList 长度: ${sceneList.length}`);

      const scene = sceneList.find((s: Scene) => s.sceneNumber === sceneNumber);
      console.log('找到的场景:', scene);

      if (!scene) {
        console.warn(`❌ 场景 ${sceneNumber} 未找到，跳过`);
        console.log('可用的场景编号:', sceneList.map(s => s.sceneNumber));
        continue;
      }

      console.log(`✅ 生成场景 ${sceneNumber} 段落 ===`);
      console.log(`场景摘要: ${scene.summary}`);

      // 调用新的合并函数同时生成开头和结尾段落
      const paragraphs = await generateSceneParagraphsForOpenAI(
        `场景${sceneNumber}`,
        scene.summary,
        outline.characters
      );

      // 构建段落（边界）
      const sceneParagraphs: SceneParagraphs = {
        sceneNumber: sceneNumber,
        title: `场景${sceneNumber}`,
        openingParagraph: paragraphs.openingParagraph,
        closingParagraph: paragraphs.closingParagraph
      };

      results.push(sceneParagraphs);

      // 记录连续性数据
      recordContinuityData(sceneNumber, scene, outline.characters, continuityData);

      // 保存段落数据到Supabase数据库
      try {
        const { data, error } = await supabase
          .from('story_chapter_scene_paragraphs_bounding')
          .insert({
            story_id: story_id,
            chapter_number: chapter,
            scene_number: sceneNumber,
            title: sceneParagraphs.title,
            opening_paragraph: sceneParagraphs.openingParagraph,
            closing_paragraph: sceneParagraphs.closingParagraph
          })
          .select()
          .single();

        if (error) {
          console.error(`保存场景 ${sceneNumber} 段落到Supabase失败:`, error);
          throw new Error(`保存场景 ${sceneNumber} 段落到Supabase失败: ${error.message}`);
        }

        console.log(`场景 ${sceneNumber} 段落已保存到Supabase:`, data);
      } catch (error) {
        console.error(`保存场景 ${sceneNumber} 段落到Supabase时发生错误:`, error);
        throw new Error(`保存场景 ${sceneNumber} 段落到Supabase失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    console.log('段落（边界）生成完成');
    return results;

  } catch (error) {
    console.error('生成段落（边界）失败:', error);
    throw new Error(`生成段落（边界）失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成段落（边界）
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param characters 角色列表
 * @returns 包含开头和结尾段落的对象
 */
async function generateSceneParagraphsForOpenAI(
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
        openingParagraph: `场景${sceneTitle}的开头段落生成成功（测试模式）`,
        closingParagraph: `场景${sceneTitle}的结尾段落生成成功（测试模式）`
      };
    }

    // 构建段落生成提示词
    const prompt = USER_PROMPT_STORY_CHAPTER_PARAGRAPHS_BOUNDING
      .replace(/{sceneTitle}/g, sceneTitle)
      .replace(/{sceneSummary}/g, sceneSummary)
      .replace(/{characters}/g, characters.map(c => c.name).join('、'));

    // 记录关键提示词信息
    console.log('AI段落（边界）生成提示词:', prompt);

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
          content: SYSTEM_PROMPT_STORY_CHAPTER_PARAGRAPHS_BOUNDING
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
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI段落（边界）生成完成');

    // 由于使用了结构化输出，直接解析JSON
    try {
      const response = JSON.parse(responseContent);
      return {
        openingParagraph: response.openingParagraph?.trim() || '',
        closingParagraph: response.closingParagraph?.trim() || ''
      };
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      throw new Error(`生成段落（边界）失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

  } catch (error) {
    console.error('生成段落（边界）失败:', error);
    return {
      openingParagraph: `场景${sceneTitle}的开头段落生成失败`,
      closingParagraph: `场景${sceneTitle}的结尾段落生成失败`
    };
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
    `场景${sceneNumber}: 场景摘要`,
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
 * 生成段落（完整场景内容）
 * @param outline 大纲数据（内存数据）
 * @param scenes 场景数据（内存数据）
 * @param paragraphs 段落数据（内存数据）
 * @param story_id 故事ID（用于关联数据库记录）
 * @param startSceneNumber 起始场景号（默认1）
 * @param sceneCount 生成场景数（默认1）
 * @returns 生成的段落（完整场景内容）
 */
async function generateParagraphs(
  outline: StoryOutline,
  scenes: ChapterScenes,
  paragraphs: SceneParagraphs[],
  story_id: string,
  startSceneNumber: number = 1,
  sceneCount: number = scenes.scenes.length // 修复：生成所有场景而不是只生成1个
): Promise<FullSceneContent[]> {
  try {
    // 记录关键参数信息
    console.log('开始生成段落（完整场景内容），起始场景号:', startSceneNumber, '生成场景数:', sceneCount, '书籍标题:', outline.title);

    const results: FullSceneContent[] = [];

    // 获取指定章节的场景
    const chapter = scenes.chapter;
    const sceneList = scenes.scenes;

    // 生成指定场景的完整内容
    for (let i = 0; i < sceneCount; i++) {
      const sceneNumber = startSceneNumber + i;
      const scene = sceneList.find((s: Scene) => s.sceneNumber === sceneNumber);

      if (!scene) {
        console.warn(`场景 ${sceneNumber} 未找到，跳过`);
        continue;
      }

      console.log(`生成场景 ${sceneNumber} 完整内容`);

      // 获取该场景的段落信息
      const sceneParagraphs = paragraphs.find((p: SceneParagraphs) => p.sceneNumber === sceneNumber);
      if (!sceneParagraphs) {
        console.warn(`场景 ${sceneNumber} 的段落信息未找到，跳过`);
        continue;
      }

      // 调用AI模型生成完整的场景内容
      const fullContent = await generateSceneContentForOpenAI(
        `场景${sceneNumber}`,
        scene.summary,
        sceneParagraphs.openingParagraph,
        sceneParagraphs.closingParagraph,
        outline.characters,
        chapter
      );

      // 记录重要细节和事实以确保连续性
      const continuityNotes = await generateContinuityNotesForOpenAI(
        `场景${sceneNumber}`,
        scene.summary,
        fullContent,
        outline.characters
      );

      // 构建段落（完整场景内容）数据
      const fullSceneContent: FullSceneContent = {
        sceneNumber: sceneNumber,
        title: `场景${sceneNumber}`,
        fullContent: fullContent,
        continuityNotes: continuityNotes
      };

      results.push(fullSceneContent);

      // 保存段落（完整场景内容）到Supabase数据库
      try {
        const { data, error } = await supabase
          .from('story_chapter_scene_paragraphs')
          .insert({
            story_id: story_id,
            chapter_number: chapter,
            scene_number: sceneNumber,
            title: fullSceneContent.title,
            full_content: fullSceneContent.fullContent,
            continuity_notes: fullSceneContent.continuityNotes
          })
          .select()
          .single();

        if (error) {
          console.error(`保存场景 ${sceneNumber} 完整内容到Supabase失败:`, error);
          throw new Error(`保存场景 ${sceneNumber} 完整内容到Supabase失败: ${error.message}`);
        }

        console.log(`场景 ${sceneNumber} 完整内容已保存到Supabase:`, data);
      } catch (error) {
        console.error(`保存场景 ${sceneNumber} 完整内容到Supabase时发生错误:`, error);
        throw new Error(`保存场景 ${sceneNumber} 完整内容到Supabase失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    console.log('段落（完整场景内容）生成完成');
    return results;

  } catch (error) {
    console.error('生成段落（完整场景内容）失败:', error);
    throw new Error(`生成段落（完整场景内容）失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成段落（完整场景内容）
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param openingParagraph 开头段落
 * @param closingParagraph 结尾段落
 * @param characters 角色列表
 * @param chapter 章节信息
 * @returns 段落（完整场景内容）
 */
async function generateSceneContentForOpenAI(
  sceneTitle: string,
  sceneSummary: string,
  openingParagraph: string,
  closingParagraph: string,
  characters: Character[],
  chapter: number
): Promise<string> {
  try {
    // 生成连续性注释
    const continuityNotes = await generateContinuityNotesForOpenAI(
      sceneTitle,
      sceneSummary,
      '', // 临时为空，因为完整内容还未生成
      characters
    );

    // 构建段落（完整场景内容）生成提示词，不使用场景标题
    const prompt = USER_PROMPT_PARAGRAPHS
      .replace(/{sceneSummary}/g, sceneSummary)
      .replace(/{chapter}/g, chapter.toString())
      .replace(/{characters}/g, characters.map(c => c.name).join('、'))
      .replace(/{openingParagraph}/g, openingParagraph)
      .replace(/{closingParagraph}/g, closingParagraph)
      .replace(/{continuityNotes}/g, continuityNotes.join('；'));

    // 记录关键提示词信息
    console.log('AI段落（完整场景内容）生成提示词:', prompt);

    // 对于段落（完整场景内容），我们不需要严格的JSON格式，直接返回文本
    // 调用OpenAI API，添加超时控制
    const apiStartTime = Date.now();
    const completion = await Promise.race([
      new OpenAI({
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
            content: SYSTEM_PROMPT_PARAGRAPHS
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI API调用超时（120秒）')), 120000)
      )
    ]);

    const apiDuration = Date.now() - apiStartTime;
    console.log(`✅ [${new Date().toISOString()}] OpenAI API调用完成，耗时: ${apiDuration}ms`);

    const responseContent = (completion as any).choices[0]?.message?.content || '';

    // 记录生成结果
    console.log('AI段落（完整场景内容）生成完成');

    return responseContent.trim();

  } catch (error) {
    console.error('生成段落（完整场景内容）失败:', error);
    return `${openingParagraph}\n\n场景内容生成失败，请重试。\n\n${closingParagraph}`;
  }
}

/**
 * 生成连续性注释
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @param fullContent 段落（完整场景内容）
 * @param characters 角色列表
 * @returns 连续性注释列表
 */
async function generateContinuityNotesForOpenAI(
  sceneTitle: string,
  sceneSummary: string,
  fullContent: string,
  characters: Character[]
): Promise<string[]> {
  try {
    // 构建连续性注释生成提示词
    const prompt = CUSER_PROMPT_CONTINUITY_NOTES
      .replace(/{sceneTitle}/g, sceneTitle)
      .replace(/{sceneSummary}/g, sceneSummary)
      .replace(/{fullContent}/g, fullContent)
      .replace(/{characters}/g, characters.map(c => c.name).join('、'));

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
          content: SYSTEM_PROMPT_CONTINUITY_NOTES
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
 * @param storyId 故事ID
 * @param scenesDirectory 场景文件目录
 * @param fullScenesDirectory 完整场景文件目录
 * @returns 完整书籍内容
 */
async function assembleFullBook(
  storyId?: string,
  fullScenesDirectory: string = 'data'
): Promise<FullBookContent> {
  try {
    // 记录关键参数信息
    console.log('开始组装完整书籍，故事ID:', storyId);

    // 从Supabase数据库读取故事数据
    const { data: outlineRecords, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('从Supabase读取故事失败:', error);
      throw new Error(`从Supabase读取故事失败: ${error.message}`);
    }

    interface StoryRecord {
      id: string;
      title: string;
      chapters: Array<{
        chapter: number;
        title: string;
      }>;
      outline_data: StoryOutline;
    }

    let outlineData: StoryRecord;

    // 如果指定了storyId，则查找特定的故事
    if (storyId) {
      if (!outlineRecords || outlineRecords.length === 0) {
        throw new Error('未找到任何故事数据');
      }
      outlineData = outlineRecords.find((item: StoryRecord) => item.id === storyId);
      if (!outlineData) {
        throw new Error(`未找到ID为 ${storyId} 的故事`);
      }
    } else if (!outlineRecords || outlineRecords.length === 0) {
      throw new Error('未找到任何故事数据');
    } else {
      // 使用最新的故事
      outlineData = outlineRecords[0];
    }

    // 添加调试日志 - 检查outlineData的结构
    console.log('=== 调试信息: outlineData结构 ===');
    console.log('outlineData:', JSON.stringify(outlineData, null, 2));
    console.log('outlineData类型:', typeof outlineData);
    console.log('outlineData.chapters存在:', !!outlineData.chapters);
    console.log('outlineData.chapters类型:', typeof outlineData.chapters);
    console.log('outlineData.chapters值:', outlineData.chapters);
    console.log('outlineData.outline_data存在:', !!outlineData.outline_data);
    console.log('outlineData.outline_data类型:', typeof outlineData.outline_data);
    console.log('outlineData.outline_data.chapters存在:', !!outlineData.outline_data?.chapters);
    console.log('outlineData.outline_data.chapters类型:', typeof outlineData.outline_data?.chapters);
    console.log('outlineData.outline_data.chapters值:', outlineData.outline_data?.chapters);
    console.log('=====================================');

    // 使用故事中的书籍标题
    const bookTitle = outlineData.title || `${outlineData.outline_data.characters[0]?.name || '主角'}的故事`;

    const chapters: FullChapterContent[] = [];

    // 修复：尝试从outline_data.chapters获取章节，如果直接访问chapters失败则使用outline_data.chapters
    const chaptersToIterate = outlineData.chapters || outlineData.outline_data?.chapters;

    if (!chaptersToIterate || !Array.isArray(chaptersToIterate)) {
      console.error('❌ chapters字段不是数组或不存在');
      console.error('outlineData.chapters:', outlineData.chapters);
      console.error('outlineData.outline_data.chapters:', outlineData.outline_data?.chapters);
      throw new Error('章节数据格式错误：chapters字段不是数组或不存在');
    }

    // 遍历所有章节
    for (const chapter of chaptersToIterate) {
      // 从Supabase读取场景数据
      const { data: chapterScenesData, error: scenesError } = await supabase
        .from('story_chapter_scenes')
        .select('*')
        .eq('story_id', outlineData.id)
        .eq('chapter_number', chapter.chapter);

      if (scenesError) {
        console.error(`读取章节 ${chapter.chapter} 场景数据失败:`, scenesError);
        continue;
      }

      if (!chapterScenesData || chapterScenesData.length === 0) {
        console.warn(`未找到章节 ${chapter.chapter} 的场景数据，跳过`);
        continue;
      }

      // 添加调试日志 - 检查场景数据结构
      console.log(`=== 调试信息: 章节 ${chapter.chapter} 场景数据结构 ===`);
      console.log(`chapterScenesData长度:`, chapterScenesData.length);
      console.log(`chapterScenesData[0]:`, JSON.stringify(chapterScenesData[0], null, 2));
      console.log(`scenes_data字段存在:`, !!chapterScenesData[0]?.scenes_data);
      console.log(`scenes_data字段类型:`, typeof chapterScenesData[0]?.scenes_data);
      console.log(`scenes_data字段值:`, chapterScenesData[0]?.scenes_data);
      console.log(`=============================================`);

      const chapterScenes: FullSceneContent[] = [];

      // 修复：检查scenes_data字段结构并正确访问场景数据
      const scenesData = chapterScenesData[0]?.scenes_data;
      if (!scenesData) {
        console.warn(`章节 ${chapter.chapter} 的scenes_data字段不存在，跳过场景处理`);
        continue;
      }

      // scenes_data的实际结构是 { scenes: [...], chapter: number }
      // 需要访问 scenes_data.scenes 数组
      const scenesArray = scenesData.scenes;
      if (!scenesArray || !Array.isArray(scenesArray)) {
        console.warn(`章节 ${chapter.chapter} 的scenes_data.scenes字段不是数组或不存在，跳过场景处理`);
        console.warn(`scenesArray值:`, scenesArray);
        continue;
      }

      console.log(`✅ 章节 ${chapter.chapter} 找到 ${scenesArray.length} 个场景`);

      // 遍历章节中的所有场景
      for (const sceneData of scenesArray) {
        // 从Supabase读取完整场景内容
        const { data: fullSceneData, error: fullSceneError } = await supabase
          .from('story_chapter_scene_paragraphs')
          .select('*')
          .eq('story_id', outlineData.id)
          .eq('chapter_number', chapter.chapter)
          .eq('scene_number', sceneData.sceneNumber)
          .single();

        if (fullSceneError) {
          console.error(`读取场景 ${sceneData.sceneNumber} 完整内容失败:`, fullSceneError);
          continue;
        }

        if (fullSceneData) {
          chapterScenes.push({
            sceneNumber: fullSceneData.scene_number,
            title: fullSceneData.title,
            fullContent: fullSceneData.full_content,
            continuityNotes: fullSceneData.continuity_notes || []
          });
        }
      }

      // 构建章节内容，使用AI生成的章节标题
      const chapterContent: FullChapterContent = {
        chapterNumber: chapter.chapter,
        title: chapter.title || `第${chapter.chapter}章`,
        scenes: chapterScenes
      };

      chapters.push(chapterContent);
    }

    // 构建完整书籍内容
    const fullBookContent: FullBookContent = {
      title: bookTitle,
      chapters: chapters
    };

    // 只在DEBUG_MODE=true时生成本地文件
    if (process.env.DEBUG_MODE === 'true') {
      // 保存完整书籍到文件，使用动态书籍名称
      const safeBookTitle = (bookTitle || '未命名故事').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const bookFilePath = path.join(fullScenesDirectory, `${safeBookTitle}-full-book.md`);
      await fs.promises.writeFile(bookFilePath, generateBookMarkdown(fullBookContent), 'utf8');
      console.log(`完整书籍已保存到 ${bookFilePath}`);
    } else {
      console.log('DEBUG_MODE=false，不生成本地文件');
    }

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
  generateStoryOutline,
  generateScenes,
  generateParagraphsBounding,
  generateParagraphs,
  checkContinuity,
  assembleFullBook,
  generateBookMarkdown
};