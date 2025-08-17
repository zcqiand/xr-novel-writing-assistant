import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/stories/[id]
 * 获取单个故事的详细信息
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少故事ID参数" },
        { status: 400 }
      );
    }

    // 从Supabase获取故事详情
    const { data: story, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取故事详情失败:', error);
      return NextResponse.json(
        { success: false, error: "获取故事详情失败" },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        { success: false, error: "未找到指定故事" },
        { status: 404 }
      );
    }

    // 获取章节数量
    const { data: chapters, error: chaptersError } = await supabase
      .from('stories')
      .select('outline_data')
      .eq('id', id)
      .single();

    if (chaptersError) {
      console.error('获取章节数据失败:', chaptersError);
    }

    // 计算完成的章节数量
    let completedChapters = 0;
    let totalChapters = 0;

    if (chapters?.outline_data?.chapters) {
      totalChapters = chapters.outline_data.chapters.length;
      
      // 检查每个章节是否有对应的场景数据
      for (const chapter of chapters.outline_data.chapters) {
        const { data: chapterScenes, error: scenesError } = await supabase
          .from('story_chapter_scenes')
          .select('*')
          .eq('story_id', id)
          .eq('chapter_number', chapter.chapter);

        if (!scenesError && chapterScenes && chapterScenes.length > 0) {
          completedChapters++;
        }
      }
    }

    // 计算完成状态
    const isCompleted = story.status === 'completed';
    const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    
    // 获取下一章节的场景信息
    const nextChapterTotalScenes = story.next_chapter_total_scenes || 0;
    const nextChapterCompletedScenes = story.next_chapter_completed_scenes || 0;
    const nextChapterCompletionPercentage = nextChapterTotalScenes > 0 ?
      Math.round((nextChapterCompletedScenes / nextChapterTotalScenes) * 100) : 0;

    // 构建返回数据
    const storyData = {
      id: story.id,
      title: story.title,
      protagonist: story.protagonist,
      plot: story.plot,
      conflict: story.conflict,
      outcome: story.outcome,
      length: story.length,
      status: story.status || 'outline',
      total_chapters: totalChapters,
      completed_chapters: completedChapters,
      next_chapter_total_scenes: nextChapterTotalScenes,
      next_chapter_completed_scenes: nextChapterCompletedScenes,
      is_completed: isCompleted,
      completion_percentage: completionPercentage,
      next_chapter_completion_percentage: nextChapterCompletionPercentage,
      created_at: story.created_at,
      updated_at: story.updated_at
    };

    return NextResponse.json({
      success: true,
      data: storyData
    });

  } catch (error) {
    console.error('获取故事详情失败:', error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}