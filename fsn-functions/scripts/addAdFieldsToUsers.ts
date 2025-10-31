// 📁 fsn-functions/scripts/addAdFieldsToUsers.ts

import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

async function addAdFieldsToAllUsers() {
  const usersSnapshot = await db.collection('users').get();

  const batch = db.batch();

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    const userRef = db.collection('users').doc(doc.id);

    const updateData: any = {};
    if (data.watchedAdsToday === undefined) updateData.watchedAdsToday = 0;
    if (data.adsLastWatched === undefined) updateData.adsLastWatched = admin.firestore.Timestamp.fromMillis(0);

    if (Object.keys(updateData).length > 0) {
      batch.update(userRef, updateData);
    }
  });

  await batch.commit();
  console.log('✅ تمت إضافة الحقول لجميع المستخدمين الحاليين.');
}

addAdFieldsToAllUsers().catch(console.error);
