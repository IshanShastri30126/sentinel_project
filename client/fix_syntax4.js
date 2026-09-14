const fs = require('fs');

function replaceFile(path, search, replace) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(search).join(replace);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. landing-management/page.tsx
replaceFile('src/app/dashboard/landing-management/page.tsx', '<option value=>Content Division</option>', '');

// 2. event/[id]/page.tsx
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  ? "Employee ID *"', 'user?.role === "FACULTY_COORDINATOR" ? "Employee ID *"');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role === ? "Employee ID *"', 'user?.role === "FACULTY_COORDINATOR" ? "Employee ID *"');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  ? "e.g. EMP101"', 'user?.role === "FACULTY_COORDINATOR" ? "e.g. EMP101"');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role === ? "e.g. EMP101"', 'user?.role === "FACULTY_COORDINATOR" ? "e.g. EMP101"');

// 3. maintenance/page.tsx
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user?.role ===  || log.user?.role === "FACULTY_COORDINATOR"', 'log.user?.role === "FACULTY_COORDINATOR"');
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user?.role === || log.user?.role === "FACULTY_COORDINATOR"', 'log.user?.role === "FACULTY_COORDINATOR"');

console.log("Fixed again again!");
