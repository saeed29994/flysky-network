# استخدم صورة Node.js 20 الخفيفة لتقليل حجم الحاوية
FROM node:20-slim

# تعيين متغير بيئة لإعدادات الإنتاج
ENV NODE_ENV=production

# تحديد مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات package.json و package-lock.json أولاً لتثبيت التبعيات فقط إذا تغيرت
COPY package*.json ./

# تثبيت التبعيات بدون devDependencies
RUN npm install --omit=dev

# نسخ بقية ملفات المشروع
COPY . .

# فتح منفذ 8080 المستخدم من Cloud Run
EXPOSE 8080

# تشغيل التطبيق
CMD ["npm", "start"]
