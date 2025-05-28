const admin = require('firebase-admin');

// ✅ استبدل هذا بمسار ملف المفاتيح (serviceAccountKey.json)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetWatchFields() {
  try {
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();

    usersSnapshot.forEach((doc) => {
      const userRef = db.collection('users').doc(doc.id);
      batch.update(userRef, {
        watchedAdsToday: 0,
        adsLastWatched: null,
        adIndex: 0,
      });
    });

    await batch.commit();
    console.log('✅ تم إعادة ضبط الحقول لجميع المستخدمين!');
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
  }
}

resetWatchFields();
