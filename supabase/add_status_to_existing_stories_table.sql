-- 为stories表添加状态和进度字段
-- 在Supabase SQL编辑器中执行此脚本

-- 添加新的字段
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'outline' CHECK (status IN ('outline', 'scenes', 'paragraphs_bounding', 'paragraphs', 'assemble', 'completed', 'error')),
ADD COLUMN IF NOT EXISTS total_chapters integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_chapters integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_chapter_total_scenes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_chapter_completed_scenes integer DEFAULT 0;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories (status);
CREATE INDEX IF NOT EXISTS idx_stories_total_chapters ON public.stories (total_chapters);
CREATE INDEX IF NOT EXISTS idx_stories_completed_chapters ON public.stories (completed_chapters);

-- 更新现有记录的状态和章节数据
-- 遍历所有现有故事，根据outline_data中的章节数量设置total_chapters
DO $$
DECLARE
    story_record RECORD;
    chapter_count integer;
BEGIN
    FOR story_record IN SELECT id, outline_data FROM public.stories
    LOOP
        -- 计算章节数量
        IF story_record.outline_data ? 'chapters' AND story_record.outline_data.chapters IS NOT NULL THEN
            chapter_count := jsonb_array_length(story_record.outline_data->'chapters');
            
            -- 更新章节数和状态
            UPDATE public.stories 
            SET 
                total_chapters = chapter_count,
                completed_chapters = 0,
                status = 'outline',
                next_chapter_total_scenes = 0,
                next_chapter_completed_scenes = 0
            WHERE id = story_record.id;
            
            RAISE NOTICE '更新故事 %: 总章节数 = %', story_record.id, chapter_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '所有现有故事的状态和章节数据更新完成';
END $$;

-- 插入一条测试数据（可选）
-- INSERT INTO public.stories (
--   title,
--   protagonist,
--   plot,
--   conflict,
--   outcome,
--   length,
--   outline_data,
--   status,
--   total_chapters,
--   completed_chapters,
--   next_chapter_total_scenes,
--   next_chapter_completed_scenes
-- ) VALUES (
--   '测试故事（带状态）',
--   '勇敢的骑士',
--   '骑士踏上拯救公主的旅程',
--   '邪恶龙王的阻挠',
--   '成功拯救公主',
--   'short',
--   '{
--     "characters": [
--       {"name": "勇敢的骑士", "description": "主角，勇敢的骑士"},
--       {"name": "邪恶龙王", "description": "反派，邪恶的龙王"},
--       {"name": "被困公主", "description": "需要拯救的公主"}
--     ],
--     "chapters": [
--       {"chapter": 1, "title": "启程", "summary": "骑士决定踏上拯救公主的旅程"},
--       {"chapter": 2, "title": "挑战", "summary": "骑士面对邪恶龙王的挑战"},
--       {"chapter": 3, "title": "胜利", "summary": "骑士成功拯救公主"}
--     ]
--   }',
--   'outline',
--   3,
--   0,
--   0,
--   0
-- );