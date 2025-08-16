# Decision Log

This file records architectural and implementation decisions using a list format.
2025-08-13 00:23:49 - Log of updates made.

2025-08-13 00:23:49 - 文件创建

## 决策：实现四阶段故事生成流程

## 决策依据 

*   用户需求要求完整的小说生成流程
*   分阶段生成可提高系统可靠性和用户体验

## 实现细节

*   使用状态机管理生成阶段
*   每个阶段对应独立的API端点
*   前端通过进度条展示生成进度

2025-08-13 00:19:40 - 完成四阶段故事生成流程实现，包括状态管理、API路由和进度指示器

2025-08-13 00:25:37 - 修复API路由JSON解析错误，实现条件性请求体解析

2025-08-13 01:38:21 - 修复API端点400错误：发现并解决前端后端数据结构不匹配问题，修复paragraphs和full阶段的API调用

2025-08-13 02:54:40 - 决策修复书籍名称硬编码问题：修改AI大纲生成提示词要求AI生成书籍名称，更新StoryOutline接口添加title字段，修改所有文件保存路径使用动态生成的书籍名称

2025-08-13 03:06:40 - 决策修复JSON schema缺少title字段的问题：更新generateStoryOutline方法中的JSON schema定义，添加title字段并设置为必需字段，确保AI能正确返回书籍标题

2025-08-13 03:10:41 - 决策修复generateChapterScenes函数文件名问题：更新generateChapterScenes函数中的文件保存路径，使用动态书籍名称作为前缀，确保所有生成的文件都使用统一的命名规范

2025-08-13 03:20:54 - 决策修复故事大纲文件未保存的问题：更新generateStoryOutline函数，添加保存大纲到data目录的逻辑，使用动态文件名，确保所有生成的文件都保存到data目录

2025-08-13 04:24:00 - 修复章节标题生成问题：决定更新AI大纲生成提示词，要求AI为每个章节生成吸引人的标题，并更新相关数据结构和处理函数以支持章节标题的正确显示和使用

2025-08-13 12:31:00 - 决策修复完整书籍生成问题：识别并解决两个关键问题（1）generateBookMarkdown函数包含不应出现在完整书籍中的场景标题和连续性注释（2）场景生成函数默认参数错误导致只生成第一个章节第一个场景。修复方案包括注释掉场景标题和连续性注释的生成代码，以及修改三个核心函数的默认参数从固定值1改为使用实际数据长度

2025-08-13 23:45:00 - 决策创建合并段落生成API：创建新的API端点 /api/generate-merged-paragraphs，支持POST和GET两种请求方式，返回包含sceneNumber、title、openingParagraph、closingParagraph字段的JSON格式数据，使用现有的测试模式段落生成逻辑

2025-08-14 15:10:30 - 决策修改冲突处理逻辑：根据用户需求"已选择冲突，则不出现冲突类别的冲突，只出现前置冲突，继续冲突，包含冲突"，修改了story-generator.ts中的buildStory方法，移除了主要冲突类别的显示，只显示相关的前置冲突、继续冲突和包含冲突。添加了hasRelatedConflicts标志来跟踪是否有相关冲突，并在没有相关冲突时显示提示信息。

2025-08-14 15:25:41 - 决策修改UnifiedSelector组件：根据用户反馈，修改了src/components/UnifiedSelector.tsx中的冲突显示逻辑，当conflictType为空时使用三元运算符返回null，避免显示没有冲突类型的冲突项。确保只有有明确冲突类型（前置、继续、包含）的冲突才会显示在UI中。

2025-08-14 15:49:00 - 决策修改getRelatedConflicts函数逻辑：根据用户需求，将UnifiedSelector.tsx中的getRelatedConflicts函数修改为只处理最后一个冲突的相关冲突（前置、后续、包含），而不是处理所有选择的冲突。这样可以确保用户界面只显示最新选择冲突的相关冲突，提供更直观的用户体验。

2025-08-14 16:04:15 - 决策实现前置冲突插入功能：根据用户需求"如果在待选冲突中选了前置冲突，则把前置冲突插入到已选冲突中最后冲突的前面"，修改了page.tsx中的handleSelectElement函数。实现方案包括：1) 检测新选择的冲突是否是最后一个已选冲突的前置冲突；2) 如果是前置冲突，则将其插入到最后一个冲突的前面而不是数组末尾；3) 简化了UnifiedSelector组件中的冲突选择逻辑。这个修改确保了用户在选择前置冲突时能够获得更直观的冲突序列体验。

2025-08-15 21:48:00 - 决策移除场景标题生成功能：根据用户需求"不要场景标题"，修改了AI故事生成器的场景生成逻辑。具体修改包括：1) 修改SYSTEM_PROMPT_SCENES和USER_PROMPT_SCENES提示词，移除场景标题字段要求；2) 修改USER_PROMPT_PARAGRAPHS提示词，移除场景标题参数；3) 更新Scene接口定义，移除title字段；4) 修改相关函数调用逻辑，使用场景编号作为标题替代。确保AI生成的场景内容不再包含场景标题。

