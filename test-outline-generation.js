const { AIStoryGenerator } = require('./src/lib/ai-story-generator.ts');

// 配置AI故事生成器
const config = {
  apiKey: 'sk-or-xxxxx', // 这里需要替换为实际的API密钥
  siteUrl: 'https://novel-writing-assistant.com',
  siteName: 'Novel Writing Assistant'
};

// 创建AI故事生成器实例
const generator = new AIStoryGenerator(config);

// 生成大纲的参数
const outlineParams = {
  theme: '现代都市，程序员创业',
  plot: '一位年轻的程序员在大城市中奋斗，经历了技术创业的艰辛与成功',
  conflict: '资金短缺、团队矛盾、市场竞争激烈',
  outcome: '最终通过技术创新获得成功，实现了个人价值',
  style: 'narrative',
  length: 'medium'
};

// 生成大纲并保存为JSON文件
async function generateAndSaveOutline() {
  try {
    console.log('开始生成故事大纲...');

    // 生成大纲
    const outline = await generator.generateStoryOutline(
      outlineParams.theme,
      outlineParams.plot,
      outlineParams.conflict,
      outlineParams.outcome,
      outlineParams.style,
      outlineParams.length
    );

    // 格式化输出
    const formattedOutline = {
      characters: outline.characters.map(char => ({
        name: char.name,
        description: char.description
      })),
      chapters: outline.chapters.map(chapter => ({
        chapter: chapter.chapter,
        summary: chapter.summary
      }))
    };

    // 保存为JSON文件
    const fs = require('fs');
    const path = require('path');

    // 确保data目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 写入JSON文件
    const outputPath = path.join(dataDir, '创业故事-story-outline.json');
    fs.writeFileSync(outputPath, JSON.stringify(formattedOutline, null, 2), 'utf8');

    console.log('大纲生成成功！');
    console.log('文件已保存到:', outputPath);
    console.log('大纲内容:', JSON.stringify(formattedOutline, null, 2));

    return outputPath;
  } catch (error) {
    console.error('大纲生成失败:', error);
    throw error;
  }
}

// 运行测试
generateAndSaveOutline()
  .then(outputPath => {
    console.log('任务完成，文件路径:', outputPath);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });