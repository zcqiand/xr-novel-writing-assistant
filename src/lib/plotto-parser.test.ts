import { readFileSync } from 'fs';
import { PlottoParser } from './plotto-parser';

// 读取 XML 文件
const xmlFilePath = './docs/literature/plotto-simple.xml';
const xmlContent = readFileSync(xmlFilePath, 'utf-8');

// 创建解析器实例
const parser = new PlottoParser();

// 解析 XML 内容
parser.parse(xmlContent);

// 获取解析后的数据
const data = parser.getParsedData();

// 输出一些基本信息来验证解析是否成功
console.log('解析完成！');
console.log('角色数量:', data.characters.length);
console.log('主角类型数量:', data.subjects.length);
console.log('情节数量:', data.predicates.length);
console.log('结局数量:', data.outcomes.length);
console.log('冲突数量:', data.conflicts.length);

// 输出第一个角色的信息
if (data.characters.length > 0) {
  console.log('第一个角色:', data.characters[0]);
}

// 输出第一个冲突的详细信息
if (data.conflicts.length > 0) {
  console.log('第一个冲突:', data.conflicts[0]);
}