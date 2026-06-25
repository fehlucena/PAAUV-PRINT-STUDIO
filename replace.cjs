const fs = require('fs');

function replaceColors(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/blue-/g, 'amber-');
  fs.writeFileSync(file, content, 'utf8');
}

replaceColors('src/components/Sidebar.tsx');
replaceColors('src/components/TopBar.tsx');
