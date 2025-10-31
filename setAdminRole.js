// setAdminRole.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // مسار ملف المفاتيح

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ✏️ ضع UID الخاص بالمستخدم الذي تريد منحه صلاحية admin
const uid = 'h2koDWMocfal60B8b61RBZq2Ebq1';

admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log(`✅ تم تعيين صلاحية admin بنجاح للمستخدم: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ حدث خطأ أثناء تعيين الصلاحية:', error);
    process.exit(1);
  });
