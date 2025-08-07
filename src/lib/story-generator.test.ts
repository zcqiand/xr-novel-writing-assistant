import { readFileSync } from 'fs';
import { PlottoParser } from './plotto-parser';
import { StoryGenerator } from './story-generator';

// 读取 XML 文件
const xmlFilePath = './docs/literature/plotto-simple.xml';
const xmlContent = readFileSync(xmlFilePath, 'utf-8');

// 创建解析器实例
const parser = new PlottoParser();

// 解析 XML 内容
parser.parse(xmlContent);

// 获取解析后的数据
const data = parser.getParsedData();

// 创建故事生成器实例
const storyGenerator = new StoryGenerator(data);

// 测试随机生成故事
console.log('=== 随机生成故事 ===');
storyGenerator.generateStory();
console.log(storyGenerator.getGeneratedStory());
console.log('\n');

// 测试指定元素生成故事
console.log('=== 指定元素生成故事 ===');
const selectedElements = {
  characters: ['A', 'B'], // 选择角色 A 和 B
  subjects: ['1'], // 选择主角类型 1 (恋爱中的人)
  predicates: ['1'], // 选择情节 1
  conflicts: ['1a'], // 选择冲突 1a
  outcomes: ['1'] // 选择结局 1
};

storyGenerator.generateStory(selectedElements);
console.log(storyGenerator.getGeneratedStory());