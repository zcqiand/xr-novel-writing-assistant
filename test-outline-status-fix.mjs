#!/usr/bin/env node

/**
 * 测试outline状态修复效果的脚本
 * 验证状态更新流程是否正确从outline开始
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testOutlineStatusFix() {
  console.log('🧪 开始测试outline状态修复效果...\n');

  try {
    // 1. 测试生成故事API - 应该从outline状态开始
    console.log('📝 测试1: 启动故事生成');
    const generateResponse = await fetch(`${BASE_URL}/api/generate-story?action=generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protagonist: "勇敢的骑士",
        plot: "骑士踏上拯救公主的旅程",
        conflict: "邪恶龙王的阻挠",
        outcome: "成功拯救公主",
        length: "short"
      })
    });

    const generateResult = await generateResponse.json();
    console.log('📊 生成响应:', generateResult);

    if (!generateResult.success) {
      throw new Error(`生成失败: ${generateResult.error}`);
    }

    const generationId = generateResult.data.generationId;
    console.log(`✅ 生成启动成功，ID: ${generationId}\n`);

    // 2. 立即检查状态 - 应该是outline状态
    console.log('📝 测试2: 立即检查状态');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒

    const statusResponse = await fetch(`${BASE_URL}/api/generate-story?action=check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId })
    });

    const statusResult = await statusResponse.json();
    console.log('📊 状态响应:', statusResult);

    if (statusResult.success) {
      const { status, progress } = statusResult.data;
      console.log(`📈 当前状态: ${status}, 进度: ${progress}%`);
      
      if (status === 'outline') {
        console.log('✅ 状态正确: 从outline开始');
      } else {
        console.log(`❌ 状态错误: 期望outline，实际${status}`);
      }
    } else {
      console.log(`❌ 状态检查失败: ${statusResult.error}`);
    }

    console.log('\n📝 测试3: 等待状态变化');
    // 3. 等待一段时间，观察状态变化
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒
      
      const checkResponse = await fetch(`${BASE_URL}/api/generate-story?action=check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId })
      });

      const checkResult = await checkResponse.json();
      
      if (checkResult.success) {
        const { status, progress } = checkResult.data;
        console.log(`📈 第${i + 1}次检查 - 状态: ${status}, 进度: ${progress}%`);
        
        if (status === 'completed') {
          console.log('✅ 生成完成');
          break;
        } else if (status === 'error') {
          console.log(`❌ 生成出错: ${checkResult.data.error}`);
          break;
        }
      } else {
        console.log(`❌ 第${i + 1}次检查失败: ${checkResult.error}`);
        break;
      }
    }

    console.log('\n🎉 outline状态修复测试完成');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testOutlineStatusFix().catch(console.error);