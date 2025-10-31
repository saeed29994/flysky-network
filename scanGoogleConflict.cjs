const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname); // مسار مجلد المشروع

function scanForGoogleFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // تجاهل node_modules
    if (fullPath.includes('node_modules')) continue;

    if (
      entry.name.toLowerCase() === 'google.js' ||
      (entry.isDirectory() && entry.name.toLowerCase() === 'google')
    ) {
      console.log('🚨 تعارض محتمل:', fullPath);
    }

    if (entry.isDirectory()) {
      scanForGoogleFiles(fullPath); // تابع البحث داخل المجلدات
    }
  }
}

console.log('🔍 بدء فحص التعارضات في ملفات google...');
scanForGoogleFiles(rootDir);
console.log('✅ الفحص انتهى.');
