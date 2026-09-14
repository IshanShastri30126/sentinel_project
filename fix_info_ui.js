const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/app/dashboard/info/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace activeSection style in sidebar
content = content.replace(
  /className=\{`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer \$\{activeSection === s\.id[\s\S]*?`\}\s*style=\{[\s\S]*?\} : \{\}\}/,
  `className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer \${
                activeSection === s.id
                  ? "border border-[var(--ck-primary)] bg-[var(--ck-primary)]/10 shadow-[0_0_15px_rgba(0,245,212,0.15)] text-[var(--ck-primary)]"
                  : "border border-transparent text-[var(--ck-text-muted)] hover:text-[var(--ck-text)] hover:bg-white/5"
              }\`}`
);

// Replace icon and text styling inside the button
content = content.replace(
  /<span style=\{activeSection === s\.id \? \{ color: s\.id === "branding" \? "var\(--ck-primary\)" : s\.color \} : \{ color: "#52525b" \}\}>\{s\.icon\}<\/span>/,
  `<span className={activeSection === s.id ? "text-[var(--ck-primary)]" : "text-slate-500"}>{s.icon}</span>`
);

// Replace main panel wrapper styling
content = content.replace(
  /className="rounded-2xl border overflow-hidden"\s*style=\{\{[\s\S]*?\}\}/,
  `className="ck-glass-card overflow-hidden"`
);

// Replace panel header border
content = content.replace(
  /className="px-6 py-4 border-b flex items-center gap-3" style=\{\{ borderColor: activeSection === "branding" \? "rgba\(0,245,212,0\.15\)" : `\$\{section\.color\}15` \}\}/,
  `className="px-6 py-4 border-b border-white/[0.08] flex items-center gap-3 bg-black/20"`
);

// Replace icon background in header
content = content.replace(
  /className="w-9 h-9 rounded-xl flex items-center justify-center border" style=\{\{[\s\S]*?\}\}>/,
  `className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--ck-primary)]/30 bg-[var(--ck-primary)]/10">`
);

// Replace icon color in header
content = content.replace(
  /<span style=\{\{ color: activeSection === "branding" \? "var\(--ck-primary\)" : section\.color \}\}>\{section\.icon\}<\/span>/,
  `<span className="text-[var(--ck-primary)]">{section.icon}</span>`
);

// Replace title color in header
content = content.replace(
  /<h2 className="text-sm font-black uppercase tracking-widest" style=\{\{ color: activeSection === "branding" \? "var\(--ck-primary\)" : section\.color \}\}>\{section\.title\}<\/h2>/,
  `<h2 className="text-sm font-black uppercase tracking-widest text-[var(--ck-primary)]">{section.title}</h2>`
);

// Replace label color in fields
content = content.replace(
  /<label className="block text-\[10px\] font-bold uppercase tracking-widest font-mono" style=\{\{ color: section\.color \}\}>/g,
  `<label className="block text-[10px] font-bold uppercase tracking-widest font-mono text-[var(--ck-primary)]">`
);

// Replace button styling in footer (the non-branding one)
content = content.replace(
  /className="flex items-center gap-2 px-5 py-2\.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"\s*style=\{\{\s*background: saved \? "rgba\(16,185,129,0\.15\)" : `\$\{section\.color\}15`,\s*borderWidth: 1,\s*borderStyle: "solid",\s*borderColor: saved \? "rgba\(16,185,129,0\.3\)" : `\$\{section\.color\}30`,\s*color: saved \? "#10b981" : section\.color,\s*\}\}/,
  `className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer \${
                    saved 
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                      : "ck-btn-primary"
                  }\`}`
);

// Replace s.color mapping
content = content.replace(/color: "#7c3aed",/g, '');
content = content.replace(/color: "#f59e0b",/g, '');
content = content.replace(/color: "#06b6d4",/g, '');
content = content.replace(/color: "#10b981",/g, '');
content = content.replace(/color: "#00F5D4",/g, '');


fs.writeFileSync(filePath, content);
console.log("Updated info page UI theme.");
