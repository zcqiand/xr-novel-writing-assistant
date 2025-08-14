# 小说写作助手

一个基于Plotto方法论和AI技术的智能小说创作辅助工具，帮助作家系统化地构建引人入胜的原创故事情节。

## 📖 项目简介

《小说写作助手》将威廉·华莱士·库克1928年出版的经典方法论《Plotto》与现代AI技术相结合，为当代小说家提供一个强大的、交互式的情节构思工具。

### 核心理念

- **系统化创作**：基于Plotto的"主题"和"冲突"核心概念，提供机械化的情节结构搭建
- **AI增强**：利用大语言模型增强传统方法论，提供更丰富的情节建议和发展方向
- **交互式体验**：直观的用户界面，支持多阶段故事生成流程

## ✨ 核心功能

### 🎯 四阶段故事生成流程

1. **大纲生成** - 根据选择的故事元素生成完整的故事大纲
2. **场景生成** - 基于大纲生成详细的章节场景
3. **段落生成** - 为每个场景生成具体的段落内容
4. **完整内容** - 组装所有元素生成完整的小说内容

### 📚 Plotto情节数据库

- **角色系统**：丰富的角色定义和描述
- **主题类型**：多样化的主角类型选择
- **情节发展**：系统化的情节结构
- **冲突库**：大量可组合的情节冲突
- **结局选项**：多种可能的故事结局

### 🤖 AI智能生成

- **OpenAI集成**：支持真实的AI故事生成
- **智能回退**：API不可用时自动切换到测试模式
- **风格定制**：支持多种写作风格和故事长度
- **实时反馈**：生成过程中显示进度和状态

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 15.4.5 (React 19.1.0)
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **构建工具**: Turbopack

### 后端技术
- **API路由**: Next.js App Router
- **AI集成**: OpenAI API / OpenRouter
- **HTTP客户端**: node-fetch

### 开发工具
- **代码检查**: ESLint 9
- **类型检查**: TypeScript Compiler
- **包管理**: npm

## 📁 项目结构

```
xr-novel-writing-assistant/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API路由
│   │   │   ├── generate-story/     # 故事生成API
│   │   │   ├── generate-merged-paragraphs/ # 合并段落API
│   │   │   └── plotto/             # Plotto数据API
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 主页面
│   ├── components/            # React组件
│   │   ├── GenerateButton.tsx
│   │   ├── StoryDisplay.tsx
│   │   └── UnifiedSelector.tsx
│   └── lib/                   # 核心库文件
│       ├── ai-story-generator.ts    # AI故事生成器
│       ├── plotto-client.ts         # Plotto客户端
│       ├── plotto-parser.ts         # Plotto解析器
│       └── story-generator.ts       # 故事生成器
├── public/                    # 静态资源
│   └── data/                  # Plotto数据文件
├── docs/                      # 项目文档
├── memory-bank/               # 项目记忆库
├── tasks/                     # 任务管理
└── 配置文件...
```

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd xr-novel-writing-assistant
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
创建 `.env.local` 文件：
```env
# OpenRouter API配置
OPENROUTER_API_KEY=your_api_key_here

# 网站配置
SITE_URL=https://novel-writing-assistant.com
SITE_NAME=Novel Writing Assistant
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 基本使用流程

1. **选择故事元素**
   - 主角类型：选择故事中的人物类型或状态
   - 情节发展：选择故事的基本动作或状态
   - 主要冲突：选择故事的核心冲突
   - 故事结局：选择故事的最终结果

2. **生成故事**
   - 点击"生成故事"按钮
   - 等待AI完成四个阶段的生成
   - 查看生成的完整故事

3. **高级选项**
   - 选择写作风格（叙事、戏剧、浪漫、悬疑、冒险等）
   - 设置故事长度（短篇、中篇、长篇）

### API使用

#### 故事生成API
```bash
# 生成故事大纲
POST /api/generate-story?stage=outline

# 生成场景
POST /api/generate-story?stage=scenes
Content-Type: application/json
{
  "outline": { ... }
}

# 生成段落
POST /api/generate-story?stage=paragraphs
Content-Type: application/json
{
  "outline": { ... },
  "scenes": { ... }
}

# 生成完整内容
POST /api/generate-story?stage=full
Content-Type: application/json
{
  "outline": { ... },
  "scenes": { ... },
  "paragraphs": { ... }
}
```

#### 测试API
```bash
# 测试API连接
GET /api/generate-story/test

# 测试故事生成
POST /api/generate-story/test
Content-Type: application/json
{
  "theme": "爱情与成长",
  "plot": "一个年轻人在大城市中寻找自我价值",
  "conflict": "事业与爱情的冲突",
  "outcome": "最终找到平衡，实现个人成长"
}
```

## 🎨 核心特性

### Plotto系统集成

- **XML数据解析**：完整的Plotto XML数据模型支持
- **角色引用**：智能的角色标识符替换和转换
- **冲突网络**：复杂的冲突关系和嵌套引用处理
- **情节组合**：灵活的情节元素组合机制

### AI生成能力

- **多阶段生成**：从大纲到完整内容的渐进式生成
- **上下文理解**：基于前序阶段的上下文生成后续内容
- **风格控制**：支持多种写作风格和语调
- **质量控制**：生成内容的逻辑性和连贯性保证

### 用户体验

- **实时反馈**：生成过程中显示详细的进度信息
- **错误处理**：完善的错误处理和用户提示
- **响应式设计**：适配各种设备和屏幕尺寸
- **直观界面**：简洁明了的用户界面设计

## 🔧 开发指南

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint配置的代码规范
- 使用Tailwind CSS进行样式开发
- 组件化开发，提高代码复用性

### 调试和测试

```bash
# 运行代码检查
npm run lint

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 扩展开发

#### 添加新的AI模型
1. 在 `src/lib/ai-story-generator.ts` 中添加新的模型支持
2. 更新API路由以支持新模型参数
3. 在用户界面中添加模型选择选项

#### 扩展Plotto数据
1. 更新 `public/data/plotto.xml` 文件
2. 修改 `src/lib/plotto-parser.ts` 以支持新的数据结构
3. 更新相关组件以处理新的数据类型

## 📚 相关文档

- [产品需求文档](docs/product_requirement_docs.md) - 详细的产品需求说明
- [系统架构文档](docs/architecture.md) - 系统架构设计
- [技术文档](docs/technical.md) - Plotto XML数据模型分析
- [AI生成说明](docs/ai_generation_readme.md) - AI功能详细使用说明
- [API文档](docs/api-plotto.md) - API接口文档

## 🤝 贡献指南

我们欢迎各种形式的贡献，包括：

- 🐛 Bug报告和修复
- ✨ 新功能建议和实现
- 📚 文档改进
- 🎨 界面优化
- 🚀 性能优化

### 贡献流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 威廉·华莱士·库克 (William Wallace Cook) - 《Plotto》方法论创始人
- OpenAI - 提供强大的AI生成能力
- Next.js 团队 - 优秀的React框架
- 所有贡献者和测试用户

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 邮箱：1282301776@qq.com
- 主页：https://home.nanrong.store/
- Github: https://github.com/zcqiand

---

**开始您的创作之旅，让小说写作助手成为您的灵感伙伴！** 🚀