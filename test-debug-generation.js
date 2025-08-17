// 测试脚本：验证生成任务状态问题
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testGenerationStatus() {
  console.log('🧪 开始测试生成状态问题...');
  
  try {
    // 1. 启动一个生成任务
    console.log('\n📝 步骤1: 启动生成任务');
    const generateResponse = await fetch(`${BASE_URL}/api/generate-story?action=generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protagonist: "勇敢的骑士",
        plot: "寻找失落的宝藏",
        conflict: "邪恶巫师的阻挠",
        outcome: "成功找到宝藏",
        length: "short"
      })
    });
    
    const generateResult = await generateResponse.json();
    console.log('生成启动结果:', generateResult);
    
    if (!generateResult.success) {
      console.error('❌ 生成启动失败');
      return;
    }
    
    const generationId = generateResult.data.generationId;
    console.log(`🆔 生成ID: ${generationId}`);
    
    // 2. 等待一段时间让任务完成
    console.log('\n⏳ 步骤2: 等待任务完成');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
    
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
        console.log('获取结果成功 (JSON):', result);
      } else {
        const content = await resultResponse.text();
        console.log('获取结果成功 (文本):', content.substring(0, 200) + '...');
      }
    } else {
      const errorResult = await resultResponse.json();
      console.log('❌ 获取结果失败:', errorResult);
      
      // 5. 检查数据库中的状态
      console.log('\n🗄️ 步骤5: 检查数据库中的状态');
      // 这里需要根据实际的数据库配置来检查
      console.log('数据库状态检查需要手动执行 Supabase 查询');
      console.log(`SELECT id, status, created_at, updated_at FROM stories WHERE id = '${generationId}';`);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testGenerationStatus().catch(console.error);