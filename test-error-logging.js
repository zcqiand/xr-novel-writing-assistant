// 测试错误日志功能的简单脚本
// 这个脚本模拟API调用以测试错误日志记录

const testScenesEndpoint = async () => {
  console.log('=== 测试场景生成API错误日志 ===');
  console.log('时间:', new Date().toISOString());

  try {
    // 模拟一个有问题的请求体
    const problematicRequest = {
      outline: null, // 故意设置为null来触发错误
      story_id: 'test-story-id-123'
    };

    console.log('发送测试请求:', JSON.stringify(problematicRequest, null, 2));

    // 这里只是模拟，实际API调用需要服务器环境
    console.log('模拟API调用...');
    console.log('预期结果: 应该记录详细的错误日志');

    // 模拟不同的错误场景
    console.log('\n=== 错误场景模拟 ===');

    // 场景1: outline参数缺失
    console.log('场景1: outline参数缺失');
    console.log('预期错误: 缺少必要参数: outline');

    // 场景2: story_id参数缺失
    console.log('场景2: story_id参数缺失');
    console.log('预期错误: 缺少必要参数: story_id');

    // 场景3: 数据库连接失败
    console.log('场景3: 数据库连接失败');
    console.log('预期错误: 保存章节到Supabase失败');

    // 场景4: OpenAI API调用失败
    console.log('场景4: OpenAI API调用失败');
    console.log('预期错误: 生成场景失败');

    console.log('\n=== 测试完成 ===');
    console.log('请检查服务器控制台输出以验证错误日志记录是否正常工作');

  } catch (error) {
    console.error('测试脚本执行失败:', error);
  }
};

// 运行测试
testScenesEndpoint();