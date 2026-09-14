const fs = require('fs');

const files = [
  'server/src/routes/analytics.ts',
  'server/src/routes/appreciation.ts',
  'server/src/routes/approvals.ts',
  'server/src/routes/attendance.ts',
  'server/src/routes/auth.ts',
  'server/src/routes/certificates.ts',
  'server/src/routes/events.ts',
  'server/src/routes/maintenance.ts',
  'server/src/routes/settings.ts',
  'server/src/routes/teams.ts',
  'server/src/routes/users.ts',
  'client/src/lib/auth-context.tsx',
  'client/src/app/dashboard/layout.tsx',
  'client/src/app/dashboard/users/page.tsx',
  'server/prisma/schema.prisma'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let text = fs.readFileSync(f, 'utf8');
  
  // Replace in requireRole, arrays, and Prisma schema
  text = text.replace(/"ADMIN",\s*/g, '');
  text = text.replace(/,\s*"ADMIN"/g, '');
  text = text.replace(/\|\s*"ADMIN"/g, ''); // in TS types
  
  // Fix boolean conditions: role === "ADMIN" || 
  text = text.replace(/role === "ADMIN"\s*\|\|\s*/g, '');
  text = text.replace(/userRole === "ADMIN"\s*\|\|\s*/g, '');
  text = text.replace(/\|\|\s*role === "ADMIN"/g, '');
  text = text.replace(/\|\|\s*userRole === "ADMIN"/g, '');
  
  // Prisma enum removal
  if (f.endsWith('schema.prisma')) {
    text = text.replace(/\s*ADMIN\n/g, '\n');
  }

  // Check for lingering "ADMIN" inside arrays that were the only element (unlikely but possible)
  text = text.replace(/\["ADMIN"\]/g, '[]');
  
  fs.writeFileSync(f, text);
});
