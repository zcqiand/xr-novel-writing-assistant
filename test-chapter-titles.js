const { AIStoryGenerator } = require('./src/lib/ai-story-generator.ts');

async function testChapterTitles() {
  try {
    console.log('=== 测试章节标题生成 ===');

    const generator = new AIStoryGenerator({
      apiKey: process.env.OPENAI_API_KEY || "test-key"
    });

    // 测试大纲生成
    const outline = await generator.generateStoryOutline(
      "科幻冒险",
      "时间旅行者改变历史",
      "paradox效应",
      "修复时间线",
      "adventure",
      "medium"
    );

    console.log('生成的书籍标题:', outline.title);
    console.log('\n章节信息:');

    outline.chapters.forEach((chapter, index) => {
      console.log(`第${chapter.chapter}章: "${chapter.title}" - ${chapter.summary.substring(0, 50)}...`);
    });

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testChapterTitles();