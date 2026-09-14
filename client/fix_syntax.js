const fs = require('fs');

function replaceFile(path, search, replace) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(search).join(replace);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. landing-management
replaceFile('src/app/dashboard/landing-management/page.tsx', 'role: \n      designation: "Security Researcher",', 'role: "FACULTY_COORDINATOR",\n      designation: "Security Researcher",');

// 2. users
replaceFile('src/app/dashboard/users/page.tsx', '(u.institute || )', '(u.institute || "FACULTY")');

// 3. event/[id]
replaceFile('src/app/dashboard/event/[id]/page.tsx', 'r.user.role ===  || r.user.role === "FACULTY_COORDINATOR"', 'r.user.role === "FACULTY_COORDINATOR"');

// 4. event
replaceFile('src/app/dashboard/event/page.tsx', 'm.role ===  || m.designation?.toLowerCase().includes("faculty")', 'm.role === "FACULTY_COORDINATOR" || m.designation?.toLowerCase().includes("faculty")');

// 5. maintenance
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user.role ===  || log.user.role === "FACULTY_COORDINATOR"', 'log.user.role === "FACULTY_COORDINATOR"');
replaceFile('src/app/dashboard/maintenance/page.tsx', 'log.user?.role ===  || log.user?.role === "FACULTY_COORDINATOR"', 'log.user?.role === "FACULTY_COORDINATOR"');

// 6. event/[id] frontend
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  || user?.role === "STUDENT_COORDINATOR"', 'user?.role === "STUDENT_COORDINATOR"');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role !==  && (', 'user?.role !== "FACULTY_COORDINATOR" && (');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  ? "Employee ID *"', 'user?.role === "FACULTY_COORDINATOR" ? "Employee ID *"');
replaceFile('src/app/event/[id]/page.tsx', 'user?.role ===  ? "e.g. EMP101"', 'user?.role === "FACULTY_COORDINATOR" ? "e.g. EMP101"');

// 7. team/[id]
replaceFile('src/app/team/[id]/page.tsx', 'const isFaculty = member.role === ;', 'const isFaculty = member.role === "FACULTY_COORDINATOR";');

// 8. team
replaceFile('src/app/team/page.tsx', 'case :', 'case "FACULTY_COORDINATOR":');
replaceFile('src/app/team/page.tsx', 'm.role === )', 'm.role === "FACULTY_COORDINATOR")');

console.log("Syntax fixes applied");
