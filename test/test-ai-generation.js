// 测试AI生成功能的脚本
// 使用内置的fetch API（Node.js 18+）

async function testAIGeneration() {
  try {
    console.log('🚀 开始测试AI生成功能...');

    // 测试API连接
    console.log('📡 测试API连接...');
    const connectionResponse = await fetch('http://localhost:3000/api/generate-story', {
      method: 'GET'
    });

    const connectionResult = await connectionResponse.json();
    console.log('连接测试结果:', connectionResult);

    if (!connectionResult.success) {
      console.log('❌ API连接失败，请检查API密钥配置');
      return;
    }

    console.log('✅ API连接成功');

    // 测试故事生成
    console.log('📝 测试故事生成...');
    const storyResponse = await fetch('http://localhost:3000/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: '爱情与成长',
        plot: '一个年轻人在大城市中寻找自我价值',
        conflict: '事业与爱情的冲突',
        outcome: '最终找到平衡，实现个人成长',
        style: 'narrative',
        length: 'medium',
      }),
    });

    const storyResult = await storyResponse.json();
    console.log('故事生成结果:', storyResult);

    if (storyResult.success) {
      console.log('✅ 故事生成成功！');
      console.log('📖 生成的故事:');
      console.log('---');
      console.log(storyResult.data.story);
      console.log('---');
      console.log(`📊 字数: ${storyResult.data.wordCount}`);
      console.log(`🏷️  标题: ${storyResult.data.title}`);
      console.log(`🎭 风格: ${storyResult.data.genre}`);
    } else {
      console.log('❌ 故事生成失败:', storyResult.error);
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testAIGeneration();