// 📁 addAdminRole.js

const admin = require('firebase-admin');

// 🔑 حمّل المفتاح الخاص بخدمة Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

// 🚀 تهيئة Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✏️ هنا تضع UID المستخدم الذي تريد منحه admin
const uid = 'LAV4frU8MENO6qvdn4ZrvH2RrXs2';

admin
  .auth()
  .setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log(`✅ تمت إضافة role: admin للمستخدم: ${uid}`);
    process.exit(0); // إنهاء السكربت بنجاح
  })
  .catch((error) => {
    console.error('❌ حدث خطأ أثناء إضافة role:', error);
    process.exit(1); // إنهاء السكربت مع خطأ
  });
