const fs = require('fs');

const files = [
  'client/src/app/dashboard/analytics/page.tsx',
  'client/src/app/dashboard/approvals/page.tsx',
  'client/src/app/dashboard/attendance/page.tsx',
  'client/src/app/dashboard/event/[id]/page.tsx',
  'client/src/app/dashboard/event/page.tsx',
  'client/src/app/dashboard/landing-management/page.tsx',
  'client/src/app/dashboard/leaderboard/page.tsx',
  'client/src/app/dashboard/page.tsx',
  'client/src/app/dashboard/teams/page.tsx',
  'client/src/app/dashboard/users/page.tsx',
  'client/src/app/event/[id]/page.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let text = fs.readFileSync(f, 'utf8');
  
  // Remove "ADMIN" from arrays
  text = text.replace(/"ADMIN",\s*/g, '');
  text = text.replace(/,\s*"ADMIN"/g, '');
  
  // Specifically for the Record<Role, string> types in users/page.tsx or analytics
  text = text.replace(/ADMIN:\s*"[^"]+",\s*/g, '');
  text = text.replace(/ADMIN:\s*"[^"]+"\s*/g, '');
  
  // Remove literal "ADMIN"
  text = text.replace(/"ADMIN"/g, '"FACULTY_COORDINATOR"'); // safe fallback, though it might result in duplicate "FACULTY_COORDINATOR", which in a JS .includes array doesn't matter (just an extra item).
  // deduplicate FACULTY_COORDINATOR in arrays just in case:
  text = text.replace(/"FACULTY_COORDINATOR",\s*"FACULTY_COORDINATOR"/g, '"FACULTY_COORDINATOR"');

  fs.writeFileSync(f, text);
});
