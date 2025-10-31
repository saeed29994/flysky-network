const fs = require('fs');
const path = require('path');

const fileNameToIgnore = 'serviceAccountKey.json';
const rootDir = process.cwd(); // يبدأ من المجلد الحالي

// دالة للبحث داخل المجلدات الفرعية
function addToGitignoreInDir(dir) {
  const gitignorePath = path.join(dir, '.gitignore');

  // إذا ما فيه .gitignore – أنشئه
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `${fileNameToIgnore}\n`);
    console.log(`✅ Created .gitignore in ${dir}`);
  } else {
    // إذا موجود، تأكد ما يكون فيه السطر مسبقًا
    const currentContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!currentContent.includes(fileNameToIgnore)) {
      fs.appendFileSync(gitignorePath, `\n${fileNameToIgnore}`);
      console.log(`✅ Added ${fileNameToIgnore} to .gitignore in ${dir}`);
    }
  }
}

// دالة المشي داخل المجلدات
function walk(dir) {
  addToGitignoreInDir(dir);

  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    }
  });
}

// يبدأ التنفيذ
walk(rootDir);
console.log('🎉 All done!');
