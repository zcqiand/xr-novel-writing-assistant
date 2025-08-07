import { NextRequest, NextResponse } from 'next/server';
import { AIStoryGenerator, AIStoryRequest } from '@/lib/ai-story-generator';
// TODO: 验证 Models 导入是否需要使用
// import { Models } from 'openai/resources';

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
  try {
    // 检查API密钥
    if (!config.apiKey) {
      return NextResponse.json(
        { error: '服务器配置错误：缺少API密钥' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { theme, plot, conflict, outcome, style, length } = body;

    // 验证必需字段
    if (!theme || !plot || !conflict || !outcome) {
      return NextResponse.json(
        { error: '缺少必需的故事元素：主角类型、情节、冲突、结局' },
        { status: 400 }
      );
    }

    // 创建AI故事生成器
    const aiGenerator = new AIStoryGenerator(config);

    // 构建生成请求
    const storyRequest: AIStoryRequest = {
      theme,
      plot,
      conflict,
      outcome,
      style: style || 'narrative',
      length: length || 'medium',
    };

    // 生成故事
    const result = await aiGenerator.generateStory(storyRequest);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('生成故事时出错:', error);

    // 返回错误响应
    return NextResponse.json(
      {
        error: '生成故事失败',
        message: error instanceof Error ? error.message : '未知错误'
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