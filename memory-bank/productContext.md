# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-08-13 00:22:39 - Log of updates made will be appended as footnotes to the end of this file.

2025-08-13 00:22:39 - 文件创建

## Project Goal

*   开发AI小说创作助手，帮助用户生成完整的小说内容

## Key Features

*   四阶段故事生成流程（大纲→场景→段落→完整内容）
*   基于Plotto的情节数据库支持
*   可视化进度指示

## Overall Architecture

*   前端：Next.js + React
*   AI生成：自定义故事生成算法
*   存储：本地JSON文件

[2025-08-15 23:42:00] - 架构变更：将数据存储从本地JSON文件改为Supabase数据库，提高数据持久化和可访问性