[2025-08-15 15:19:00] - 决策移除写作风格功能：根据用户需求"不要写作风格"，成功移除了AI故事生成器中的所有写作风格相关功能。具体修改包括：1) 移除AIStoryRequest接口中的style字段；2) 移除generateStoryOutlineForOpenAI和buildOutlinePrompt方法的style参数；3) 更新USER_PROMPT_STORY_OUTLINE常量，移除写作风格相关内容；4) 移除getStyleDescription辅助方法；5) 更新相关调用代码。TypeScript类型检查通过，开发服务器正常运行。

[2025-08-15 15:33:35] - 决策添加故事篇幅选择功能：根据用户需求"前端界面增加故事篇幅的选择"，决定在UnifiedSelector组件中添加故事篇幅选择下拉菜单，支持短篇、中篇、长篇三种选择。实现方案包括：1) 修改UnifiedSelector接口和组件，添加selectedLength和onLengthChange属性；2) 在page.tsx中添加selectedLength状态管理；3) 更新AI故事生成器支持故事篇幅参数；4) 修改API路由正确传递和处理故事篇幅参数。确保用户能够根据需要选择不同篇幅的故事，AI生成时会根据选择的篇幅调整章节数量和内容深度。
[2025-08-15 22:36:00] - 决策将故事大纲保存从本地文件改为Supabase数据库：根据用户需求，决定修改AI故事生成器的数据存储方式，从本地JSON文件保存改为Supabase数据库存储。实现方案包括：1) 安装@supabase/supabase-js依赖；2) 创建supabase.ts配置文件和数据库接口定义；3) 修改generateStoryOutline函数的保存逻辑，使用Supabase客户端插入数据；4) 添加必要的环境变量配置。这样可以提高数据持久化能力，支持多用户访问和数据管理。
[2025-08-15 22:48:47] - 决策修复assembleFullBook函数数据读取逻辑：根据用户反馈"组装完整书籍失败"的错误，决定修改assembleFullBook函数从本地文件读取改为从Supabase数据库读取大纲数据。实现方案包括：1) 将函数参数从outlineFilePath改为outlineId；2) 使用Supabase客户端的select和order方法从数据库读取大纲数据；3) 支持按ID查找或使用最新大纲；4) 修复了TypeScript类型检查和重复变量声明问题。这样可以确保组装完整书籍功能能够正常工作，与新的数据库存储架构保持一致。
[2025-08-15 23:17:19] - 决策创建Supabase数据库表SQL脚本：根据用户需求，决定创建完整的story_outlines表SQL脚本，以便在Supabase数据库中创建必要的表结构。实现方案包括：1) 创建包含所有必要字段的表结构；2) 添加索引以提高查询性能；3) 配置行级安全策略(RLS)支持匿名用户访问；4) 创建触发器自动更新时间戳；5) 提供测试数据示例。脚本文件保存在`supabase/story_outlines_table.sql`中，可以直接在Supabase SQL编辑器中执行。

[2025-08-15 23:41:00] - 决策将故事大纲保存从本地文件改为Supabase数据库：根据用户需求"把生成故事大纲保存到本地的操作改成保存到supabase数据库"，成功修改了AI故事生成器的所有保存逻辑。具体修改包括：1) 创建了story_outlines、chapter_scenes、scene_paragraphs、full_scene_contents四个数据库表的SQL脚本；2) 修改generateStoryOutline函数保存大纲到Supabase；3) 修改generateScenes函数保存场景到Supabase；4) 修改generateParagraphsBounding函数保存段落边界到Supabase；5) 修改generateParagraphs函数保存完整场景内容到Supabase；6) 更新API路由传递story_id参数；7) 修改assembleFullBook函数从Supabase读取数据。确保所有生成的数据都保存到数据库而不是本地文件。

[2025-08-16 00:00:00] - 修复SQL脚本语法错误：修复了所有四个数据库表SQL脚本中的行级安全策略(RLS)语法错误，将"FOR INSERT WITH CHECK TO anon;"改为正确的"FOR INSERT WITH CHECK USING (true);"语法。确保所有SQL脚本可以在Supabase中正确执行。

[2025-08-16 00:09:00] - 修改表名和字段名：根据用户反馈，将表名和字段名统一修改：story_outlines表改为stories，story_id字段改为story_id，chapter_scenes表改为story_chapter_scenes，scene_paragraphs表改为story_chapter_scene_paragraphs_bounding，full_scene_contents表改为story_chapter_scene_paragraphs。同时更新了所有代码中的表名引用。