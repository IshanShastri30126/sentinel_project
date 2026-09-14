const fs = require('fs');

function replaceFile(path, search, replace) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(search).join(replace);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. landing-management/page.tsx
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role ===  || activeMember.role === "FACULTY_COORDINATOR"', 'activeMember.role === "FACULTY_COORDINATOR"');
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role === || activeMember.role === "FACULTY_COORDINATOR"', 'activeMember.role === "FACULTY_COORDINATOR"');
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role ===  ? "Employee ID"', 'activeMember.role === "FACULTY_COORDINATOR" ? "Employee ID"');
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role === ? "Employee ID"', 'activeMember.role === "FACULTY_COORDINATOR" ? "Employee ID"');
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role ===  ? "e.g. EMP101"', 'activeMember.role === "FACULTY_COORDINATOR" ? "e.g. EMP101"');
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role === ? "e.g. EMP101"', 'activeMember.role === "FACULTY_COORDINATOR" ? "e.g. EMP101"');

// 2. event/[id]/page.tsx
replaceFile('src/app/event/[id]/page.tsx', 'user?.role !==  && (', 'user?.role !== "FACULTY_COORDINATOR" && (');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role !== && (', 'user?.role !== "FACULTY_COORDINATOR" && (');

console.log("Fixed again again again!");
