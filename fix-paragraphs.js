const fs = require('fs');
const path = require('path');

// 测试段落生成函数
const generateTestOpeningParagraph = (sceneTitle) => {
  if (sceneTitle.includes('残卷') || sceneTitle.includes('幻影')) {
    return "工作室里，林深小心翼翼地修复着那本民国日记本。破损的内页突然渗出墨渍，在灯光下形成了一个穿月白旗袍的女子剪影。他屏住呼吸，伸手触碰那幻影般的画面...";
  } else if (sceneTitle.includes('雨夜') || sceneTitle.includes('废墟')) {
    return "暴雨倾盆的深夜，林深抱着修复箱匆匆赶路。途经图书馆废墟时，他看到断墙处有手电筒光束在晃动。一个身影正在瓦砾堆中翻找，沾满泥浆的旗袍下摆在雨中若隐若现...";
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    return "闪电划破天际的刹那，林深与那个四目相对的身影同时抬头。雨幕中，她耳垂的朱砂痣清晰可见，与日记中的幻影、母亲遗照上的印记完全重叠。废墟间飘起若有若无的茉莉香...";
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    return "陆知秋慌乱中掉落的鎏金怀表在泥水中闪烁着微光。林深弯腰捡起，发现表盖内侧刻着母亲的名字。表针永远停在1943年立秋，那是一个改变一切的秋天...";
  } else {
    return `在${sceneTitle}中，林深感受到了前所未有的紧张与期待。空气中弥漫着神秘的味道，仿佛有什么重要的事情即将发生...`;
  }
};

const generateTestClosingParagraph = (sceneTitle) => {
  if (sceneTitle.includes('残卷') || sceneTitle.includes('幻影')) {
    return "林深的手指停留在幻影之上，心中涌起莫名的悸动。那女子的身影渐渐淡去，但耳垂的朱砂痣却清晰地烙印在他的记忆里，仿佛在诉说着一个尘封已久的故事...";
  } else if (sceneTitle.includes('雨夜') || sceneTitle.includes('废墟')) {
    return "雨幕中，陆知秋抬起头，四目相对的瞬间，林深看到了她眼中的惊讶与疑惑。泥泞的废墟上，两个身影在暴雨中相遇，命运的齿轮开始转动...";
  } else if (sceneTitle.includes('倒影') || sceneTitle.includes('茉莉')) {
    return "茉莉的香气在雨中弥漫，林深的心跳加速。那朱砂痣的巧合绝非偶然，母亲的遗照、日记的幻影、眼前的女子，三者之间一定存在着某种神秘的联系...";
  } else if (sceneTitle.includes('怀表') || sceneTitle.includes('1943')) {
    return "林深紧紧握住那枚怀表，1943年的立秋永远定格在这一刻。泛黄照片上的少女面容与母亲年轻时的模样惊人相似，时间的迷雾中，真相若隐若现...";
  } else {
    return `随着${sceneTitle}的结束，林深意识到这只是故事的开始。更多的谜团和挑战在前方等待着他，但他已经准备好面对这一切...`;
  }
};

// 修复段落文件的主函数
async function fixParagraphFiles() {
  console.log('=== 开始修复段落文件 ===');

  try {
    // 读取所有段落文件
    const dataDir = path.join(__dirname, 'data');
    const files = fs.readdirSync(dataDir);

    const paragraphFiles = files.filter(file => file.endsWith('-paragraphs.json'));

    console.log(`找到 ${paragraphFiles.length} 个段落文件`);

    for (const file of paragraphFiles) {
      const filePath = path.join(dataDir, file);
      console.log(`\n处理文件: ${file}`);

      try {
        // 读取现有文件
        const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log('现有数据:', existingData);

        // 生成新的段落内容
        const openingParagraph = generateTestOpeningParagraph(existingData.title);
        const closingParagraph = generateTestClosingParagraph(existingData.title);

        console.log('生成开头段落:', openingParagraph.substring(0, 50) + '...');
        console.log('生成结尾段落:', closingParagraph.substring(0, 50) + '...');

        // 更新数据
        const updatedData = {
          ...existingData,
          openingParagraph: openingParagraph,
          closingParagraph: closingParagraph
        };

        // 保存更新后的文件
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
        console.log(`✅ 文件 ${file} 修复完成`);

      } catch (error) {
        console.error(`❌ 处理文件 ${file} 时出错:`, error.message);
      }
    }

    console.log('\n=== 段落文件修复完成 ===');

  } catch (error) {
    console.error('修复段落文件时出错:', error);
  }
}

// 执行修复
fixParagraphFiles().catch(console.error);