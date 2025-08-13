import { NextRequest, NextResponse } from 'next/server';
import { AIStoryGenerator, AIStoryRequest, StoryOutline, ChapterScenes, SceneParagraphs, FullSceneContent } from '@/lib/ai-story-generator';
import { generateStoryOutline, generateChapterScenes, generateSceneParagraphs, generateFullSceneContent, assembleFullBook, generateBookMarkdown } from '@/lib/ai-story-generator';

// 环境变量配置
const config = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
  model: process.env.OPENAI_MODEL || "deepseek/deepseek-r1:free", // 默认使用GPT-4o-mini模型
  siteUrl: process.env.SITE_URL || "https://novel-writing-assistant.com",
  siteName: process.env.SITE_NAME || "Novel Writing Assistant",
};

/**
 * POST /api/generate-story
 * 生成故事的API端点
 */
export async function POST(request: NextRequest) {
  const { stage } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    switch (stage) {
      case 'outline':
        const outline = await generateStoryOutline();
        return NextResponse.json(outline);

      case 'scenes':
        const scenesBody = await request.json();
        const scenes = await generateChapterScenes(scenesBody.outline);
        return NextResponse.json(scenes);

      case 'paragraphs':
        const paragraphsBody = await request.json();
        console.log('=== paragraphs API 调用调试 ===');
        console.log('时间:', new Date().toISOString());
        console.log('请求体完整结构:', JSON.stringify(paragraphsBody, null, 2));
        console.log('outline 存在:', !!paragraphsBody.outline);
        console.log('outline 类型:', typeof paragraphsBody.outline);
        console.log('scenes 存在:', !!paragraphsBody.scenes);
        console.log('scenes 类型:', typeof paragraphsBody.scenes);
        if (paragraphsBody.scenes) {
          console.log('scenes.scenes 存在:', !!paragraphsBody.scenes.scenes);
          console.log('scenes.scenes 类型:', typeof paragraphsBody.scenes.scenes);
          if (paragraphsBody.scenes.scenes) {
            console.log('scenes.scenes 长度:', paragraphsBody.scenes.scenes.length);
            console.log('scenes.scenes[0] 示例:', paragraphsBody.scenes.scenes[0]);
          }
        }
        console.log('================================');

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
        // 检查 scenes 的结构
        if (!paragraphsBody.scenes.scenes) {
          console.error('❌ paragraphs 验证失败: scenes.scenes 结构缺失');
          console.log('scenes 结构:', JSON.stringify(paragraphsBody.scenes, null, 2));
          return NextResponse.json(
            { error: "scenes.scenes 不存在", details: "scenes 必须包含 scenes 数组" },
            { status: 400 }
          );
        }
        if (!Array.isArray(paragraphsBody.scenes.scenes)) {
          console.error('❌ paragraphs 验证失败: scenes.scenes 不是数组');
          return NextResponse.json(
            { error: "scenes.scenes 不是数组", details: `实际类型: ${typeof paragraphsBody.scenes.scenes}` },
            { status: 400 }
          );
        }
        const paragraphs = await generateSceneParagraphs(paragraphsBody.outline, paragraphsBody.scenes);
        return NextResponse.json(paragraphs);

      case 'full':
        const fullBody = await request.json();
        console.log('=== full API 调用调试 ===');
        console.log('时间:', new Date().toISOString());
        console.log('请求体完整结构:', JSON.stringify(fullBody, null, 2));
        console.log('outline 存在:', !!fullBody.outline);
        console.log('outline 类型:', typeof fullBody.outline);
        console.log('scenes 存在:', !!fullBody.scenes);
        console.log('scenes 类型:', typeof fullBody.scenes);
        console.log('paragraphs 存在:', !!fullBody.paragraphs);
        console.log('paragraphs 类型:', typeof fullBody.paragraphs);
        console.log('paragraphs 长度:', Array.isArray(fullBody.paragraphs) ? fullBody.paragraphs.length : 'N/A');

        if (fullBody.scenes) {
          console.log('scenes.scenes 存在:', !!fullBody.scenes.scenes);
          console.log('scenes.scenes 类型:', typeof fullBody.scenes.scenes);
          if (fullBody.scenes.scenes) {
            console.log('scenes.scenes 长度:', fullBody.scenes.scenes.length);
            console.log('scenes.scenes[0] 示例:', fullBody.scenes.scenes[0]);
          }
        }
        if (fullBody.paragraphs && fullBody.paragraphs.length > 0) {
          console.log('paragraphs[0] 示例:', fullBody.paragraphs[0]);
        }
        console.log('========================');

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
        // 检查 scenes 的结构
        if (!fullBody.scenes.scenes) {
          console.error('❌ full 验证失败: scenes.scenes 结构缺失');
          console.log('scenes 结构:', JSON.stringify(fullBody.scenes, null, 2));
          return NextResponse.json(
            { error: "scenes.scenes 不存在", details: "scenes 必须包含 scenes 数组" },
            { status: 400 }
          );
        }
        if (!Array.isArray(fullBody.scenes.scenes)) {
          console.error('❌ full 验证失败: scenes.scenes 不是数组');
          return NextResponse.json(
            { error: "scenes.scenes 不是数组", details: `实际类型: ${typeof fullBody.scenes.scenes}` },
            { status: 400 }
          );
        }
        const fullContentArray = await generateFullSceneContent(
          fullBody.outline,
          fullBody.scenes,
          fullBody.paragraphs
        );
        // 将数组转换为字符串
        const fullContent = JSON.stringify(fullContentArray, null, 2);
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