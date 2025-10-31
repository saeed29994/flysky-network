const admin = require('firebase-admin');
const fs = require('fs');

// تحميل إعدادات الخدمة (Service Account)
const serviceAccount = require('./serviceAccountKey.json');

// تهيئة Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No users found.');
    return;
  }

  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updates = {};

    if (data.miningEarnings === undefined) updates.miningEarnings = 0;
    if (data.referralEarnings === undefined) updates.referralEarnings = data.referralReward ?? 0;
    if (data.stakingEarnings === undefined) updates.stakingEarnings = 0;

    if (Object.keys(updates).length > 0) {
      await docSnap.ref.update(updates);
      console.log(`✅ Updated: ${docSnap.id}`, updates);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Done. Updated ${updatedCount} user(s).`);
}

updateUsers().catch(console.error);
