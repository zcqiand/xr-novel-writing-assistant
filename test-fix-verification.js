// 验证脚本：测试数据库约束修复效果
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testStatusConstraintFix() {
  console.log('🧪 开始验证数据库约束修复效果...');
  
  try {
    // 1. 测试状态更新为 'assemble'
    console.log('\n📝 步骤1: 测试状态更新为 \'assemble\'');
    
    // 创建一个测试故事
    const createResponse = await fetch(`${BASE_URL}/api/generate-story?action=generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protagonist: "测试主角",
        plot: "测试情节",
        conflict: "测试冲突",
        outcome: "测试结局",
        length: "short"
      })
    });
    
    const createResult = await createResponse.json();
    console.log('创建故事结果:', createResult);
    
    if (!createResult.success) {
      console.error('❌ 创建故事失败');
      return;
    }
    
    const generationId = createResult.data.generationId;
    console.log(`🆔 生成ID: ${generationId}`);
    
    // 2. 等待一段时间让任务达到 assemble 状态
    console.log('\n⏳ 步骤2: 等待任务达到 assemble 状态');
    await new Promise(resolve => setTimeout(resolve, 15000)); // 等待15秒
    
    // 3. 检查任务状态
    console.log('\n🔍 步骤3: 检查任务状态');
    const statusResponse = await fetch(`${BASE_URL}/api/generate-story?action=check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId })
    });
    
    const statusResult = await statusResponse.json();
    console.log('状态检查结果:', statusResult);
    
    // 4. 尝试获取生成结果
    console.log('\n🎯 步骤4: 尝试获取生成结果');
    const resultResponse = await fetch(`${BASE_URL}/api/generate-story?action=get-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId })
    });
    
    if (resultResponse.ok) {
      const contentType = resultResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await resultResponse.json();
        console.log('✅ 获取结果成功 (JSON):', result);
      } else {
        const content = await resultResponse.text();
        console.log('✅ 获取结果成功 (文本):', content.substring(0, 200) + '...');
      }
    } else {
      const errorResult = await resultResponse.json();
      console.log('❌ 获取结果失败:', errorResult);
    }
    
    // 5. 测试直接状态更新
    console.log('\n🔄 步骤5: 测试直接状态更新');
    const testStatusResponse = await fetch(`${BASE_URL}/api/generate-story?action=check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId })
    });
    
    const testStatusResult = await testStatusResponse.json();
    
    if (testStatusResult.success && testStatusResult.data.status === 'completed') {
      console.log('✅ 故事生成完成，状态更新正常');
    } else {
      console.log('⚠️ 故事生成可能未完成，状态:', testStatusResult.data.status);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行验证
testStatusConstraintFix().catch(console.error);