// 测试合并段落生成API
const testMergedParagraphsAPI = async () => {
  console.log('=== 测试合并段落生成API ===');

  try {
    // 测试POST请求
    console.log('\n1. 测试POST请求...');
    const postResponse = await fetch('http://localhost:3000/api/generate-merged-paragraphs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneTitle: '解剖室的发现',
        sceneSummary: '法医在解剖室发现第四具尸体与前三位受害者有相同的生物特征'
      })
    });

    if (!postResponse.ok) {
      throw new Error(`POST请求失败: ${postResponse.status} ${postResponse.statusText}`);
    }

    const postData = await postResponse.json();
    console.log('POST请求成功，返回数据:');
    console.log(JSON.stringify(postData, null, 2));

    // 测试GET请求
    console.log('\n2. 测试GET请求...');
    const getResponse = await fetch('http://localhost:3000/api/generate-merged-paragraphs?title=解剖室的发现&summary=法医在解剖室发现第四具尸体与前三位受害者有相同的生物特征');

    if (!getResponse.ok) {
      throw new Error(`GET请求失败: ${getResponse.status} ${getResponse.statusText}`);
    }

    const getData = await getResponse.json();
    console.log('GET请求成功，返回数据:');
    console.log(JSON.stringify(getData, null, 2));

    // 验证返回数据格式
    console.log('\n3. 验证返回数据格式...');
    const expectedFields = ['sceneNumber', 'title', 'openingParagraph', 'closingParagraph'];
    const hasAllFields = expectedFields.every(field => field in postData);

    if (hasAllFields) {
      console.log('✅ 所有必需字段都存在');
    } else {
      console.log('❌ 缺少必需字段');
      console.log('缺失的字段:', expectedFields.filter(field => !(field in postData)));
    }

    // 验证字段类型
    console.log('\n4. 验证字段类型...');
    const typeChecks = {
      sceneNumber: typeof postData.sceneNumber === 'number',
      title: typeof postData.title === 'string',
      openingParagraph: typeof postData.openingParagraph === 'string',
      closingParagraph: typeof postData.closingParagraph === 'string'
    };

    console.log('字段类型检查:', typeChecks);
    const allTypesCorrect = Object.values(typeChecks).every(check => check);

    if (allTypesCorrect) {
      console.log('✅ 所有字段类型正确');
    } else {
      console.log('❌ 字段类型不正确');
    }

    // 验证段落内容
    console.log('\n5. 验证段落内容...');
    const hasContent = postData.openingParagraph.length > 0 && postData.closingParagraph.length > 0;

    if (hasContent) {
      console.log('✅ 段落内容不为空');
      console.log('开头段落长度:', postData.openingParagraph.length);
      console.log('结尾段落长度:', postData.closingParagraph.length);
    } else {
      console.log('❌ 段落内容为空');
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('测试失败:', error);
  }
};

// 运行测试
testMergedParagraphsAPI();