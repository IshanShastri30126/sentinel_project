const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.prisma')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      if (fullPath.endsWith('schema.prisma')) {
         content = content.replace(/\bADMIN\s*\n/g, '');
      } else {
         // Replace "ADMIN", "ADMIN" with nothing
         content = content.replace(/"ADMIN",\s*/g, '');
         content = content.replace(/,\s*"ADMIN"/g, '');
         content = content.replace(/"ADMIN"/g, '');
         content = content.replace(/\|\s*ADMIN/g, '');
         // Some might have role === "ADMIN" || ...
         content = content.replace(/role ===\s*\|\|\s*/g, ''); // not quite right
         
         // specific cleanup
         content = content.replace(/role\s*===\s*\|\|\s*/g, '');
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.resolve(__dirname, 'client/src'));
processDir(path.resolve(__dirname, 'server/src'));
processDir(path.resolve(__dirname, 'server/prisma'));
