#!/usr/bin/env node

/**
 * 测试章节场景生成功能
 */

const fs = require('fs');
const path = require('path');

// 导入generateChapterScenes函数
const { generateChapterScenes } = require('./src/lib/ai-story-generator.ts');

async function testChapterScenesGeneration() {
  try {
    console.log('=== 开始测试章节场景生成功能 ===');

    // 测试参数
    const outlineFilePath = 'data/创业故事-story-outline.json';
    const startChapter = 1;
    const chapterCount = 1;

    console.log('测试参数:');
    console.log(`- 大纲文件路径: ${outlineFilePath}`);
    console.log(`- 起始章节号: ${startChapter}`);
    console.log(`- 生成章节数: ${chapterCount}`);
    console.log('');

    // 检查大纲文件是否存在
    if (!fs.existsSync(outlineFilePath)) {
      throw new Error(`大纲文件不存在: ${outlineFilePath}`);
    }

    // 读取并显示大纲文件内容
    const outlineData = JSON.parse(fs.readFileSync(outlineFilePath, 'utf8'));
    console.log('大纲文件内容:');
    console.log(JSON.stringify(outlineData, null, 2));
    console.log('');

    // 检查目标章节是否存在
    const targetChapter = outlineData.chapters.find((ch) => ch.chapter === startChapter);
    if (!targetChapter) {
      throw new Error(`章节 ${startChapter} 在大纲中未找到`);
    }

    console.log(`目标章节 ${startChapter} 摘要: ${targetChapter.summary}`);
    console.log('');

    // 调用generateChapterScenes方法
    console.log('调用generateChapterScenes方法...');
    const results = await generateChapterScenes(outlineFilePath, startChapter, chapterCount);

    console.log('');
    console.log('=== 测试结果 ===');
    console.log(`成功生成 ${results.length} 个章节的场景`);

    // 显示生成的场景数据
    results.forEach((chapterScenes, index) => {
      console.log(`\n章节 ${chapterScenes.chapter} 场景:`);
      chapterScenes.scenes.forEach((scene, sceneIndex) => {
        console.log(`  场景 ${scene.sceneNumber}: ${scene.title}`);
        console.log(`  摘要: ${scene.summary}`);
      });
    });

    // 检查生成的文件
    console.log('\n=== 检查生成的文件 ===');
    const expectedFileName = `data/chapter-${startChapter}-scenes.json`;
    if (fs.existsSync(expectedFileName)) {
      console.log(`✅ 文件已生成: ${expectedFileName}`);

      // 读取并显示文件内容
      const fileContent = JSON.parse(fs.readFileSync(expectedFileName, 'utf8'));
      console.log('文件内容:');
      console.log(JSON.stringify(fileContent, null, 2));
    } else {
      console.log(`❌ 文件未生成: ${expectedFileName}`);
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testChapterScenesGeneration()
    .then(() => {
      console.log('✅ 测试成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    });
}

module.exports = { testChapterScenesGeneration };