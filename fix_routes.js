const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'server/src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix authenticate("ROLE") -> authenticate, requireRole("ROLE")
  content = content.replace(/authenticate\("([^"]+)"\)/g, 'authenticate, requireRole("$1")');
  
  // Fix requireMinRole -> requireRole
  content = content.replace(/requireMinRole\("([^"]+)"\)/g, 'requireRole("$1")');

  // Also make sure requireRole is imported if we just added it and it's missing
  if (content.includes('requireRole(') && !content.includes('requireRole')) {
     // Wait, if it includes requireRole( it includes requireRole. We just need to check the import block.
     if (!content.includes('requireRole') && content.includes('import { authenticate')) {
         content = content.replace('import { authenticate', 'import { authenticate, requireRole');
     }
  }

  // Restore requireRole import if missing
  if (content.includes('requireRole(') && !content.match(/import.*requireRole/)) {
     content = content.replace(/import\s*\{\s*authenticate\s*\}/, 'import { authenticate, requireRole }');
  }

  fs.writeFileSync(filePath, content);
}
console.log('Fixed backend routes syntax.');
