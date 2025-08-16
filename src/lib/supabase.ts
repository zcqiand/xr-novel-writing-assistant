import { createClient } from '@supabase/supabase-js'

// Supabase配置接口
export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

// 创建Supabase客户端
export function createSupabaseClient(config: SupabaseConfig) {
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// 默认Supabase客户端配置
export const supabaseConfig: SupabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || '',
};

// 调试日志：检查环境变量加载状态
console.log('[DEBUG] Supabase 环境变量检查:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置');
console.log('- supabaseUrl 值:', supabaseConfig.supabaseUrl);
console.log('- supabaseKey 值:', supabaseConfig.supabaseKey ? '已设置' : '未设置');

// 创建默认Supabase客户端
export const supabase = createSupabaseClient(supabaseConfig);

// 故事大纲数据库接口
export interface StoryOutlineRecord {
  id: string;
  title: string;
  protagonist: string;
  plot: string;
  conflict: string;
  outcome: string;
  length: 'short' | 'medium' | 'long';
  outline_data: StoryOutline;
  created_at: string;
  updated_at: string;
}

// 角色信息接口
export interface Character {
  name: string;
  description: string;
}

// 章节摘要接口
export interface Chapter {
  chapter: number;
  title: string;
  summary: string;
}

// 高级大纲接口
export interface StoryOutline {
  title: string;
  characters: Character[];
  chapters: Chapter[];
}