import { NextRequest, NextResponse } from 'next/server';

// 环境变量配置
const config = {
  apiKey: process.env.OPENAI_API_KEY, // 默认使用测试密钥
  baseUrl: process.env.OPENAI_BASE_URL,
  model: process.env.OPENAI_MODEL, // 默认使用模型
  siteUrl: process.env.SITE_URL,
  siteName: process.env.SITE_NAME,
};

// 检查是否为测试模式
const isTestMode = config.apiKey === 'test-api-key-for-debugging';

/**
 * 生成测试用的开头段落
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @returns 测试用的开头段落
 */
function generateTestOpeningParagraph(sceneTitle: string): string {
  console.log('🔧 generateTestOpeningParagraph 调试:', { sceneTitle, timestamp: new Date().toISOString() });

  // 根据场景标题生成不同的测试段落
  if (sceneTitle.includes('残卷') || sceneTitle.includes('幻影')) {
    const result = "工作室里，林深小心翼翼地修复着那本民国日记本。破损的内页突然渗出墨渍，在灯光下形成了一个穿月白旗袍的女子剪影。他屏住呼吸，伸手触碰那幻影般的画面...";
    console.log('🔧 匹配残卷/幻影，返回:', result);
    return result;
  } else if (sceneTitle.includes('雨夜') || sceneTitle.includes('废墟')) {
    const result = "暴雨倾盆的深夜，林深抱着修复箱匆匆赶路。途经图书馆废墟时，他看到断墙处有手电筒光束在晃动。一个身影正在瓦砾堆中翻找，沾满泥浆的旗袍下摆在雨中若隐若现...";
    return result;
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    const result = "闪电划破天际的刹那，林深与那个四目相对的身影同时抬头。雨幕中，她耳垂的朱砂痣清晰可见，与日记中的幻影、母亲遗照上的印记完全重叠。废墟间飘起若有若无的茉莉香...";
    return result;
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    const result = "陆知秋慌乱中掉落的鎏金怀表在泥水中闪烁着微光。林深弯腰捡起，发现表盖内侧刻着母亲的名字。表针永远停在1943年立秋，那是一个改变一切的秋天...";
    return result;
  } else {
    const result = `在${sceneTitle}中，林深感受到了前所未有的紧张与期待。空气中弥漫着神秘的味道，仿佛有什么重要的事情即将发生...`;
    return result;
  }
}

/**
 * 生成测试用的结尾段落
 * @param sceneTitle 场景标题
 * @param sceneSummary 场景摘要
 * @returns 测试用的结尾段落
 */
function generateTestClosingParagraph(sceneTitle: string): string {
  console.log('🔧 generateTestClosingParagraph 调试:', { sceneTitle, timestamp: new Date().toISOString() });

  // 根据场景标题生成不同的测试段落
  if (sceneTitle.includes('残卷') || sceneTitle.includes('幻影')) {
    const result = "林深的手指停留在幻影之上，心中涌起莫名的悸动。那女子的身影渐渐淡去，但耳垂的朱砂痣却清晰地烙印在他的记忆里，仿佛在诉说着一个尘封已久的故事...";
    console.log('🔧 匹配残卷/幻影，返回:', result);
    return result;
  } else if (sceneTitle.includes('雨夜') || sceneTitle.includes('废墟')) {
    const result = "雨幕中，陆知秋抬起头，四目相对的瞬间，林深看到了她眼中的惊讶与疑惑。泥泞的废墟上，两个身影在暴雨中相遇，命运的齿轮开始转动...";
    return result;
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    const result = "茉莉的香气在雨中弥漫，林深的心跳加速。那朱砂痣的巧合绝非偶然，母亲的遗照、日记的幻影、眼前的女子，三者之间一定存在着某种神秘的联系...";
    return result;
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    const result = "林深紧紧握住那枚怀表，1943年的立秋永远定格在这一刻。泛黄照片上的少女面容与母亲年轻时的模样惊人相似，时间的迷雾中，真相若隐若现...";
    return result;
  } else {
    const result = `随着${sceneTitle}的结束，林深意识到这只是故事的开始。更多的谜团和挑战在前方等待着他，但他已经准备好面对这一切...`;
    return result;
  }
}

