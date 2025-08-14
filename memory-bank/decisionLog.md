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