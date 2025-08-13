const fs = require('fs');
const path = require('path');

// 模拟AI生成的大纲响应（包含title字段）
const mockOutlineWithTitle = {
  title: "代码追梦人",
  characters: [
    {
      name: "张明",
      description: "主角，28岁程序员，技术能力强但缺乏商业经验，在大城市独自打拼"
    },
    {
      name: "李雪",
      description: "女主角，产品经理，思维敏捷，善于沟通，成为张明的创业伙伴"
    }
  ],
  chapters: [
    {
      chapter: 1,
      summary: "张明在大城市的科技公司工作，虽然技术出色但感到职业发展受限，萌生创业想法"
    },
    {
      chapter: 2,
      summary: "张明在技术交流会上认识了李雪，两人一拍即合，决定共同创业"
    }
  ]
};

// 测试文件名生成
function testFileNameGeneration() {
  console.log('=== 测试文件名生成 ===');

  const title = mockOutlineWithTitle.title;
  const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');

  const testFiles = [
    `${safeTitle}-story-outline.json`,
    `${safeTitle}-chapter-1-scenes.json`,
    `${safeTitle}-chapter-1-scene-1-paragraphs.json`,
    `${safeTitle}-chapter-1-scene-1-full.json`,
    `${safeTitle}-full-book.md`
  ];

  testFiles.forEach(fileName => {
    console.log(`✅ ${fileName}`);
  });

  console.log('\n=== 测试完成 ===');
}

// 测试大纲结构
function testOutlineStructure() {
  console.log('=== 测试大纲结构 ===');

  console.log('标题:', mockOutlineWithTitle.title);
  console.log('角色数量:', mockOutlineWithTitle.characters.length);
  console.log('章节数量:', mockOutlineWithTitle.chapters.length);

  // 验证title字段存在
  if (mockOutlineWithTitle.title) {
    console.log('✅ title字段存在');
  } else {
    console.log('❌ title字段缺失');
  }

  console.log('\n=== 测试完成 ===');
}

// 运行测试
testFileNameGeneration();
testOutlineStructure();