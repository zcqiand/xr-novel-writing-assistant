const fs = require('fs');
const content = fs.readFileSync('public/data/plotto.xml', 'utf8');
const lines = content.split('\n');

console.log('搜索包含 FB 或 A-3 的行:');
lines.forEach((line, index) => {
  if (line.includes('FB') || line.includes('A-3')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});