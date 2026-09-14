const fs = require('fs');

function replaceFile(path, search, replace) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(search).join(replace);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. src/app/dashboard/landing-management/page.tsx:406:38
replaceFile('src/app/dashboard/landing-management/page.tsx', '<option value=>Faculty Coordinator</option>', '<option value="FACULTY_COORDINATOR">Faculty Coordinator</option>');
replaceFile('src/app/dashboard/landing-management/page.tsx', '<option value=>Technical Division</option>', '<option value="TECH_COORDINATOR">Technical Division</option>');
replaceFile('src/app/dashboard/landing-management/page.tsx', '<option value=>Social Media Division</option>', '<option value="SOCIAL_MEDIA_COORDINATOR">Social Media Division</option>');

// 2. src/app/dashboard/event/[id]/page.tsx:385:60
replaceFile('src/app/dashboard/event/[id]/page.tsx', 'r.user.role ===  || r.user.role === "FACULTY_COORDINATOR"', 'r.user.role === "FACULTY_COORDINATOR"');
replaceFile('src/app/dashboard/event/[id]/page.tsx', 'r.user.role === || r.user.role === "FACULTY_COORDINATOR"', 'r.user.role === "FACULTY_COORDINATOR"');

// 3. src/app/dashboard/event/page.tsx:452:39
replaceFile('src/app/dashboard/event/page.tsx', 'm.role ===  || m.designation?.toLowerCase().includes("faculty")', 'm.role === "FACULTY_COORDINATOR" || m.designation?.toLowerCase().includes("faculty")');
replaceFile('src/app/dashboard/event/page.tsx', 'm.role === || m.designation?.toLowerCase().includes("faculty")', 'm.role === "FACULTY_COORDINATOR" || m.designation?.toLowerCase().includes("faculty")');

// 4. src/app/dashboard/maintenance/page.tsx:1096:75
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user.role ===  || log.user.role === "FACULTY_COORDINATOR"', 'log.user.role === "FACULTY_COORDINATOR"');
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user.role === || log.user.role === "FACULTY_COORDINATOR"', 'log.user.role === "FACULTY_COORDINATOR"');

// 5. src/app/event/[id]/page.tsx:924:31
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  || user?.role === "STUDENT_COORDINATOR"', 'user?.role === "STUDENT_COORDINATOR"');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role === || user?.role === "STUDENT_COORDINATOR"', 'user?.role === "STUDENT_COORDINATOR"');

console.log("Fixed again!");
