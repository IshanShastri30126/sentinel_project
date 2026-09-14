const fs = require('fs');

function replaceFile(path, search, replace) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(search).join(replace);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. src/lib/fallbackTeam.ts:38:16
replaceFile('src/lib/fallbackTeam.ts', 'role: \n    designation: "Faculty Mentor",', 'role: "FACULTY_COORDINATOR",\n    designation: "Faculty Mentor",');

// 2. src/app/dashboard/event/[id]/page.tsx:385:60
replaceFile('src/app/dashboard/event/[id]/page.tsx', 'r.user.role ===  || r.user.role === "FACULTY_COORDINATOR"', 'r.user.role === "FACULTY_COORDINATOR"');

// 3. src/app/dashboard/event/page.tsx:452:39
replaceFile('src/app/dashboard/event/page.tsx', 'm.role ===  || m.designation?.toLowerCase().includes("faculty")', 'm.role === "FACULTY_COORDINATOR" || m.designation?.toLowerCase().includes("faculty")');

// 4. src/app/dashboard/landing-management/page.tsx:123:41
replaceFile('src/app/dashboard/landing-management/page.tsx', 'activeMember.role ===  || activeMember.role === "FACULTY_COORDINATOR"', 'activeMember.role === "FACULTY_COORDINATOR"');

// 5. src/app/dashboard/maintenance/page.tsx:1096:75
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user.role ===  || log.user.role === "FACULTY_COORDINATOR"', 'log.user.role === "FACULTY_COORDINATOR"');

// 6. src/app/event/[id]/page.tsx:924:31
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  || user?.role === "STUDENT_COORDINATOR"', 'user?.role === "STUDENT_COORDINATOR"');

// 7. src/app/team/page.tsx:383:54
replaceFile('src/app/team/page.tsx', 'm.role ===  || m.role === "FACULTY_COORDINATOR"', 'm.role === "FACULTY_COORDINATOR"');

// 8. src/app/dashboard/landing-management/page.tsx:167:5 (Return statement is not allowed here issue)
// Wait, why did the parsing fail there? Ah, maybe `replaceFile` removed a bracket or something?
// Let's check landing-management/page.tsx line 123... wait, what is the syntax error on line 167? "Return statement is not allowed here"
// It implies that something is open before line 167.
