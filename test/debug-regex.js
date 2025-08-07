// 调试正则表达式匹配问题
const testDescription = "男性主角 已与 女性主角 结为伉俪，前者是 FB，后者是 女性主角 的父亲；但 女性主角的父亲 却违背诺言，强迫 女性主角 嫁给 A-3，后者比 男性主角 富有";

const characters = [
  { designation: "A", sex: "男性", description: "男性主角" },
  { designation: "B", sex: "女性", description: "女性主角" },
  { designation: "A-2", sex: "男性", description: "男性主角的男性朋友" },
  { designation: "A-3", sex: "男性", description: "男性主角的男性对手或敌人" },
  { designation: "FB", sex: "男性", description: "女性主角的父亲" }
];

console.log('=== 调试正则表达式匹配 ===');
console.log('测试文本:', testDescription);
console.log('');

// 测试每个角色的正则表达式匹配
characters.forEach(character => {
  const designation = character.designation;
  const description = character.description;

  // 转义正则表达式中的特殊字符
  const escapedRef = designation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = `(?<!\\S)${escapedRef}(?!\\S)`;

  console.log(`\n--- 测试角色: ${designation} ---`);
  console.log(`正则表达式: /${regexPattern}/g`);

  // 测试匹配
  const matches = testDescription.match(new RegExp(regexPattern, 'g'));
  if (matches) {
    console.log(`✅ 找到 ${matches.length} 个匹配项:`, matches);

    // 测试替换
    const replaced = testDescription.replace(new RegExp(regexPattern, 'g'), description);
    console.log(`替换结果: ${replaced}`);
  } else {
    console.log(`❌ 未找到匹配项`);

    // 尝试更简单的正则表达式
    const simplePattern = `\\b${escapedRef}\\b`;
    console.log(`尝试简单正则: /${simplePattern}/g`);
    const simpleMatches = testDescription.match(new RegExp(simplePattern, 'g'));
    if (simpleMatches) {
      console.log(`✅ 简单正则找到 ${simpleMatches.length} 个匹配项:`, simpleMatches);
    } else {
      console.log(`❌ 简单正则也未找到匹配项`);

      // 尝试完全匹配
      const exactPattern = escapedRef;
      console.log(`尝试完全匹配: /${exactPattern}/g`);
      const exactMatches = testDescription.match(new RegExp(exactPattern, 'g'));
      if (exactMatches) {
        console.log(`✅ 完全匹配找到 ${exactMatches.length} 个匹配项:`, exactMatches);
      } else {
        console.log(`❌ 完全匹配也未找到`);
      }
    }
  }
});

// 检查文本中的所有大写标识符
console.log('\n=== 文本中的标识符分析 ===');
const identifiers = testDescription.match(/\b[A-Z][A-Z-0-9]*\b/g);
if (identifiers) {
  console.log('找到的标识符:', identifiers);
  console.log('唯一标识符:', [...new Set(identifiers)]);
} else {
  console.log('未找到任何标识符');
}

// 手动检查每个位置
console.log('\n=== 手动检查每个位置 ===');
const words = testDescription.split(/[\s，；。！？、]/);
words.forEach((word, index) => {
  if (word && /[A-Z][A-Z-0-9]*/.test(word)) {
    console.log(`位置 ${index}: "${word}"`);
  }
});