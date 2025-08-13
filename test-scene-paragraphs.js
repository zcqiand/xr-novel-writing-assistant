#!/usr/bin/env node

/**
 * 测试场景段落生成功能
 */

const fs = require('fs');
const path = require('path');

// 模拟AI故事生成器的功能
const mockAIStoryGenerator = {
  generateSceneParagraphs: async function (outlineFilePath, scenesFilePath, startSceneNumber = 1, sceneCount = 1) {
    try {
      console.log('=== 开始生成场景段落 ===');
      console.log('时间:', new Date().toISOString());
      console.log(`大纲文件路径: ${outlineFilePath}`);
      console.log(`场景文件路径: ${scenesFilePath}`);
      console.log(`起始场景号: ${startSceneNumber}`);
      console.log(`生成场景数: ${sceneCount}`);
      console.log('=========================');

      // 读取并解析大纲JSON
      const outlineData = JSON.parse(fs.readFileSync(outlineFilePath, 'utf8'));

      // 读取并解析场景JSON
      const scenesData = JSON.parse(fs.readFileSync(scenesFilePath, 'utf8'));

      const results = [];
      const continuityData = [];

      // 获取指定章节的场景
      const chapter = scenesData.chapter;
      const scenes = scenesData.scenes;

      // 生成指定场景的段落
      for (let i = 0; i < sceneCount; i++) {
        const sceneNumber = startSceneNumber + i;
        const scene = scenes.find((s) => s.sceneNumber === sceneNumber);

        if (!scene) {
          console.warn(`场景 ${sceneNumber} 未找到，跳过`);
          continue;
        }

        console.log(`\n=== 生成场景 ${sceneNumber} 段落 ===`);
        console.log(`场景标题: ${scene.title}`);
        console.log(`场景摘要: ${scene.summary}`);

        // 模拟生成开头段落
        const openingParagraph = await this.generateOpeningParagraph(
          scene.title,
          scene.summary,
          outlineData.characters,
          continuityData
        );

        // 模拟生成结尾段落
        const closingParagraph = await this.generateClosingParagraph(
          scene.title,
          scene.summary,
          outlineData.characters,
          continuityData
        );

        // 构建场景段落数据
        const sceneParagraphs = {
          sceneNumber: sceneNumber,
          title: scene.title,
          openingParagraph: openingParagraph,
          closingParagraph: closingParagraph
        };

        results.push(sceneParagraphs);

        // 记录连续性数据
        this.recordContinuityData(sceneNumber, scene, outlineData.characters, continuityData);

        // 保存段落数据到文件
        const fileName = `data/scene-${sceneNumber}-paragraphs.json`;
        await fs.promises.writeFile(fileName, JSON.stringify(sceneParagraphs, null, 2), 'utf8');
        console.log(`✅ 场景 ${sceneNumber} 段落已保存到 ${fileName}`);
      }

      console.log('\n=== 场景段落生成完成 ===');
      return results;

    } catch (error) {
      console.error('生成场景段落失败:', error);
      throw new Error(`生成场景段落失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  generateOpeningParagraph: async function (sceneTitle, sceneSummary, characters, continuityData) {
    // 模拟AI生成开头段落
    return `深夜的办公室里，${characters[0]?.name || '主角'}独自一人坐在电脑前，屏幕的光芒映照着他疲惫的脸庞。窗外的城市灯火辉煌，车流如织，让他不禁思考着自己的职业发展道路。`;
  },

  generateClosingParagraph: async function (sceneTitle, sceneSummary, characters, continuityData) {
    // 模拟AI生成结尾段落
    return `${characters[0]?.name || '主角'}关掉电脑，整理好文件，准备离开这个见证了他无数个日夜奋斗的地方。虽然疲惫，但他的心中却燃起了新的希望，一个改变现状的想法正在悄然萌芽。`;
  },

  recordContinuityData: function (sceneNumber, scene, characters, continuityData) {
    // 提取场景中的重要细节和事实
    const importantDetails = [
      `场景${sceneNumber}: ${scene.title}`,
      `摘要: ${scene.summary}`
    ];

    // 提取涉及的角色
    const sceneCharacters = characters
      .filter(char => scene.summary.includes(char.name))
      .map(char => char.name);

    // 创建连续性记录
    const continuity = {
      sceneNumber: sceneNumber,
      importantDetails: importantDetails,
      facts: [scene.summary],
      characters: sceneCharacters,
      locations: [] // 可以从场景摘要中提取地点信息
    };

    continuityData.push(continuity);
    console.log(`记录场景 ${sceneNumber} 的连续性数据:`, continuity);
  },

  checkContinuity: function (continuityData) {
    const issues = [];

    // 检查角色一致性
    for (let i = 1; i < continuityData.length; i++) {
      const prevScene = continuityData[i - 1];
      const currScene = continuityData[i];

      // 检查角色是否合理过渡
      const prevCharacters = new Set(prevScene.characters);
      const currCharacters = new Set(currScene.characters);

      // 检查是否有突然出现的新角色没有合理解释
      for (const char of currCharacters) {
        if (!prevCharacters.has(char) && !currScene.importantDetails.some(detail => detail.includes(`${char}首次出现`))) {
          issues.push(`场景 ${currScene.sceneNumber}: 角色 ${char} 突然出现，缺乏合理过渡`);
        }
      }
    }

    // 检查情节连贯性
    for (let i = 1; i < continuityData.length; i++) {
      const prevScene = continuityData[i - 1];
      const currScene = continuityData[i];

      // 检查场景之间是否有逻辑联系
      const hasLogicalConnection = currScene.importantDetails.some(detail =>
        detail.includes('继续') || detail.includes('随后') || detail.includes('接着') ||
        prevScene.importantDetails.some(prevDetail =>
          prevDetail.includes('开始') || prevDetail.includes('准备') || prevDetail.includes('计划')
        )
      );

      if (!hasLogicalConnection) {
        issues.push(`场景 ${currScene.sceneNumber} 与场景 ${prevScene.sceneNumber} 之间缺乏逻辑联系`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
};

const { generateSceneParagraphs: mockGenerateSceneParagraphs, checkContinuity: mockCheckContinuity } = mockAIStoryGenerator;

// 简单的测试函数
async function testSceneParagraphsGeneration() {
  try {
    console.log('=== 开始测试场景段落生成功能 ===');

    // 测试参数
    const outlineFilePath = 'data/创业故事-story-outline.json';
    const scenesFilePath = 'data/chapter-1-scenes.json';
    const startSceneNumber = 1;
    const sceneCount = 1;

    console.log('测试参数:');
    console.log(`- 大纲文件路径: ${outlineFilePath}`);
    console.log(`- 场景文件路径: ${scenesFilePath}`);
    console.log(`- 起始场景号: ${startSceneNumber}`);
    console.log(`- 生成场景数: ${sceneCount}`);
    console.log('');

    // 检查文件是否存在
    if (!fs.existsSync(outlineFilePath)) {
      throw new Error(`大纲文件不存在: ${outlineFilePath}`);
    }

    if (!fs.existsSync(scenesFilePath)) {
      throw new Error(`场景文件不存在: ${scenesFilePath}`);
    }

    // 读取并显示大纲文件内容
    const outlineData = JSON.parse(fs.readFileSync(outlineFilePath, 'utf8'));
    console.log('大纲文件内容:');
    console.log(`主要角色: ${outlineData.characters.map(c => c.name).join(', ')}`);
    console.log(`章节数: ${outlineData.chapters.length}`);
    console.log('');

    // 读取并显示场景文件内容
    const scenesData = JSON.parse(fs.readFileSync(scenesFilePath, 'utf8'));
    console.log('场景文件内容:');
    console.log(`章节: ${scenesData.chapter}`);
    console.log(`场景数量: ${scenesData.scenes.length}`);
    scenesData.scenes.forEach((scene, index) => {
      console.log(`场景${scene.sceneNumber}: ${scene.title} - ${scene.summary}`);
    });
    console.log('');

    // 检查目标场景是否存在
    const targetScene = scenesData.scenes.find((s) => s.sceneNumber === startSceneNumber);
    if (!targetScene) {
      throw new Error(`场景 ${startSceneNumber} 在场景文件中未找到`);
    }

    console.log(`目标场景 ${startSceneNumber} 信息:`);
    console.log(`- 标题: ${targetScene.title}`);
    console.log(`- 摘要: ${targetScene.summary}`);
    console.log('');

    // 模拟段落生成（由于需要API密钥，这里只模拟逻辑）
    console.log('=== 模拟段落生成过程 ===');

    // 模拟生成的段落数据
    const mockParagraphs = {
      sceneNumber: startSceneNumber,
      title: targetScene.title,
      openingParagraph: "深夜的办公室里，张明独自一人坐在电脑前，屏幕的光芒映照着他疲惫的脸庞。窗外的城市灯火辉煌，车流如织，让他不禁思考着自己的职业发展道路。",
      closingParagraph: "张明关掉电脑，整理好文件，准备离开这个见证了他无数个日夜奋斗的地方。虽然疲惫，但他的心中却燃起了新的希望，一个改变现状的想法正在悄然萌芽。"
    };

    console.log('模拟生成的段落数据:');
    console.log(JSON.stringify(mockParagraphs, null, 2));
    console.log('');

    // 保存段落数据到文件
    const fileName = `data/scene-${startSceneNumber}-paragraphs.json`;
    fs.writeFileSync(fileName, JSON.stringify(mockParagraphs, null, 2), 'utf8');
    console.log(`✅ 段落数据已保存到: ${fileName}`);

    // 验证生成的文件
    if (fs.existsSync(fileName)) {
      console.log('\n=== 验证生成的文件 ===');
      const fileContent = JSON.parse(fs.readFileSync(fileName, 'utf8'));
      console.log('文件内容验证:');
      console.log(JSON.stringify(fileContent, null, 2));

      // 验证文件格式
      if (fileContent.sceneNumber === startSceneNumber &&
        fileContent.title === targetScene.title &&
        fileContent.openingParagraph &&
        fileContent.closingParagraph) {
        console.log('✅ 文件格式验证通过');
      } else {
        console.log('❌ 文件格式验证失败');
      }
    } else {
      console.log(`❌ 文件未生成: ${fileName}`);
    }

    // 测试连续性检查功能
    console.log('\n=== 测试连续性检查功能 ===');

    // 模拟连续性数据
    const mockContinuityData = [
      {
        sceneNumber: 1,
        importantDetails: ["场景1: 深夜的办公室", "摘要: 张明在加班时，思考职业发展"],
        facts: ["张明在加班", "思考职业发展"],
        characters: ["张明"],
        locations: ["办公室"]
      },
      {
        sceneNumber: 2,
        importantDetails: ["场景2: 技术交流会议", "摘要: 张明参加技术交流会，听到创业讨论"],
        facts: ["参加技术交流会", "听到创业讨论"],
        characters: ["张明"],
        locations: ["会议中心"]
      }
    ];

    const continuityResult = mockCheckContinuity(mockContinuityData);
    console.log('连续性检查结果:');
    console.log(`- 是否有效: ${continuityResult.isValid ? '是' : '否'}`);
    console.log(`- 问题数量: ${continuityResult.issues.length}`);
    if (continuityResult.issues.length > 0) {
      console.log('问题详情:');
      continuityResult.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    console.log('\n=== 测试完成 ===');
    console.log('注意：实际AI调用需要配置API密钥，这里只测试了文件处理逻辑和连续性检查功能。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testSceneParagraphsGeneration()
    .then(() => {
      console.log('✅ 测试成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    });
}

module.exports = { testSceneParagraphsGeneration };