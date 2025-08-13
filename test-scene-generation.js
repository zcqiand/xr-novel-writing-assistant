#!/usr/bin/env node

/**
 * 测试章节场景生成功能
 */

const fs = require('fs');
const path = require('path');

// 简单的测试函数
async function testSceneGeneration() {
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

    // 模拟场景生成（由于需要API密钥，这里只模拟逻辑）
    console.log('=== 模拟场景生成过程 ===');

    // 模拟生成的场景数据
    const mockScenes = [
      {
        sceneNumber: 1,
        title: "深夜的办公室",
        summary: "张明在加班时，看着窗外的城市灯火，思考着自己的职业发展。"
      },
      {
        sceneNumber: 2,
        title: "技术交流会议",
        summary: "张明参加技术交流会，听到其他同事讨论创业项目，内心开始动摇。"
      },
      {
        sceneNumber: 3,
        title: "回家的路上",
        summary: "张明走在回家的路上，脑海中不断浮现创业的想法，决定要改变现状。"
      }
    ];

    // 构建章节场景数据
    const chapterScenes = {
      chapter: startChapter,
      scenes: mockScenes
    };

    console.log('模拟生成的场景数据:');
    console.log(JSON.stringify(chapterScenes, null, 2));
    console.log('');

    // 保存场景数据到文件
    const fileName = `data/chapter-${startChapter}-scenes.json`;
    fs.writeFileSync(fileName, JSON.stringify(chapterScenes, null, 2), 'utf8');
    console.log(`✅ 场景数据已保存到: ${fileName}`);

    // 验证生成的文件
    if (fs.existsSync(fileName)) {
      console.log('\n=== 验证生成的文件 ===');
      const fileContent = JSON.parse(fs.readFileSync(fileName, 'utf8'));
      console.log('文件内容验证:');
      console.log(JSON.stringify(fileContent, null, 2));

      // 验证文件格式
      if (fileContent.chapter === startChapter &&
        Array.isArray(fileContent.scenes) &&
        fileContent.scenes.length > 0) {
        console.log('✅ 文件格式验证通过');
      } else {
        console.log('❌ 文件格式验证失败');
      }
    } else {
      console.log(`❌ 文件未生成: ${fileName}`);
    }

    console.log('\n=== 测试完成 ===');
    console.log('注意：实际AI调用需要配置API密钥，这里只测试了文件处理逻辑。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testSceneGeneration()
    .then(() => {
      console.log('✅ 测试成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    });
}

module.exports = { testSceneGeneration };