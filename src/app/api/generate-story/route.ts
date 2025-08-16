import { NextRequest, NextResponse } from 'next/server';
import { AIStoryGenerator } from '@/lib/ai-story-generator';
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
 * 生成故事的API端点
 */
export async function POST(request: NextRequest) {
  const { stage } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    switch (stage) {
      case 'outline':
        // 尝试从请求体中获取前端传递的故事元素
        const outlineBody = await request.json();

        // 构建故事元素参数，优先使用前端传递的值，否则使用默认值
        const protagonist = outlineBody.protagonist || "未指定主角类型";
        const plot = outlineBody.plot || "未指定情节发展";
        const conflict = outlineBody.conflict || "未指定冲突";
        const outcome = outlineBody.outcome || "未指定故事结局";
        const length = outlineBody.length || 'medium';

        console.log('=== 大纲生成参数 ===');
        console.log('主角类型:', protagonist);
        console.log('情节发展:', plot);
        console.log('主要冲突:', conflict);
        console.log('故事结局:', outcome);
        console.log('故事篇幅:', length);
        console.log('==================');

        const outlineData = await generateStoryOutline(protagonist, plot, conflict, outcome, length);

        // 返回大纲数据和ID
        return NextResponse.json({
          outline: outlineData,
          story_id: 'temp-id' // 临时ID，实际应该从数据库返回
        });

      case 'scenes':
        const scenesBody = await request.json();
        const { outline, story_id } = scenesBody;
        const scenes = await generateScenes(outline, story_id);
        return NextResponse.json(scenes);

      case 'paragraphs':
        const paragraphsBody = await request.json();

        // 检查必要参数是否存在
        if (!paragraphsBody.outline) {
          console.error('❌ paragraphs 验证失败: outline 参数缺失');
          return NextResponse.json(
            { error: "缺少必要参数: outline", details: "outline 参数是必需的" },
            { status: 400 }
          );
        }
        if (!paragraphsBody.scenes) {
          console.error('❌ paragraphs 验证失败: scenes 参数缺失');
          return NextResponse.json(
            { error: "缺少必要参数: scenes", details: "scenes 参数是必需的" },
            { status: 400 }
          );
        }

        // 检查 scenes 的结构 - 根据前端传递的数据结构调整
        let scenesArray: Array<{
          chapter: number;
          scenes: Array<{
            sceneNumber: number;
            title: string;
            summary: string;
          }>;
        }> = [];
        if (Array.isArray(paragraphsBody.scenes)) {
          // 如果是数组（前端传递的 scenesData），直接使用
          scenesArray = paragraphsBody.scenes;
        } else if (paragraphsBody.scenes && typeof paragraphsBody.scenes === 'object') {
          // 如果是单个章节对象，检查是否有 scenes 属性
          if (paragraphsBody.scenes.scenes && Array.isArray(paragraphsBody.scenes.scenes)) {
            scenesArray = [paragraphsBody.scenes];
          } else {
            scenesArray = [paragraphsBody.scenes];
          }
        } else {
          console.error('❌ scenes 数据结构异常:', paragraphsBody.scenes);
          return NextResponse.json(
            { error: "scenes 数据结构异常", details: `期望数组或对象，实际类型: ${typeof paragraphsBody.scenes}` },
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

        // scenesArray 已经在上面处理过了，这里直接使用

        for (const chapterScenes of scenesArray) {
          if (isTestMode) {
            // 测试模式：生成模拟段落数据
            const testParagraphs = chapterScenes.scenes.map((scene: {
              sceneNumber: number;
              title: string;
              summary: string;
            }) => {
              const title = scene.title || '未知场景';
              const opening = `开头段落示例：${title} 开始的精彩故事。`; // 模拟开头段落
              const closing = `结尾段落示例：${title} 结束的精彩故事。`; // 模拟结尾段落
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
            const chapterParagraphs = await generateParagraphsBounding(paragraphsBody.outline, chapterScenes, paragraphsBody.story_id);
            allParagraphs.push(...chapterParagraphs);
          }
        }

        return NextResponse.json(allParagraphs);

      case 'full':
        const fullBody = await request.json();

        // 检查必要参数是否存在
        if (!fullBody.outline) {
          console.error('❌ full 验证失败: outline 参数缺失');
          return NextResponse.json(
            { error: "缺少必要参数: outline", details: "outline 参数是必需的" },
            { status: 400 }
          );
        }
        if (!fullBody.scenes) {
          console.error('❌ full 验证失败: scenes 参数缺失');
          return NextResponse.json(
            { error: "缺少必要参数: scenes", details: "scenes 参数是必需的" },
            { status: 400 }
          );
        }
        if (!fullBody.paragraphs) {
          console.error('❌ full 验证失败: paragraphs 参数缺失');
          return NextResponse.json(
            { error: "缺少必要参数: paragraphs", details: "paragraphs 参数是必需的" },
            { status: 400 }
          );
        }

        // 检查 scenes 的结构 - 根据前端传递的数据结构调整
        let fullScenesArray: Array<{
          chapter: number;
          scenes: Array<{
            sceneNumber: number;
            title: string;
            summary: string;
          }>;
        }> = [];
        if (Array.isArray(fullBody.scenes)) {
          // 如果是数组（前端传递的 scenesData），直接使用
          fullScenesArray = fullBody.scenes;
        } else if (fullBody.scenes && typeof fullBody.scenes === 'object') {
          // 如果是单个章节对象，检查是否有 scenes 属性
          if (fullBody.scenes.scenes && Array.isArray(fullBody.scenes.scenes)) {
            fullScenesArray = [fullBody.scenes];
          } else {
            fullScenesArray = [fullBody.scenes];
          }
        } else {
          console.error('❌ fullBody.scenes 数据结构异常:', fullBody.scenes);
          return NextResponse.json(
            { error: "scenes 数据结构异常", details: `期望数组或对象，实际类型: ${typeof fullBody.scenes}` },
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

        // fullScenesArray 已经在上面处理过了，这里直接使用

        for (const chapterScenes of fullScenesArray) {
          const chapterFullContent = await generateParagraphs(
            fullBody.outline,
            chapterScenes,
            fullBody.paragraphs,
            fullBody.story_id
          );
          allFullContent.push(...chapterFullContent);
        }

        // 将数组转换为字符串
        const fullContent = JSON.stringify(allFullContent, null, 2);
        return new NextResponse(fullContent, {
          headers: { 'Content-Type': 'text/markdown' }
        });

      case 'assemble':
        // 获取大纲文件路径
        const { outlineFilePath } = await request.json();

        if (!outlineFilePath) {
          return NextResponse.json(
            { error: "缺少必要参数: outlineFilePath", details: "outlineFilePath 参数是必需的" },
            { status: 400 }
          );
        }

        try {
          // 组装完整书籍
          const fullBook = await assembleFullBook(outlineFilePath);

          // 返回完整书籍内容
          return new NextResponse(generateBookMarkdown(fullBook), {
            headers: { 'Content-Type': 'text/markdown' }
          });
        } catch (error) {
          console.error('组装完整书籍失败:', error);
          return NextResponse.json(
            { error: `组装完整书籍失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: "无效的生成阶段" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}` },
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
        { error: '服务器配置错误：缺少API密钥' },
        { status: 500 }
      );
    }

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
