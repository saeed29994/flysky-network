// 📁 checkAdUsers.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من اسم الملف الصحيح

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('adSharedAt', '!=', null).get();

  if (snapshot.empty) {
    console.log('🚫 لا يوجد أي مستخدم لديه adSharedAt.');
    return;
  }

  console.log(`✅ عدد المستخدمين الذين لديهم adSharedAt: ${snapshot.size}\n`);

  for (const doc of snapshot.docs) {
    const uid = doc.id;

    try {
      await auth.getUser(uid);
      console.log(`🟢 ${uid} ✅ موجود في Authentication.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`🔴 ${uid} ❌ غير موجود في Authentication.`);
      } else {
        console.log(`⚠️ خطأ غير متوقع مع المستخدم ${uid}:`, error.message);
      }
    }
  }
}

main();
