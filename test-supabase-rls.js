/**
 * Supabase RLS 测试程序
 * 用于诊断 "new row violates row-level security policy" 错误
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量缺失:');
  console.error('SUPABASE_URL:', supabaseUrl || '未设置');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '已设置' : '未设置');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Supabase RLS 测试程序开始');
console.log('=====================================');

// 测试数据
const testStoryData = {
  title: '测试故事 - RLS诊断',
  protagonist: '勇敢的骑士',
  plot: '骑士踏上拯救公主的旅程',
  conflict: '邪恶龙王的阻挠',
  outcome: '成功拯救公主',
  length: 'short',
  outline_data: {
    title: '测试故事 - RLS诊断',
    characters: [
      { name: '勇敢的骑士', description: '主角，勇敢的骑士' },
      { name: '邪恶龙王', description: '反派，邪恶的龙王' },
      { name: '被困公主', description: '需要拯救的公主' }
    ],
    chapters: [
      { chapter: 1, title: '启程', summary: '骑士决定踏上拯救公主的旅程' },
      { chapter: 2, title: '挑战', summary: '骑士面对邪恶龙王的挑战' },
      { chapter: 3, title: '胜利', summary: '骑士成功拯救公主' }
    ]
  }
};

// 测试1: 基本连接测试
async function testConnection() {
  console.log('\n📡 测试1: 基本连接测试');
  try {
    const { data, error } = await supabase.from('stories').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ 连接失败:', error);
      return false;
    }
    console.log('✅ 连接成功，当前记录数:', data?.count || 0);
    return true;
  } catch (error) {
    console.error('❌ 连接异常:', error);
    return false;
  }
}

// 测试2: 插入权限测试
async function testInsertPermission() {
  console.log('\n📝 测试2: 插入权限测试');
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: testStoryData.title,
        protagonist: testStoryData.protagonist,
        plot: testStoryData.plot,
        conflict: testStoryData.conflict,
        outcome: testStoryData.outcome,
        length: testStoryData.length,
        outline_data: testStoryData.outline_data
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 插入失败:', error);
      console.error('错误代码:', error.code);
      console.error('错误详情:', error.details);
      console.error('错误 hint:', error.hint);
      return false;
    }

    console.log('✅ 插入成功，记录ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ 插入异常:', error);
    return false;
  }
}

// 测试3: 查询权限测试
async function testSelectPermission() {
  console.log('\n🔍 测试3: 查询权限测试');
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ 查询失败:', error);
      return false;
    }

    console.log('✅ 查询成功，找到', data.length, '条记录');
    if (data.length > 0) {
      console.log('最新记录:', {
        id: data[0].id,
        title: data[0].title,
        created_at: data[0].created_at
      });
    }
    return true;
  } catch (error) {
    console.error('❌ 查询异常:', error);
    return false;
  }
}

// 测试4: 更新权限测试
async function testUpdatePermission(storyId) {
  if (!storyId) {
    console.log('\n⏭️  跳过更新测试（没有故事ID）');
    return true;
  }

  console.log('\n🔄 测试4: 更新权限测试');
  try {
    const { data, error } = await supabase
      .from('stories')
      .update({
        title: testStoryData.title + ' (已更新)',
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('❌ 更新失败:', error);
      return false;
    }

    console.log('✅ 更新成功:', data.title);
    return true;
  } catch (error) {
    console.error('❌ 更新异常:', error);
    return false;
  }
}

// 测试5: 删除权限测试
async function testDeletePermission(storyId) {
  if (!storyId) {
    console.log('\n⏭️  跳过删除测试（没有故事ID）');
    return true;
  }

  console.log('\n🗑️  测试5: 删除权限测试');
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      console.error('❌ 删除失败:', error);
      return false;
    }

    console.log('✅ 删除成功');
    return true;
  } catch (error) {
    console.error('❌ 删除异常:', error);
    return false;
  }
}

// 测试6: 字段约束测试
async function testFieldConstraints() {
  console.log('\n🔒 测试6: 字段约束测试');

  // 测试无效的length字段
  console.log('测试无效的length字段...');
  try {
    const { error } = await supabase
      .from('stories')
      .insert({
        title: '无效长度测试',
        protagonist: '测试主角',
        plot: '测试情节',
        conflict: '测试冲突',
        outcome: '测试结局',
        length: 'invalid_length', // 无效值
        outline_data: testStoryData.outline_data
      });

    if (error) {
      console.log('✅ 长度字段约束正常工作:', error.message);
    } else {
      console.log('⚠️  长度字段约束似乎没有生效');
    }
  } catch (error) {
    console.log('✅ 长度字段约束正常工作:', error.message);
  }

  // 测试必填字段
  console.log('测试必填字段...');
  try {
    const { error } = await supabase
      .from('stories')
      .insert({
        title: '', // 空标题
        protagonist: '测试主角',
        plot: '测试情节',
        conflict: '测试冲突',
        outcome: '测试结局',
        length: 'short',
        outline_data: testStoryData.outline_data
      });

    if (error) {
      console.log('✅ 必填字段约束正常工作:', error.message);
    } else {
      console.log('⚠️  必填字段约束似乎没有生效');
    }
  } catch (error) {
    console.log('✅ 必填字段约束正常工作:', error.message);
  }
}

// 测试7: JSONB字段测试
async function testJsonbField() {
  console.log('\n📦 测试7: JSONB字段测试');
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: 'JSONB测试',
        protagonist: '测试主角',
        plot: '测试情节',
        conflict: '测试冲突',
        outcome: '测试结局',
        length: 'short',
        outline_data: {
          title: 'JSONB测试',
          characters: [
            { name: '角色1', description: '描述1' },
            { name: '角色2', description: '描述2' }
          ],
          chapters: [
            { chapter: 1, title: '第一章', summary: '第一章摘要' }
          ]
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ JSONB字段插入失败:', error);
      return false;
    }

    console.log('✅ JSONB字段插入成功');
    console.log('JSONB数据结构:', {
      title: data.outline_data.title,
      characters_count: data.outline_data.characters.length,
      chapters_count: data.outline_data.chapters.length
    });
    return true;
  } catch (error) {
    console.error('❌ JSONB字段测试异常:', error);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始运行所有测试...\n');

  const results = {
    connection: false,
    insert: false,
    select: false,
    update: false,
    delete: false,
    constraints: false,
    jsonb: false
  };

  let storyId = null;

  // 运行测试
  results.connection = await testConnection();
  if (results.connection) {
    storyId = await testInsertPermission();
    results.select = await testSelectPermission();
    if (storyId) {
      results.update = await testUpdatePermission(storyId);
      results.delete = await testDeletePermission(storyId);
    }
  }

  results.constraints = await testFieldConstraints();
  results.jsonb = await testJsonbField();

  // 输出测试结果总结
  console.log('\n📊 测试结果总结');
  console.log('=====================================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${test.padEnd(12)}: ${passed ? '✅ 通过' : '❌ 失败'}`);
  });

  // 诊断建议
  console.log('\n🔍 诊断建议');
  console.log('=====================================');

  if (!results.connection) {
    console.log('❌ 连接失败，请检查:');
    console.log('  1. SUPABASE_URL 是否正确');
    console.log('  2. SUPABASE_ANON_KEY 是否正确');
    console.log('  3. 网络连接是否正常');
  } else if (!results.insert) {
    console.log('❌ 插入失败，可能的原因:');
    console.log('  1. RLS策略配置错误');
    console.log('  2. 字段约束冲突');
    console.log('  3. 数据类型不匹配');
    console.log('  4. JSONB格式错误');
    console.log('\n🔧 建议解决方案:');
    console.log('  1. 检查 Supabase 控制台中的 RLS 策略');
    console.log('  2. 验证表结构和字段约束');
    console.log('  3. 检查数据格式是否符合要求');
  } else {
    console.log('✅ 所有基本功能正常，RLS策略配置正确');
  }

  console.log('\n🎯 下一步行动:');
  console.log('=====================================');
  if (!results.insert) {
    console.log('1. 登录 Supabase 控制台');
    console.log('2. 检查 stories 表的 RLS 策略');
    console.log('3. 验证策略是否允许匿名用户插入');
    console.log('4. 检查字段约束是否过于严格');
  } else {
    console.log('✅ Supabase 配置正常，可以继续使用');
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试程序运行失败:', error);
  process.exit(1);
});