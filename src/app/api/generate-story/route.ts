import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, generateScenes, generateParagraphsBounding, generateParagraphs, assembleFullBook, generateBookMarkdown } from '@/lib/ai-story-generator';

// 环境变量配置
const config = {
  apiKey: process.env.OPENAI_API_KEY || '', // 默认使用测试密钥
  baseUrl: process.env.OPENAI_BASE_URL || '',
  model: process.env.OPENAI_MODEL || '', // 默认使用模型
  siteUrl: process.env.SITE_URL || '',
  siteName: process.env.SITE_NAME || '',
};

// 检查是否为测试模式
const isTestMode = config.apiKey === 'test-api-key-for-debugging';

/**
 * POST /api/generate-story
 * 统一的故事生成API端点
 * 通过action参数控制不同的生成阶段
 */
export async function POST(request: NextRequest) {
  const { action } = Object.fromEntries(request.nextUrl.searchParams);

  // 添加请求开始时间记录
  const requestStartTime = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] API请求开始 - action: ${action}`);

  try {
    switch (action) {
      case 'generate-outline':
        // 生成故事大纲
        const outlineBody = await request.json();

        // 构建故事元素参数，优先使用前端传递的值，否则使用默认值
        const protagonist = outlineBody.protagonist || "未指定主角类型";
        const plot = outlineBody.plot || "未指定情节发展";
        const conflict = outlineBody.conflict || "未指定冲突";
        const outcome = outlineBody.outcome || "未指定故事结局";
        const length = outlineBody.length || 'short';

        console.log('=== 大纲生成参数 ===');
        console.log('主角类型:', protagonist);
        console.log('情节发展:', plot);
        console.log('主要冲突:', conflict);
        console.log('故事结局:', outcome);
        console.log('故事篇幅:', length);
        console.log('==================');

        console.log(`⏰ [${new Date().toISOString()}] 开始调用generateStoryOutline`);
        const { outline: outlineData, story_id } = await generateStoryOutline(protagonist, plot, conflict, outcome, length);
        const outlineDuration = Date.now() - requestStartTime;
        console.log(`✅ [${new Date().toISOString()}] generateStoryOutline完成，耗时: ${outlineDuration}ms`);

        // 返回大纲数据和ID
        return NextResponse.json({
          success: true,
          data: {
            outline: outlineData,
            story_id: story_id // 使用从数据库返回的真实ID
          },
          message: '故事大纲生成成功'
        });

      case 'generate-scenes':
        // 生成场景
        const scenesBody = await request.json();

        // 验证必要参数
        if (!scenesBody.outline) {
          console.error('❌ scenes 验证失败: outline 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: outline", details: "outline 参数是必需的" },
            { status: 400 }
          );
        }

        if (!scenesBody.story_id) {
          console.error('❌ scenes 验证失败: story_id 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: story_id", details: "story_id 参数是必需的" },
            { status: 400 }
          );
        }

        const { outline, story_id: scenesStoryId } = scenesBody;
        console.log('开始生成场景，故事ID:', scenesStoryId);
        console.log('大纲标题:', outline?.title || '未指定');
        console.log('大纲章节数:', outline?.chapters?.length || 0);

        console.log(`⏰ [${new Date().toISOString()}] 开始调用generateScenes`);
        const scenes = await generateScenes(outline, scenesStoryId);
        const scenesDuration = Date.now() - requestStartTime;
        console.log(`✅ [${new Date().toISOString()}] generateScenes完成，耗时: ${scenesDuration}ms，生成章节数: ${scenes.length}`);

        return NextResponse.json({
          success: true,
          data: scenes,
          message: '场景生成成功'
        });

      case 'generate-paragraphs-bounding':
        // 生成段落（边界）
        const paragraphsBody = await request.json();

        // 检查必要参数
        if (!paragraphsBody.outline) {
          console.error('❌ paragraphs 验证失败: outline 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: outline", details: "outline 参数是必需的" },
            { status: 400 }
          );
        }
        if (!paragraphsBody.scenes) {
          console.error('❌ paragraphs 验证失败: scenes 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: scenes", details: "scenes 参数是必需的" },
            { status: 400 }
          );
        }
        if (!paragraphsBody.story_id) {
          console.error('❌ paragraphs 验证失败: story_id 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: story_id", details: "story_id 参数是必需的" },
            { status: 400 }
          );
        }

        // 处理scenes数据结构
        let scenesArray: Array<{
          chapter: number;
          scenes: Array<{
            sceneNumber: number;
            title: string;
            summary: string;
          }>;
        }> = [];
        if (Array.isArray(paragraphsBody.scenes)) {
          scenesArray = paragraphsBody.scenes;
        } else if (paragraphsBody.scenes && typeof paragraphsBody.scenes === 'object') {
          if (paragraphsBody.scenes.scenes && Array.isArray(paragraphsBody.scenes.scenes)) {
            scenesArray = [paragraphsBody.scenes];
          } else {
            scenesArray = [paragraphsBody.scenes];
          }
        } else {
          console.error('❌ scenes 数据结构异常:', paragraphsBody.scenes);
          return NextResponse.json(
            { success: false, error: "scenes 数据结构异常", details: `期望数组或对象，实际类型: ${typeof paragraphsBody.scenes}` },
            { status: 400 }
          );
        }

        // 处理所有章节的段落生成
        const allParagraphs: Array<{
          sceneNumber: number;
          title: string;
          openingParagraph: string;
          closingParagraph: string;
        }> = [];

        for (const chapterScenes of scenesArray) {
          if (isTestMode) {
            // 测试模式：生成模拟段落数据
            const testParagraphs = chapterScenes.scenes.map((scene: {
              sceneNumber: number;
              title: string;
              summary: string;
            }) => {
              const title = scene.title || '未知场景';
              const opening = `开头段落示例：${title} 开始的精彩故事。`;
              const closing = `结尾段落示例：${title} 结束的精彩故事。`;
              return {
                sceneNumber: scene.sceneNumber,
                title: scene.title,
                openingParagraph: opening,
                closingParagraph: closing
              };
            });
            allParagraphs.push(...testParagraphs);
          } else {
            // 正常模式：调用AI生成段落
            console.log(`⏰ [${new Date().toISOString()}] 开始调用generateParagraphsBounding - 章节${chapterScenes.chapter}`);
            const chapterParagraphs = await generateParagraphsBounding(paragraphsBody.outline, chapterScenes, paragraphsBody.story_id);
            allParagraphs.push(...chapterParagraphs);
            console.log(`✅ [${new Date().toISOString()}] generateParagraphsBounding完成 - 章节${chapterScenes.chapter}，生成${chapterParagraphs.length}个段落`);
          }
        }

        return NextResponse.json({
          success: true,
          data: allParagraphs,
          message: '段落（边界）生成成功'
        });

      case 'generate-paragraphs':
        // 生成段落（完整场景内容）
        const fullBody = await request.json();

        // 检查必要参数
        if (!fullBody.outline) {
          console.error('❌ full 验证失败: outline 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: outline", details: "outline 参数是必需的" },
            { status: 400 }
          );
        }
        if (!fullBody.scenes) {
          console.error('❌ full 验证失败: scenes 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: scenes", details: "scenes 参数是必需的" },
            { status: 400 }
          );
        }
        if (!fullBody.paragraphs) {
          console.error('❌ full 验证失败: paragraphs 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: paragraphs", details: "paragraphs 参数是必需的" },
            { status: 400 }
          );
        }
        if (!fullBody.story_id) {
          console.error('❌ full 验证失败: story_id 参数缺失');
          return NextResponse.json(
            { success: false, error: "缺少必要参数: story_id", details: "story_id 参数是必需的" },
            { status: 400 }
          );
        }

        // 处理scenes数据结构
        let fullScenesArray: Array<{
          chapter: number;
          scenes: Array<{
            sceneNumber: number;
            title: string;
            summary: string;
          }>;
        }> = [];
        if (Array.isArray(fullBody.scenes)) {
          fullScenesArray = fullBody.scenes;
        } else if (fullBody.scenes && typeof fullBody.scenes === 'object') {
          if (fullBody.scenes.scenes && Array.isArray(fullBody.scenes.scenes)) {
            fullScenesArray = [fullBody.scenes];
          } else {
            fullScenesArray = [fullBody.scenes];
          }
        } else {
          console.error('❌ fullBody.scenes 数据结构异常:', fullBody.scenes);
          return NextResponse.json(
            { success: false, error: "scenes 数据结构异常", details: `期望数组或对象，实际类型: ${typeof fullBody.scenes}` },
            { status: 400 }
          );
        }

        // 处理所有章节的完整场景内容生成
        const allFullContent: Array<{
          sceneNumber: number;
          title: string;
          fullContent: string;
          continuityNotes: string[];
        }> = [];

        for (const chapterScenes of fullScenesArray) {
          console.log(`⏰ [${new Date().toISOString()}] 开始调用generateParagraphs - 章节${chapterScenes.chapter}`);
          const chapterFullContent = await generateParagraphs(
            fullBody.outline,
            chapterScenes,
            fullBody.paragraphs,
            fullBody.story_id
          );
          allFullContent.push(...chapterFullContent);
          console.log(`✅ [${new Date().toISOString()}] generateParagraphs完成 - 章节${chapterScenes.chapter}，生成${chapterFullContent.length}个场景`);
        }

        return NextResponse.json({
          success: true,
          data: allFullContent,
          message: '段落（完整场景内容）生成成功'
        });

      case 'assemble-book':
        // 组装完整书籍
        const assembleBody = await request.json();

        if (!assembleBody.story_id) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数: story_id", details: "story_id 参数是必需的" },
            { status: 400 }
          );
        }

        try {
          console.log(`⏰ [${new Date().toISOString()}] 开始调用assembleFullBook`);
          // 组装完整书籍
          const fullBook = await assembleFullBook(assembleBody.story_id);
          const assembleDuration = Date.now() - requestStartTime;
          console.log(`✅ [${new Date().toISOString()}] assembleFullBook完成，耗时: ${assembleDuration}ms`);

          // 返回完整书籍内容
          return new NextResponse(generateBookMarkdown(fullBook), {
            headers: { 'Content-Type': 'text/markdown' }
          });
        } catch (error) {
          console.error('组装完整书籍失败:', error);
          return NextResponse.json(
            { success: false, error: `组装完整书籍失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: "无效的操作类型" },
          { status: 400 }
        );
    }
  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    console.error(`❌ [${new Date().toISOString()}] API调用失败，总耗时: ${totalDuration}ms -`, error);
    return NextResponse.json(
      {
        success: false,
        error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date().toISOString(),
        duration: totalDuration
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-story
 * 测试API连接
 */
export async function GET() {
  try {
    if (!config.apiKey) {
      return NextResponse.json(
        { success: false, error: '服务器配置错误：缺少API密钥' },
        { status: 500 }
      );
    }

    const { AIStoryGenerator } = await import('@/lib/ai-story-generator');
    const aiGenerator = new AIStoryGenerator(config);
    const isConnected = await aiGenerator.testConnection();

    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'API连接正常' : 'API连接失败',
    });

  } catch (error) {
    console.error('测试API连接时出错:', error);

    return NextResponse.json(
      {
        success: false,
        error: '测试API连接失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
