const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 检查环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量缺失:');
  console.error('SUPABASE_URL:', supabaseUrl || '未设置');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '已设置' : '未设置');
  console.log('\n请确保 .env.local 文件中正确配置了 Supabase 凭据');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 测试数据
const testStoryData = {
  title: "测试故事大纲",
  protagonist: "勇敢的骑士",
  plot: "一个骑士踏上拯救王国的旅程",
  conflict: "邪恶法师试图征服王国",
  outcome: "骑士成功击败法师，王国恢复和平",
  length: "medium",
  outline_data: {
    title: "测试故事大纲",
    characters: [
      { name: "勇敢的骑士", description: "主角，正义的守护者" },
      { name: "邪恶法师", description: "反派，企图征服王国" }
    ],
    chapters: [
      { chapter: 1, title: "旅程开始", summary: "骑士接受任务，踏上旅程" },
      { chapter: 2, title: "首次挑战", summary: "骑士遇到第一个考验" },
      { chapter: 3, title: "最终对决", summary: "骑士与法师的决战" }
    ]
  }
};

const testChapterScenesData = {
  story_id: "test-story-id",
  chapter_number: 1,
  scenes_data: [
    { sceneNumber: 1, summary: "骑士离开城堡" },
    { sceneNumber: 2, summary: "遇到第一个村庄" }
  ]
};

const testSceneParagraphsData = {
  story_id: "test-story-id",
  chapter_number: 1,
  scene_number: 1,
  title: "场景1",
  opening_paragraph: "这是一个开头的段落",
  closing_paragraph: "这是一个结尾的段落"
};

const testFullSceneData = {
  story_id: "test-story-id",
  chapter_number: 1,
  scene_number: 1,
  title: "场景1",
  full_content: "这是完整的场景内容",
  continuity_notes: ["连续性注释1", "连续性注释2"]
};

// 测试函数
async function runTests() {
  console.log('🔍 开始 Supabase RLS 诊断测试...\n');

  // 测试1: 基本连接
  console.log('📋 测试1: 基本连接测试');
  try {
    const { data, error } = await supabase.from('stories').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ 连接失败:', error);
    } else {
      console.log('✅ 连接成功，stories表记录数:', data?.count || 0);
    }
  } catch (error) {
    console.error('❌ 连接异常:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试2: 插入故事数据
  console.log('📋 测试2: 插入故事数据');
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert(testStoryData)
      .select()
      .single();

    if (error) {
      console.error('❌ 插入失败:', error);
      console.log('📝 错误详情:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ 插入成功，故事ID:', data.id);
      testStoryData.id = data.id; // 保存ID用于后续测试
    }
  } catch (error) {
    console.error('❌ 插入异常:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试3: 插入章节场景数据
  if (testStoryData.id) {
    console.log('📋 测试3: 插入章节场景数据');
    testChapterScenesData.story_id = testStoryData.id;

    try {
      const { data, error } = await supabase
        .from('story_chapter_scenes')
        .insert(testChapterScenesData)
        .select()
        .single();

      if (error) {
        console.error('❌ 插入失败:', error);
        console.log('📝 错误详情:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ 插入成功，记录ID:', data.id);
      }
    } catch (error) {
      console.error('❌ 插入异常:', error);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试4: 插入场景段落边界数据
  if (testStoryData.id) {
    console.log('📋 测试4: 插入场景段落边界数据');
    testSceneParagraphsData.story_id = testStoryData.id;

    try {
      const { data, error } = await supabase
        .from('story_chapter_scene_paragraphs_bounding')
        .insert(testSceneParagraphsData)
        .select()
        .single();

      if (error) {
        console.error('❌ 插入失败:', error);
        console.log('📝 错误详情:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ 插入成功，记录ID:', data.id);
      }
    } catch (error) {
      console.error('❌ 插入异常:', error);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试5: 插入完整场景数据
  if (testStoryData.id) {
    console.log('📋 测试5: 插入完整场景数据');
    testFullSceneData.story_id = testStoryData.id;

    try {
      const { data, error } = await supabase
        .from('story_chapter_scene_paragraphs')
        .insert(testFullSceneData)
        .select()
        .single();

      if (error) {
        console.error('❌ 插入失败:', error);
        console.log('📝 错误详情:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ 插入成功，记录ID:', data.id);
      }
    } catch (error) {
      console.error('❌ 插入异常:', error);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试6: 查询测试
  if (testStoryData.id) {
    console.log('📋 测试6: 查询测试');
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', testStoryData.id)
        .single();

      if (error) {
        console.error('❌ 查询失败:', error);
      } else {
        console.log('✅ 查询成功，故事标题:', data.title);
        console.log('📝 大纲数据预览:', JSON.stringify(data.outline_data, null, 2));
      }
    } catch (error) {
      console.error('❌ 查询异常:', error);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试7: 数据格式验证
  console.log('📋 测试7: 数据格式验证');
  const formatChecks = [
    { name: 'title', value: testStoryData.title, type: 'string' },
    { name: 'protagonist', value: testStoryData.protagonist, type: 'string' },
    { name: 'plot', value: testStoryData.plot, type: 'string' },
    { name: 'conflict', value: testStoryData.conflict, type: 'string' },
    { name: 'outcome', value: testStoryData.outcome, type: 'string' },
    { name: 'length', value: testStoryData.length, type: 'string' },
    { name: 'outline_data', value: testStoryData.outline_data, type: 'object' }
  ];

  formatChecks.forEach(check => {
    if (check.value === undefined || check.value === null) {
      console.log(`❌ ${check.name}: 缺失`);
    } else if (typeof check.value !== check.type) {
      console.log(`❌ ${check.name}: 类型错误 (期望 ${check.type}, 实际 ${typeof check.value})`);
    } else {
      console.log(`✅ ${check.name}: 正确 (${check.type})`);
    }
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // 清理测试数据
  console.log('📋 清理测试数据');
  if (testStoryData.id) {
    try {
      // 删除相关数据
      await supabase
        .from('story_chapter_scene_paragraphs')
        .delete()
        .eq('story_id', testStoryData.id);

      await supabase
        .from('story_chapter_scene_paragraphs_bounding')
        .delete()
        .eq('story_id', testStoryData.id);

      await supabase
        .from('story_chapter_scenes')
        .delete()
        .eq('story_id', testStoryData.id);

      await supabase
        .from('stories')
        .delete()
        .eq('id', testStoryData.id);

      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.error('❌ 清理失败:', error);
    }
  }

  console.log('\n🎉 诊断测试完成！');
  console.log('\n💡 建议:');
  console.log('1. 如果所有测试都通过，问题可能出在数据格式或RLS策略的具体条件');
  console.log('2. 如果某些测试失败，请检查对应的RLS策略配置');
  console.log('3. 检查 Supabase 控制台中的 RLS 策略是否正确配置');
}

// 运行测试
runTests().catch(console.error);