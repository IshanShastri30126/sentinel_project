const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = [...walk('client/src'), ...walk('server/src')];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    // First, Chakravyuh Club
    newContent = newContent.replace(/Chakravyuh Club/gi, (match) => {
        if (match === 'CHAKRAVYUH CLUB') return 'SENTINEL';
        if (match === 'chakravyuh club') return 'sentinel';
        return 'Sentinel';
    });
    
    // Then Chakravyuh
    newContent = newContent.replace(/Chakravyuh/gi, (match) => {
        // preserve links
        if (content.includes('linkedin.com') && match.toLowerCase() === 'chakravyuh') return match;
        if (match === 'CHAKRAVYUH') return 'SENTINEL';
        if (match === 'chakravyuh') return 'sentinel';
        return 'Sentinel';
    });
    
    // Then Club
    newContent = newContent.replace(/\bClub\b/gi, (match) => {
        if (match === 'CLUB') return 'SENTINEL';
        if (match === 'club') return 'sentinel';
        return 'Sentinel';
    });

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
