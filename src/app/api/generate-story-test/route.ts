import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/generate-story/test
 * 测试API端点，不需要API密钥
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'API测试端点正常工作',
      timestamp: new Date().toISOString(),
      endpoints: {
        generate: '/api/generate-story (POST)',
        test: '/api/generate-story/test (GET)',
      },
    });
  } catch (error) {
    console.error('测试API端点时出错:', error);

    return NextResponse.json(
      {
        success: false,
        error: '测试API端点失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/generate-story/test
 * 测试故事生成，使用模拟数据
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { theme, plot, conflict, outcome, style, length } = body;

    // 模拟AI生成的故事
    const mockStory = `这是一个基于您提供的故事元素生成的模拟故事：

**主题：** ${theme || '未指定主题'}
**情节：** ${plot || '未指定情节'}
**冲突：** ${conflict || '未指定冲突'}
**结局：** ${outcome || '未指定结局'}

---

在一个繁华的都市里，有一位年轻的追梦者。他怀揣着对未来的憧憬，在大城市中寻找着自己的位置。每一天，他都在努力工作，不断学习新的技能，希望能够在这个竞争激烈的社会中找到一席之地。

然而，生活的道路并不总是平坦的。他面临着事业与爱情的双重挑战。在工作中，他需要面对激烈的竞争和巨大的压力；在感情上，他需要在追求梦想和维护关系之间找到平衡。

经过一番挣扎和思考，他终于明白，真正的成功不仅仅是事业上的成就，更是内心的成长和人际关系的和谐。他学会了在忙碌的生活中抽出时间陪伴家人和朋友，学会了在追求梦想的同时珍惜身边的人。

最终，他不仅在职场上取得了成功，更重要的是，他找到了属于自己的幸福和满足感。这个故事告诉我们，生活中的每一个挑战都是成长的机会，每一次选择都塑造了我们的未来。`;

    return NextResponse.json({
      success: true,
      data: {
        story: mockStory,
        title: 'AI生成的模拟故事',
        genre: style || 'narrative',
        wordCount: mockStory.length,
        isMock: true, // 标记这是模拟数据
      },
    });

  } catch (error) {
    console.error('测试故事生成时出错:', error);

    return NextResponse.json(
      {
        success: false,
        error: '测试故事生成失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}