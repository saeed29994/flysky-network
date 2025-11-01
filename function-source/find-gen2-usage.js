const fs = require("fs");
const path = require("path");

const TARGET_DIR = path.join(__dirname); // 👈 يمكنك تغييره لمسار مجلد آخر
const suspiciousKeywords = ["runWith(", "cpu:", "minInstances", "maxInstances", "concurrency"];

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      searchFiles(fullPath); // 📁 التحقق داخل المجلدات
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const keyword of suspiciousKeywords) {
        if (content.includes(keyword)) {
          console.log(`⚠️ Found "${keyword}" in ${fullPath}`);
        }
      }
    }
  }
}

console.log("🔍 Searching for .runWith() or Gen 2 settings...\n");
searchFiles(TARGET_DIR);
console.log("\n✅ Done.");