/**
 * POST /api/generate-merged-paragraphs
 * 生成开头段落和结尾段落合并的API端点
 */
export async function POST(request: NextRequest) {
  const { sceneTitle, sceneSummary } = await request.json();

  try {
    // 检查必要参数
    if (!sceneTitle) {
      return NextResponse.json(
        { error: "缺少必要参数: sceneTitle", details: "sceneTitle 参数是必需的" },
        { status: 400 }
      );
    }
    if (!sceneSummary) {
      return NextResponse.json(
        { error: "缺少必要参数: sceneSummary", details: "sceneSummary 参数是必需的" },
        { status: 400 }
      );
    }

    // 检查是否为测试模式
    if (isTestMode) {
      console.log('🔧 使用测试模式生成合并段落');
      const opening = generateTestOpeningParagraph(sceneTitle);
      const closing = generateTestClosingParagraph(sceneTitle);

      const result = {
        sceneNumber: 1,
        title: sceneTitle,
        openingParagraph: opening,
        closingParagraph: closing
      };

      console.log('✅ 测试模式合并段落生成完成');
      return NextResponse.json(result);
    } else {
      console.log('🤖 当前仅支持测试模式，请配置API密钥');
      // 返回测试模式的结果作为占位符
      const opening = generateTestOpeningParagraph(sceneTitle);
      const closing = generateTestClosingParagraph(sceneTitle);

      const result = {
        sceneNumber: 1,
        title: sceneTitle,
        openingParagraph: opening,
        closingParagraph: closing,
        note: "当前使用测试模式，请配置有效的API密钥以启用AI生成"
      };

      console.log('✅ 返回测试模式合并段落生成结果');
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('合并段落生成失败:', error);
    return NextResponse.json(
      { error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-merged-paragraphs
 * 生成开头段落和结尾段落合并的API端点（支持查询参数）
 */
export async function GET(request: NextRequest) {
  console.log('=== 合并段落生成API调用 ===');
  const { searchParams } = new URL(request.url);
  const sceneTitle = searchParams.get('title');
  const sceneSummary = searchParams.get('summary');

  console.log('请求参数:', { sceneTitle, sceneSummary, timestamp: new Date().toISOString() });
  console.log('isTestMode:', isTestMode);
  console.log('===========================');

  try {
    // 检查必要参数
    if (!sceneTitle) {
      return NextResponse.json(
        { error: "缺少必要参数: title", details: "title 参数是必需的" },
        { status: 400 }
      );
    }
    if (!sceneSummary) {
      return NextResponse.json(
        { error: "缺少必要参数: summary", details: "summary 参数是必需的" },
        { status: 400 }
      );
    }

    // 检查是否为测试模式
    if (isTestMode) {
      console.log('🔧 使用测试模式生成合并段落');
      const opening = generateTestOpeningParagraph(sceneTitle);
      const closing = generateTestClosingParagraph(sceneTitle);

      const result = {
        sceneNumber: 1,
        title: sceneTitle,
        openingParagraph: opening,
        closingParagraph: closing
      };

      console.log('✅ 测试模式合并段落生成完成');
      return NextResponse.json(result);
    } else {
      console.log('🤖 当前仅支持测试模式，请配置API密钥');
      // 返回测试模式的结果作为占位符
      const opening = generateTestOpeningParagraph(sceneTitle);
      const closing = generateTestClosingParagraph(sceneTitle);

      const result = {
        sceneNumber: 1,
        title: sceneTitle,
        openingParagraph: opening,
        closingParagraph: closing,
        note: "当前使用测试模式，请配置有效的API密钥以启用AI生成"
      };

      console.log('✅ 返回测试模式合并段落生成结果');
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('合并段落生成失败:', error);
    return NextResponse.json(
      { error: `生成失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}