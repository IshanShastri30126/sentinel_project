const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('/home/Ssnape69/Videos/sentinal/sentinel_project/client/src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        
        // Remove legacy roles from array includes
        content = content.replace(/"FACULTY"\s*,?/g, '');
        content = content.replace(/"TECH"\s*,?/g, '');
        content = content.replace(/"CONTENT"\s*,?/g, '');
        content = content.replace(/"SOCIAL_MEDIA"\s*,?/g, '');
        
        // Clean up trailing commas in arrays (e.g., ["TECH_COORDINATOR", ])
        content = content.replace(/,\s*]/g, ']');
        // Clean up leading commas in arrays
        content = content.replace(/\[\s*,/g, '[');
        // Clean up double commas
        content = content.replace(/,\s*,/g, ',');
        
        // Replace role === "FACULTY" with role === "FACULTY_COORDINATOR"
        // Wait, if it's already "FACULTY_COORDINATOR" || "FACULTY", it will become "FACULTY_COORDINATOR" || "FACULTY_COORDINATOR"
        // Let's handle the specific || case first
        content = content.replace(/role === "FACULTY" \|\| role === "FACULTY_COORDINATOR"/g, 'role === "FACULTY_COORDINATOR"');
        content = content.replace(/role === "FACULTY_COORDINATOR" \|\| role === "FACULTY"/g, 'role === "FACULTY_COORDINATOR"');
        
        // Then any remaining standalone ones
        content = content.replace(/role === "FACULTY"/g, 'role === "FACULTY_COORDINATOR"');
        content = content.replace(/role !== "FACULTY"/g, 'role !== "FACULTY_COORDINATOR"');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed', filePath);
        }
    }
});
