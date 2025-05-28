const admin = require('firebase-admin');

// ✅ استبدل هذا بمسار ملف المفاتيح (serviceAccountKey.json)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addFieldsToUsers() {
  try {
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();

    usersSnapshot.forEach((doc) => {
      const userRef = db.collection('users').doc(doc.id);
      batch.update(userRef, {
        watchedAdsToday: 0,
        adsLastWatched: null,
      });
    });

    await batch.commit();
    console.log('✅ تمت إضافة الحقول لجميع المستخدمين.');
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
  }
}

addFieldsToUsers();
