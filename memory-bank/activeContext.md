# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-08-13 00:23:24 - Log of updates made.

2025-08-13 00:23:24 - 文件创建

## Current Focus

*   修复生成故事按钮功能
*   实现四阶段故事生成流程

## Recent Changes

*   创建Memory Bank系统
*   初始化productContext.md

## Open Questions/Issues

*   如何处理跨API调用的数据传递？
*   如何优化进度指示器的用户体验？

2025-08-13 00:19:40 - 完成四阶段故事生成流程修复

2025-08-13 00:25:18 - 修复JSON解析错误，API路由现在正确处理不需要请求体的阶段

2025-08-13 01:38:21 - 成功修复POST /api/generate-story?stage=paragraphs和stage=full的400错误问题，所有API端点现在正常返回200状态码

2025-08-13 02:54:40 - 修复书籍名称硬编码问题：AI现在会在生成大纲时动态生成书籍名称，并更新所有相关文件保存路径使用动态名称

2025-08-13 03:01:48 - 修复outline.title为undefined的错误：在所有使用outline.title的地方添加安全检查，使用"未命名故事"作为默认值

2025-08-13 03:06:40 - 修复JSON schema缺少title字段的问题：更新generateStoryOutline方法中的JSON schema定义，添加title字段并设置为必需字段

2025-08-13 03:10:41 - 修复generateChapterScenes函数文件名问题：更新generateChapterScenes函数中的文件保存路径，使用动态书籍名称作为前缀

2025-08-13 03:20:54 - 修复故事大纲文件未保存的问题：更新generateStoryOutline函数，添加保存大纲到data目录的逻辑，使用动态文件名

2025-08-13 04:24:00 - 修复章节标题生成问题：更新AI大纲生成提示词，要求AI为每个章节生成吸引人的标题；更新Chapter接口添加title字段；更新JSON schema包含章节标题字段；修改assembleFullBook和generateBookMarkdown函数使用AI生成的章节标题

2025-08-13 12:31:00 - 修复完整书籍生成问题：成功解决场景标题和连续性注释在完整书籍中显示的问题，同时修复了只生成第一个章节第一个场景的问题

2025-08-13 23:27:30 - 修复场景段落开头和结尾段落为空的问题：成功修复4个段落文件中的openingParagraph和closingParagraph字段，使用测试模式生成有意义的段落内容

2025-08-13 23:45:00 - 实现合并段落生成API：创建新的API端点 /api/generate-merged-paragraphs，支持POST和GET请求，生成开头段落和结尾段落合并的JSON格式返回

2025-08-14 11:31:00 - 修复ESLint未使用变量警告：成功修复ai-story-generator.ts和story-generator.ts中的4个未使用变量警告，通过添加下划线前缀标记未使用的参数和函数

2025-08-14 15:10:53 - 完成冲突处理逻辑修改：成功修改story-generator.ts中的冲突处理逻辑，使其符合"已选择冲突，则不出现冲突类别的冲突，只出现前置冲突，继续冲突，包含冲突"的需求。测试验证通过，功能正常工作。

2025-08-14 15:26:12 - 完成UnifiedSelector组件修改：成功修改src/components/UnifiedSelector.tsx中的冲突显示逻辑，使用三元运算符确保当conflictType为空时不显示冲突项。优化了用户界面，只显示有明确冲突类型的冲突（前置、继续、包含）。

2025-08-14 15:49:00 - 修改UnifiedSelector.tsx中的getRelatedConflicts函数：将函数改为只获取最后一个冲突的前置冲突、后续冲突和包含冲突，而不是处理所有选择的冲突。更新了函数注释和内部逻辑，添加了更详细的日志记录。

2025-08-14 16:04:00 - 实现前置冲突插入功能：成功修改page.tsx中的handleSelectElement函数，当在待选冲突中选择前置冲突时，将其插入到已选冲突中最后冲突的前面。修改包括添加前置冲突检测逻辑和特殊的数组插入处理。

[2025-08-15 15:43:30] - 在 ai-story-generator.ts 的段落生成提示词中增加了连续性注释功能，修改了 USER_PROMPT_PARAGRAPHS 常量添加 {continuityNotes} 占位符，并在 generateSceneContentForOpenAI 函数中集成了连续性注释生成逻辑。

[2025-08-15 21:48:00] - 修改场景生成逻辑：移除场景标题生成功能，修改了SYSTEM_PROMPT_SCENES和USER_PROMPT_SCENES提示词，移除了场景标题字段；修改了USER_PROMPT_PARAGRAPHS提示词，移除了场景标题参数；修改了Scene接口和相关函数，不再生成和使用场景标题。