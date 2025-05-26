const admin = require('firebase-admin');

// ✅ تأكد من وجود نفس ملف الخدمة
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetMiningFields() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  console.log(`🔍 Checking ${snapshot.size} users...`);

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const plan = data.membership?.planName || 'economy';

    const shouldReset =
      plan !== 'economy' &&
      (data.dailyMined === undefined || data.miningStartTime === undefined);

    if (shouldReset) {
      await doc.ref.update({
        dailyMined: 0,
        miningStartTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`🔁 Reset mining fields for ${doc.id} (plan: ${plan})`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Finished. Mining fields reset for ${updatedCount} users.`);
}

resetMiningFields().catch((err) => {
  console.error('❌ Error resetting mining fields:', err);
});
