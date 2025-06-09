const fs = require('fs');
const path = require('path');

const TARGET_STRING = 'cloud.reown.com';
const PROJECT_DIR = './'; // يمكنك تغييره إذا كان المشروع داخل مجلد آخر

function searchInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(TARGET_STRING)) {
    console.log(`✅ Found in: ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.html')) {
      searchInFile(fullPath);
    }
  });
}

console.log(`🔍 Searching for "${TARGET_STRING}" in project...`);
walkDir(PROJECT_DIR);
console.log('✅ Done.');
