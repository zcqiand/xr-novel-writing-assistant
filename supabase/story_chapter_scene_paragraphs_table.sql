-- 创建完整场景内容表
-- 在Supabase SQL编辑器中执行此脚本

-- 创建story_chapter_scene_paragraphs表
CREATE TABLE IF NOT EXISTS public.story_chapter_scene_paragraphs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  scene_number integer NOT NULL,
  title text NOT NULL,
  full_content text NOT NULL,
  continuity_notes text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_story_chapter_scene_paragraphs_story_id ON public.story_chapter_scene_paragraphs (story_id);
CREATE INDEX IF NOT EXISTS idx_story_chapter_scene_paragraphs_chapter_number ON public.story_chapter_scene_paragraphs (chapter_number);
CREATE INDEX IF NOT EXISTS idx_story_chapter_scene_paragraphs_scene_number ON public.story_chapter_scene_paragraphs (scene_number);
CREATE INDEX IF NOT EXISTS idx_story_chapter_scene_paragraphs_created_at ON public.story_chapter_scene_paragraphs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_chapter_scene_paragraphs_chapter_scene ON public.story_chapter_scene_paragraphs (chapter_number, scene_number);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.story_chapter_scene_paragraphs ENABLE ROW LEVEL SECURITY;

-- 创建插入策略（允许经过身份验证用户插入）
CREATE POLICY "Allow authenticated insert" ON public.story_chapter_scene_paragraphs
  FOR INSERT TO authenticated WITH CHECK (true);

-- 创建读取策略（允许经过身份验证用户读取）
CREATE POLICY "Allow authenticated read" ON public.story_chapter_scene_paragraphs
  FOR SELECT TO authenticated;

-- 创建更新策略（允许经过身份验证用户更新自己的数据）
CREATE POLICY "Allow authenticated update" ON public.story_chapter_scene_paragraphs
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 创建删除策略（允许经过身份验证用户删除自己的数据）
CREATE POLICY "Allow authenticated delete" ON public.story_chapter_scene_paragraphs
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
CREATE TRIGGER handle_story_chapter_scene_paragraphs_updated_at
  BEFORE UPDATE ON public.story_chapter_scene_paragraphs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 插入一条测试数据（可选）
-- INSERT INTO public.story_chapter_scene_paragraphs (
--   story_id,
--   chapter_number,
--   scene_number,
--   title,
--   full_content,
--   continuity_notes
-- ) VALUES (
--   'your-story-outline-id-here',
--   1,
--   1,
--   '场景1',
--   '这是场景1的完整内容，包含详细的场景描述、对话和情节发展...',
--   ARRAY['场景1的连续性注释1', '场景1的连续性注释2']
-- );