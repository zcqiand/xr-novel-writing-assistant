# Plotto XML 数据模型分析

## 1. XML 文件的主要组成部分及其关系

Plotto XML 文件包含以下主要元素：

1. **characters（角色）**：定义故事中可能用到的各种角色，每个角色有 designation（标识符）和 sex（性别）属性。
2. **subjects（主题）**：定义故事中人物的类型或状态，如"恋爱中的人"、"已婚人士"等。
3. **predicates（谓词）**：描述情节的基本动作或状态，每个谓词关联多个冲突（conflicts）。
4. **outcomes（结果）**：定义故事可能的结局或结果。
5. **conflicts（冲突）**：这是 Plotto 系统的核心，定义了具体的情节冲突，包含角色、情境和可能的发展方向。

这些元素之间的关系：
- predicates 通过 conflict-link 引用 conflicts
- conflicts 通过 character-link 引用 characters
- conflicts 中的 lead-ups、carry-ons 和 includes 通过 conflict-link 引用其他 conflicts

## 2. JavaScript/TypeScript 数据接口定义

### Character（角色）
```typescript
interface Character {
  designation: string;  // 角色标识符，如 "A", "B", "A-2" 等
  sex: string;          // 性别，如 "男性", "女性", "任何", "无"
  description: string;  // 角色描述
}
```

### Subject（主题）
```typescript
interface Subject {
  number: number;       // 主题编号
  description: string;  // 主题描述
}
```

### Predicate（谓词）
```typescript
interface ConflictLink {
  ref: string;          // 引用的冲突 ID
  category: string;     // 分类
  subcategory: string;  // 子分类
}

interface Predicate {
  number: number;             // 谓词编号
  description: string;        // 谓词描述
  conflictLinks: ConflictLink[]; // 关联的冲突链接
}
```

### Outcome（结果）
```typescript
interface Outcome {
  number: number;       // 结果编号
  description: string;  // 结果描述
}
```

### Conflict（冲突）
```typescript
interface CharacterLink {
  ref: string;  // 引用的角色标识符
}

interface Permutation {
  number: number;         // 排列编号
  description: string;    // 排列描述
  characterLinks: CharacterLink[]; // 引用的角色链接
}

interface Group {
  mode: string;         // 组模式，如 "choose" 或 "include"
  conflictLinks: ConflictLink[]; // 冲突链接
}

interface Transform {
  from: string;  // 转换来源
  to: string;    // 转换目标
}

interface ConflictLink {
  ref: string;          // 引用的冲突 ID
  category: string;     // 分类
  subcategory: string;  // 子分类
  permutations?: number; // 排列数
  transform?: Transform; // 转换规则
}

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

## 3. 处理 conflicts 中的嵌套引用

在 conflicts 中，`lead-ups`、`carry-ons` 和 `includes` 是嵌套引用的处理方式：

1. **Lead-ups（前置冲突）**：表示在当前冲突发生之前可能发生的冲突，为当前冲突提供背景或原因。

2. **Carry-ons（继续冲突）**：表示当前冲突可能导致的下一步冲突，是冲突发展的可能方向。

3. **Includes（包含冲突）**：表示与当前冲突同时发生或紧密相关的其他冲突。

这些嵌套引用通过 `conflict-link` 元素实现，包含以下属性：
- `ref`：引用的冲突 ID
- `category`：引用冲突的分类
- `subcategory`：引用冲突的子分类
- `permutations`（可选）：指定特定的排列
- `transform`（可选）：角色转换规则，包含 `from` 和 `to` 属性

处理这些嵌套引用时，需要：
1. 建立冲突之间的图关系，便于遍历和查询
2. 实现角色转换逻辑，根据 transform 规则替换角色
3. 支持不同的组模式（choose/include）来表示不同的选择关系