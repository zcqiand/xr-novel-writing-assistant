-- 创建故事大纲表
-- 在Supabase SQL编辑器中执行此脚本

-- 创建stories表
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  protagonist text NOT NULL,
  plot text NOT NULL,
  conflict text NOT NULL,
  outcome text NOT NULL,
  length text NOT NULL CHECK (length IN ('short', 'medium', 'long')),
  outline_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_title ON public.stories (title);
CREATE INDEX IF NOT EXISTS idx_stories_length ON public.stories (length);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 创建插入策略（允许经过身份验证用户插入）
CREATE POLICY "Allow authenticated insert" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (true);

-- 创建读取策略（允许经过身份验证用户读取）
CREATE POLICY "Allow authenticated read" ON public.stories
  FOR SELECT TO authenticated;

-- 创建更新策略（允许经过身份验证用户更新自己的数据）
CREATE POLICY "Allow authenticated update" ON public.stories
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 创建删除策略（允许经过身份验证用户删除自己的数据）
CREATE POLICY "Allow authenticated delete" ON public.stories
  FOR DELETE  TO authenticated USING (auth.uid() = id);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器来自动更新updated_at字段
CREATE TRIGGER handle_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 插入一条测试数据（可选）
-- INSERT INTO public.stories (
--   title,
--   protagonist,
--   plot,
--   conflict,
--   outcome,
--   length,
--   outline_data
-- ) VALUES (
--   '测试故事',
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
--   }'
-- );