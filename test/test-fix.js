// 测试角色替换功能
const fs = require('fs');

// 模拟测试数据
const testDescription = "男性主角 已与 女性主角 结为伉俪，前者是 FB，后者是 女性主角 的父亲；但 女性主角的父亲 却违背诺言，强迫 女性主角 嫁给 A-3，后者比 男性主角 富有";

// 模拟 plottoData
const mockPlottoData = {
  characters: [
    { designation: "A", sex: "男性", description: "男性主角" },
    { designation: "B", sex: "女性", description: "女性主角" },
    { designation: "A-2", sex: "男性", description: "男性主角的男性朋友" },
    { designation: "A-3", sex: "男性", description: "男性主角的男性对手或敌人" },
    { designation: "FB", sex: "男性", description: "女性主角的父亲" }
  ]
};

// 模拟 characterLinks（可能为空）
const mockCharacterLinks = [];

// 实现修复后的替换函数
function replaceCharacterReferences(description, characterLinks, plottoData) {
  if (!plottoData?.characters || plottoData.characters.length === 0) {
    console.log('🔍 [DEBUG] plottoData 中没有角色定义，直接返回原文本');
    return description;
  }

  console.log('🔍 [DEBUG] 开始替换角色');
  console.log('🔍 [DEBUG] 输入文本:', description);
  console.log('🔍 [DEBUG] characterLinks:', characterLinks);

  let result = description;

  // 创建所有可用角色的映射，优先使用 characterLinks 中的角色
  const characterMap = new Map();

  // 首先添加所有在 XML 中定义的角色
  plottoData.characters.forEach(character => {
    characterMap.set(character.designation, character.description);
  });

  // 如果有 characterLinks，优先使用这些角色（可能包含动态转换的角色）
  if (characterLinks && characterLinks.length > 0) {
    characterLinks.forEach(link => {
      if (link.ref) {
        // 从 XML 角色定义中查找描述
        const character = plottoData.characters.find(char => char.designation === link.ref);
        if (character) {
          characterMap.set(link.ref, character.description);
        }
      }
    });
  }

  // 按长度倒序排序角色标识符，确保长的标识符优先匹配（如 A-2 在 A 之前匹配）
  const sortedDesignations = Array.from(characterMap.keys()).sort((a, b) => b.length - a.length);

  for (const designation of sortedDesignations) {
    const characterDescription = characterMap.get(designation);
    if (!designation || !characterDescription) continue;

    console.log('🔍 [DEBUG] 处理角色标识符', {
      designation,
      characterDescription,
      source: characterLinks.some(link => link.ref === designation) ? 'characterLinks' : 'XML定义'
    });

    // 转义正则表达式中的特殊字符
    const escapedRef = designation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = `\\b${escapedRef}\\b`;

    // 检查是否有匹配项
    const matches = result.match(new RegExp(regexPattern, 'g'));
    if (matches) {
      console.log(`🔍 [DEBUG] 找到 ${matches.length} 个 "${designation}" 的匹配项`);
      console.log(`🔍 [DEBUG] 替换 "${designation}" -> "${characterDescription}"`);

      const before = result;
      result = result.replace(new RegExp(regexPattern, 'g'), characterDescription);

      if (before !== result) {
        console.log(`🔍 [DEBUG] 替换成功`);
        console.log(`🔍 [DEBUG] 替换前: ${before}`);
        console.log(`🔍 [DEBUG] 替换后: ${result}`);
      } else {
        console.log(`🔍 [DEBUG] 替换没有生效，检查正则表达式`);
      }
    } else {
      console.log(`🔍 [DEBUG] 未找到 "${designation}" 的匹配项`);
    }
  }

  // 检查是否还有未替换的角色标识符
  const remainingIdentifiers = result.match(/\b[A-Z][A-Z-0-9]*\b/g);
  if (remainingIdentifiers) {
    const unreplaced = remainingIdentifiers.filter(id =>
      !characterMap.has(id)
    );
    if (unreplaced.length > 0) {
      console.log(`🔍 [DEBUG] 发现未替换的角色标识符: ${unreplaced.join(', ')}`);
      console.log(`🔍 [DEBUG] 这些标识符在角色映射中不存在`);
    }
  }

  console.log('🔍 [DEBUG] 最终结果:', result);
  return result;
}

// 运行测试
console.log('=== 测试角色替换功能 ===');
console.log('原始文本:', testDescription);
console.log('');

const result = replaceCharacterReferences(testDescription, mockCharacterLinks, mockPlottoData);

console.log('');
console.log('=== 测试结果 ===');
console.log('修复后文本:', result);
console.log('');

// 验证是否成功替换
const hasFB = result.includes('女性主角的父亲');
const hasA3 = result.includes('男性主角的男性对手或敌人');

console.log('验证结果:');
console.log('- FB 替换成功:', hasFB ? '✅' : '❌');
console.log('- A-3 替换成功:', hasA3 ? '✅' : '❌');

if (hasFB && hasA3) {
  console.log('\n🎉 测试通过！角色替换功能已修复。');
} else {
  console.log('\n❌ 测试失败！角色替换功能仍有问题。');
}