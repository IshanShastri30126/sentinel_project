const fs = require('fs');
const path = require('path');
let filePath = path.join(__dirname, 'src/routes/certificates.ts');
let content = fs.readFileSync(filePath, 'utf-8');
let lines = content.split('\n');
for (let i = 424; i < lines.length; i++) {
  lines[i] = lines[i].replace(/\\\$\{/g, '${');
  lines[i] = lines[i].replace(/\\\`/g, '`');
}
fs.writeFileSync(filePath, lines.join('\n'));
console.log("Done");
