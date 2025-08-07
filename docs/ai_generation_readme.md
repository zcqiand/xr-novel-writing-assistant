# AI故事生成功能使用说明

## 功能概述

本功能已成功实现AI故事生成，支持根据用户选择的故事主题、情节发展、主要冲突、故事结局四个方面内容，利用AI大模型生成完整的故事。

## 实现的功能

### 1. 核心组件
- **AI故事生成器** (`src/lib/ai-story-generator.ts`): 封装了OpenAI API调用逻辑
- **API路由** (`src/app/api/generate-story/route.ts`): 处理服务器端AI生成请求
- **测试API** (`src/app/api/generate-story/test/route.ts`): 提供无需API密钥的测试功能
- **页面组件** (`src/app/page.tsx`): 集成AI生成功能到用户界面

### 2. 工作流程
1. 用户选择故事元素（主题、情节、冲突、结局）
2. 点击"生成故事"按钮
3. 系统首先尝试使用真实的AI生成API
4. 如果真实API不可用，自动回退到测试模式
5. 生成的故事显示在界面上

### 3. 智能回退机制
- 优先使用OpenRouter API进行真实AI生成
- 当API密钥未配置或API不可用时，自动切换到测试模式
- 测试模式提供模拟的AI生成故事，确保功能始终可用

## 配置说明

### 环境变量配置
在 `.env.local` 文件中配置以下变量：

```env
# OpenRouter API配置
OPENROUTER_API_KEY=your_api_key_here

# 网站配置
SITE_URL=https://novel-writing-assistant.com
SITE_NAME=Novel Writing Assistant
```

### API密钥获取
1. 访问 [OpenRouter.ai](https://openrouter.ai/)
2. 注册并获取API密钥
3. 将密钥配置到 `OPENROUTER_API_KEY` 环境变量

## 使用方法

### 基本使用
1. 在故事元素选择器中选择：
   - 故事主题
   - 前提条件（情节发展）
   - 主要冲突
   - 故事结局
2. 点击"生成故事"按钮
3. 等待AI生成完成
4. 查看生成的故事

### 高级选项
- **写作风格**: 支持叙事、戏剧、浪漫、悬疑、冒险等风格
- **故事长度**: 可选择短篇、中篇、长篇

## 技术特点

### 1. 服务器端AI调用
- 使用Next.js API Routes实现服务器端AI调用
- 避免在前端暴露API密钥
- 提供更好的性能和安全性

### 2. 错误处理
- 完善的错误处理机制
- 优雅的降级策略
- 详细的错误日志记录

### 3. 用户体验
- 生成过程中显示加载状态
- 支持多种故事元素组合
- 提供清晰的操作反馈

## 测试验证

### API端点测试
```bash
# 测试API连接
curl -X GET http://localhost:3000/api/generate-story/test

# 测试故事生成
curl -X POST http://localhost:3000/api/generate-story/test \
  -H "Content-Type: application/json" \
  -d '{"theme":"爱情与成长","plot":"一个年轻人在大城市中寻找自我价值","冲突":"事业与爱情的冲突","结局":"最终找到平衡，实现个人成长"}'
```

### 功能测试
1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:3000
3. 选择故事元素
4. 点击生成故事按钮
5. 验证故事生成结果

## 文件结构

```
src/
├── lib/
│   └── ai-story-generator.ts          # AI故事生成器核心逻辑
├── app/
│   ├── api/generate-story/
│   │   └── route.ts                   # AI生成API路由
│   └── api/generate-story/
│       └── test/
│           └── route.ts               # 测试API路由
└── app/
    └── page.tsx                       # 主页面组件
```

## 依赖项

- `openai`: OpenAI API客户端
- `next`: React框架
- `react`: 用户界面库

## 注意事项

1. **API密钥安全**: 请勿在前端代码中硬编码API密钥
2. **使用限制**: OpenRouter API可能有使用限制和费用
3. **网络连接**: AI生成需要稳定的网络连接
4. **内容审核**: 生成的内容可能需要审核以确保符合要求

## 扩展功能

未来可以考虑添加：
- 支持更多AI模型
- 故事风格自定义
- 多语言支持
- 故事编辑和导出功能
- 用户账户和积分系统