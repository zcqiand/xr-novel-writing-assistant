-- 修复stories表的status约束，添加'assemble'状态
-- 在Supabase SQL编辑器中执行此脚本

-- 删除现有的约束
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS stories_status_check;

-- 添加新的约束，包含'assemble'状态
ALTER TABLE public.stories 
ADD CONSTRAINT stories_status_check 
CHECK (status IN ('outline', 'scenes', 'paragraphs_bounding', 'paragraphs', 'assemble', 'completed', 'error'));

-- 更新现有记录的状态（如果需要）
-- 可以将某些状态更新为'assemble'进行测试
-- UPDATE public.stories SET status = 'assemble' WHERE status = 'paragraphs' LIMIT 1;

-- 验证约束是否正确
-- SELECT status, COUNT(*) as count FROM public.stories GROUP BY status;