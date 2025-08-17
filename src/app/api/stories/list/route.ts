import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 书籍列表项接口
 */
export interface StoryListItem {
  id: string;
  title: string;
  type: 'short' | 'medium' | 'long';
  protagonist: string;
  created_at: string;
  updated_at: string;
  status?: 'outline' | 'scenes' | 'paragraphs_bounding' | 'paragraphs' | 'completed' | 'error';
  total_chapters?: number;
  completed_chapters?: number;
  next_chapter_total_scenes?: number;
  next_chapter_completed_scenes?: number;
}

/**
 * API响应接口
 */
export interface ApiResponse<T = StoryListItem[]> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * GET /api/stories/list
 * 获取所有生成的书籍列表
 * 
 * 响应数据格式：
 * - 书籍ID
 * - 书籍标题
 * - 书籍类型（从stories表的length字段获取：short/medium/long）
 * - 主角信息
 * - 创建日期
 * - 更新日期
 * 
 * 按创建日期倒序排序（created_at DESC）
 */
export async function GET() {
  try {
    console.log('=== 开始获取书籍列表 ===');

    // 从数据库中获取所有生成的书籍列表
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, length, protagonist, created_at, updated_at, status, total_chapters, completed_chapters, next_chapter_total_scenes, next_chapter_completed_scenes')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 数据库查询失败:', error);
      return NextResponse.json<ApiResponse<StoryListItem[]>>({
        success: false,
        error: '数据库查询失败',
        message: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // 格式化数据，将length字段映射为type字段
    const formattedData: StoryListItem[] = data.map(story => ({
      id: story.id,
      title: story.title,
      type: story.length as 'short' | 'medium' | 'long',
      protagonist: story.protagonist,
      created_at: story.created_at,
      updated_at: story.updated_at,
      status: story.status,
      total_chapters: story.total_chapters,
      completed_chapters: story.completed_chapters,
      next_chapter_total_scenes: story.next_chapter_total_scenes,
      next_chapter_completed_scenes: story.next_chapter_completed_scenes
    }));

    console.log(`✅ 成功获取 ${formattedData.length} 本书籍`);
    console.log('=== 书籍数据详情 ===');
    formattedData.forEach((story, index) => {
      console.log(`故事 ${index + 1}:`, {
        id: story.id,
        title: story.title,
        status: story.status,
        total_chapters: story.total_chapters,
        completed_chapters: story.completed_chapters,
        shouldShowContinueButton: story.status !== 'completed' && story.status !== 'error'
      });
    });
    console.log('=== 获取书籍列表完成 ===');

    return NextResponse.json<ApiResponse<StoryListItem[]>>({
      success: true,
      data: formattedData,
      message: '书籍列表获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 获取书籍列表时发生未预期错误:', error);

    return NextResponse.json<ApiResponse<StoryListItem[]>>({
      success: false,
      error: '服务器内部错误',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}