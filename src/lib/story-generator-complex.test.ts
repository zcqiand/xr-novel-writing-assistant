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
  subjects: ['1'], // 选择主题 1 (恋爱中的人)
  predicates: ['2'], // 选择谓词 2 (在某些义务不允许爱情的时候坠入爱河)
  conflicts: ['1a'], // 选择冲突 1a
  outcomes: ['9'] // 选择结果 9 (在艰苦的事业中取得成功和幸福)
};

storyGenerator.generateStory(selectedElements);
console.log(storyGenerator.getGeneratedStory());

// 测试只选择角色和冲突
console.log('\n=== 只选择角色和冲突 ===');
const selectedElements2 = {
  characters: ['A', 'B'], // 选择角色 A 和 B
  subjects: [],
  predicates: [],
  conflicts: ['1b'], // 选择冲突 1b
  outcomes: []
};

storyGenerator.generateStory(selectedElements2);
console.log(storyGenerator.getGeneratedStory());

// 测试选择带有前置冲突和后续冲突的冲突
console.log('\n=== 选择带有前置冲突和后续冲突的冲突 ===');
const selectedElements3 = {
  characters: ['A', 'B'], // 选择角色 A 和 B
  subjects: ['1'], // 选择主题 1 (恋爱中的人)
  predicates: ['2'], // 选择谓词 2
  conflicts: ['1a'], // 选择冲突 1a
  outcomes: ['2'] // 选择结果 2 (从严重的纠缠中快乐地走出来)
};

storyGenerator.generateStory(selectedElements3);
console.log(storyGenerator.getGeneratedStory());