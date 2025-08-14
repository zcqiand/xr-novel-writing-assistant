const fs = require('fs');

// 为"解剖室的发现"场景生成段落内容
const sceneData = {
  "sceneNumber": 1,
  "title": "解剖室的发现",
  "openingParagraph": "暴雨拍打着解剖室的窗户，许知远手持红色马克笔，在第四具尸体耳后的朱砂痣周围小心地画着圈。荧光灯下，每一处细节都显得格外清晰，法医报告显示这与前三位受害者完全一致的生物特征让他心头一紧。突然，解剖刀在铁盘中发出清脆的碰撞声，在寂静的房间里回荡...",
  "closingParagraph": "许知远直起身，看着眼前这具特殊的尸体，心中涌起无数疑问。相同的生物特征，不同的作案手法，这背后隐藏着怎样的秘密？他整理好工具，准备将这个发现告诉林夏，相信这位老搭档会和他一起揭开这个谜团。"
};

// 保存修复后的段落数据
const filePath = 'data/暗涌-chapter-1-scene-1-paragraphs.json';
fs.writeFileSync(filePath, JSON.stringify(sceneData, null, 2), 'utf8');

console.log('✅ 解剖室的发现场景段落已修复:', filePath);
console.log('开头段落长度:', sceneData.openingParagraph.length);
console.log('结尾段落长度:', sceneData.closingParagraph.length);