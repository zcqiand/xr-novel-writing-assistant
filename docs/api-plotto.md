# Plotto API 文档

## 概述

Plotto API 提供了通过服务器调用方式获取Plotto数据的接口。该API支持获取角色、主题、谓词、结果和冲突等数据，并提供搜索功能。

## 基础信息

- **基础URL**: `/api/plotto`
- **内容类型**: `application/json`
- **认证**: 无需认证

## API 端点

### 1. 获取数据

#### GET `/api/plotto`

获取所有Plotto数据。

**查询参数:**
- `type` (可选): 数据类型，可选值 `all`, `characters`, `subjects`, `predicates`, `outcomes`, `conflicts`，默认为 `all`
- `id` (可选): 特定元素的ID

**示例请求:**
```bash
# 获取所有数据
GET /api/plotto

# 获取所有角色
GET /api/plotto?type=characters

# 获取特定角色
GET /api/plotto?type=characters&id=A

# 获取所有冲突
GET /api/plotto?type=conflicts

# 获取特定冲突
GET /api/plotto?type=conflicts&id=1a
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "designation": "A",
        "sex": "男性",
        "description": "男性主角"
      }
    ],
    "subjects": [
      {
        "number": 1,
        "description": "恋爱中的人"
      }
    ],
    "predicates": [
      {
        "number": 1,
        "description": "在承诺获得高成就奖励的情况下从事一项困难的事业",
        "conflictLinks": [
          {
            "ref": "110",
            "category": "爱情与求爱",
            "subcategory": "爱情的不幸"
          }
        ]
      }
    ],
    "outcomes": [
      {
        "number": 1,
        "description": "成功获得奖励"
      }
    ],
    "conflicts": [
      {
        "id": "1a",
        "category": "爱情与求爱",
        "subcategory": "爱情的开始",
        "permutations": [
          {
            "number": 1,
            "description": "A，一个骗子、不法之徒、赌徒，为了传播他与B的恋情，他假装自己是一个诚实的人。",
            "characterLinks": [
              {
                "ref": "A"
              },
              {
                "ref": "B"
              }
            ]
          }
        ]
      }
    ]
  },
  "type": "all"
}
```

### 2. 搜索数据

#### POST `/api/plotto/search`

搜索Plotto数据。

**请求体:**
```json
{
  "query": "搜索关键词",
  "type": "all", // 可选: "all", "characters", "subjects", "predicates", "outcomes", "conflicts"
  "category": "分类名称", // 可选
  "subcategory": "子分类名称" // 可选
}
```

**示例请求:**
```bash
POST /api/plotto/search
Content-Type: application/json

{
  "query": "爱情",
  "type": "all"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "type": "character",
      "data": {
        "designation": "A",
        "sex": "男性",
        "description": "男性主角"
      }
    },
    {
      "type": "conflict",
      "data": {
        "id": "1a",
        "category": "爱情与求爱",
        "subcategory": "爱情的开始",
        "permutations": [...]
      }
    }
  ],
  "query": "爱情",
  "total": 15
}
```

## 客户端使用

### JavaScript/TypeScript

使用提供的 `PlottoClient` 类可以方便地调用API。

```typescript
import { plottoClient } from '@/lib/plotto-client';

// 获取所有数据
const data = await plottoClient.getAllData();

// 获取特定类型的数据
const characters = await plottoClient.getCharacters();
const subjects = await plottoClient.getSubjects();
const conflicts = await plottoClient.getConflicts();

// 获取特定元素
const character = await plottoClient.getCharacter('A');
const subject = await plottoClient.getSubject(1);
const conflict = await plottoClient.getConflict('1a');

// 搜索数据
const results = await plottoClient.search('爱情');

// 随机选择
const randomCharacter = await plottoClient.getRandomCharacter();
const storyElements = await plottoClient.getRandomStoryElements();

// 获取分类信息
const categories = await plottoClient.getCategories();
const subcategories = await plottoClient.getSubcategories('爱情与求爱');
```

### 原生Fetch API

```javascript
// 获取所有角色
const response = await fetch('/api/plotto?type=characters');
const result = await response.json();
console.log(result.data);

// 搜索数据
const searchResponse = await fetch('/api/plotto/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: '爱情',
    type: 'all'
  })
});
const searchResult = await searchResponse.json();
console.log(searchResult.data);
```

## 数据结构

### Character
```typescript
interface Character {
  designation: string;  // 角色标识符，如 "A", "B", "A-2" 等
  sex: string;          // 性别，如 "男性", "女性", "任何", "无"
  description: string;  // 角色描述
}
```

### Subject
```typescript
interface Subject {
  number: number;       // 主题编号
  description: string;  // 主题描述
}
```

### Predicate
```typescript
interface Predicate {
  number: number;             // 谓词编号
  description: string;        // 谓词描述
  conflictLinks: ConflictLink[]; // 关联的冲突链接
}
```

### Outcome
```typescript
interface Outcome {
  number: number;       // 结果编号
  description: string;  // 结果描述
}
```

### Conflict
```typescript
interface Conflict {
  id: string;              // 冲突 ID
  category: string;        // 分类
  subcategory: string;     // 子分类
  permutations: Permutation[]; // 排列
  leadUps?: Group[];       // 前置冲突组
  carryOns?: Group[];      // 继续冲突组
  includes?: Group[];      // 包含冲突组
}
```

## 错误处理

API 在发生错误时会返回以下格式的响应：

```json
{
  "success": false,
  "error": "错误描述",
  "message": "详细错误信息"
}
```

常见错误代码：
- `400`: 请求参数错误
- `500`: 服务器内部错误

## 测试页面

项目提供了一个测试页面来验证API功能：

访问 `/api/plotto-test` 可以查看：
- 数据统计
- 随机选择功能
- 搜索功能
- 数据展示

## 使用示例

### 1. 获取随机故事元素

```typescript
const storyElements = await plottoClient.getRandomStoryElements();
console.log('随机故事元素:', storyElements);
```

### 2. 搜索特定类型的数据

```typescript
// 搜索所有与"爱情"相关的冲突
const loveConflicts = await plottoClient.search('爱情', 'conflicts');

// 搜索特定分类的数据
const romanceConflicts = await plottoClient.search('求爱', 'conflicts', '爱情与求爱');
```

### 3. 获取分类信息

```typescript
// 获取所有分类
const categories = await plottoClient.getCategories();
console.log('所有分类:', categories);

// 获取特定分类的子分类
const romanceSubcategories = await plottoClient.getSubcategories('爱情与求爱');
console.log('爱情与求爱的子分类:', romanceSubcategories);
```

## 性能考虑

- 所有API调用都是异步的
- 建议缓存频繁访问的数据
- 对于大量数据，建议使用分页或过滤功能
- 搜索功能支持模糊匹配，但建议使用具体的关键词以获得更好的结果

## 更新日志

### v1.0.0
- 初始版本发布
- 支持获取所有Plotto数据
- 支持搜索功能
- 提供完整的TypeScript类型定义