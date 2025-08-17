-- 为stories表添加error字段
-- 在Supabase SQL编辑器中执行此脚本

-- 添加error字段（允许存储错误信息）
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS error text DEFAULT NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stories_error ON public.stories (error);

-- 更新RLS策略以允许更新error字段
-- 需要更新现有的更新策略以包含error字段
-- 注意：如果RLS策略使用auth.uid() = id，可能需要调整

-- 创建一个允许更新error字段的策略（如果需要）
-- CREATE POLICY "Allow authenticated update error" ON public.stories
--   FOR UPDATE TO authenticated USING (auth.uid() = id)
--   WITH CHECK (true);

-- 插入一条测试数据来验证error字段（可选）
-- INSERT INTO public.stories (
--   title,
--   protagonist,
--   plot,
--   conflict,
--   outcome,
--   length,
--   outline_data,
--   status,
--   error
-- ) VALUES (
--   '测试故事（带错误信息）',
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
--   'error',
--   '这是一个测试错误信息'
-- );

-- 验证字段添加成功
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'stories' 
-- AND column_name IN ('error', 'status', 'total_chapters', 'completed_chapters', 'next_chapter_total_scenes', 'next_chapter_completed_scenes');