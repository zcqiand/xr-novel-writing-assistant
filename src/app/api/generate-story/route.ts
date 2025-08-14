import { NextRequest, NextResponse } from 'next/server';
import { AIStoryGenerator } from '@/lib/ai-story-generator';
import { generateStoryOutline, generateChapterScenes, generateSceneParagraphsBatch, generateFullSceneContent, assembleFullBook, generateBookMarkdown } from '@/lib/ai-story-generator';

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
    console.log('🔧 匹配雨夜/废墟，返回:', result);
    return result;
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    const result = "闪电划破天际的刹那，林深与那个四目相对的身影同时抬头。雨幕中，她耳垂的朱砂痣清晰可见，与日记中的幻影、母亲遗照上的印记完全重叠。废墟间飘起若有若无的茉莉香...";
    console.log('🔧 匹配倒影/茉莉，返回:', result);
    return result;
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    const result = "陆知秋慌乱中掉落的鎏金怀表在泥水中闪烁着微光。林深弯腰捡起，发现表盖内侧刻着母亲的名字。表针永远停在1943年立秋，那是一个改变一切的秋天...";
    console.log('🔧 匹配怀表/1943，返回:', result);
    return result;
  } else {
    const result = `在${sceneTitle}中，林深感受到了前所未有的紧张与期待。空气中弥漫着神秘的味道，仿佛有什么重要的事情即将发生...`;
    console.log('🔧 使用默认匹配，返回:', result);
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
    console.log('🔧 匹配雨夜/废墟，返回:', result);
    return result;
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    const result = "茉莉的香气在雨中弥漫，林深的心跳加速。那朱砂痣的巧合绝非偶然，母亲的遗照、日记的幻影、眼前的女子，三者之间一定存在着某种神秘的联系...";
    console.log('🔧 匹配倒影/茉莉，返回:', result);
    return result;
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    const result = "林深紧紧握住那枚怀表，1943年的立秋永远定格在这一刻。泛黄照片上的少女面容与母亲年轻时的模样惊人相似，时间的迷雾中，真相若隐若现...";
    console.log('🔧 匹配怀表/1943，返回:', result);
    return result;
  } else {
    const result = `随着${sceneTitle}的结束，林深意识到这只是故事的开始。更多的谜团和挑战在前方等待着他，但他已经准备好面对这一切...`;
    console.log('🔧 使用默认匹配，返回:', result);
    return result;
  }
}

/**
 * POST /api/generate-story
 * 生成故事的API端点
 */
export async function POST(request: NextRequest) {
  console.log('=== API POST 请求调试 ===');
  const { stage } = Object.fromEntries(request.nextUrl.searchParams);
  console.log('请求阶段 (stage):', stage);
  console.log('isTestMode:', isTestMode);
  console.log('API密钥配置:', config.apiKey);
  console.log('=========================');

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

        // 检查 scenes 的结构 - 根据前端传递的数据结构调整
        let scenesArray: any[] = [];
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

        console.log('scenesArray:', JSON.stringify(scenesArray, null, 2));
        // 处理所有章节的段落生成
        const allParagraphs: Array<{
          sceneNumber: number;
          title: string;
          openingParagraph: string;
          closingParagraph: string;
        }> = [];

        // scenesArray 已经在上面处理过了，这里直接使用

        for (const chapterScenes of scenesArray) {
          console.log(`处理章节 ${chapterScenes.chapter} 的段落生成`);
          console.log('测试模式检测:', isTestMode);
          console.log('当前API密钥:', config.apiKey);
          console.log('环境变量OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

          if (isTestMode) {
            console.log('🔧 使用测试模式生成段落');
            console.log('🔧 场景列表:', chapterScenes.scenes.map((s: { sceneNumber: number; title: string; }) => ({ number: s.sceneNumber, title: s.title })));

            // 测试模式：生成模拟段落数据
            const testParagraphs = chapterScenes.scenes.map((scene: {
              sceneNumber: number;
              title: string;
              summary: string;
            }) => {
              console.log(`🔧 生成场景 ${scene.sceneNumber} 的段落`);
              const title = scene.title || '未知场景';
              const opening = generateTestOpeningParagraph(title);
              const closing = generateTestClosingParagraph(title);
              console.log(`🔧 场景 ${scene.sceneNumber} 段落生成结果:`, {
                sceneNumber: scene.sceneNumber,
                title: scene.title,
                openingLength: opening.length,
                closingLength: closing.length,
                openingPreview: opening.substring(0, 50) + '...',
                closingPreview: closing.substring(0, 50) + '...'
              });
              return {
                sceneNumber: scene.sceneNumber,
                title: scene.title,
                openingParagraph: opening,
                closingParagraph: closing
              };
            });
            allParagraphs.push(...testParagraphs);
            console.log('✅ 测试模式段落生成完成，总共生成:', testParagraphs.length, '个场景的段落');
          } else {
            console.log('🤖 使用AI模式生成段落');
            // 正常模式：调用AI生成段落
            const chapterParagraphs = await generateSceneParagraphsBatch(paragraphsBody.outline, chapterScenes);
            allParagraphs.push(...chapterParagraphs);
            console.log('✅ AI模式段落生成完成');
          }
        }

        return NextResponse.json(allParagraphs);

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

        // 检查 scenes 的结构 - 根据前端传递的数据结构调整
        let fullScenesArray: any[] = [];
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

        console.log('fullScenesArray:', JSON.stringify(fullScenesArray, null, 2));
        // 处理所有章节的完整场景内容生成
        const allFullContent: Array<{
          sceneNumber: number;
          title: string;
          fullContent: string;
          continuityNotes: string[];
        }> = [];

        // fullScenesArray 已经在上面处理过了，这里直接使用

        for (const chapterScenes of fullScenesArray) {
          console.log(`处理章节 ${chapterScenes.chapter} 的完整场景内容生成`);
          const chapterFullContent = await generateFullSceneContent(
            fullBody.outline,
            chapterScenes,
            fullBody.paragraphs
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
