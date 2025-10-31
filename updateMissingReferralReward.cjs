// 📁 updateMissingReferralReward.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateUsers() {
  console.log('🔍 Starting to check users...');

  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();

    if (userData.referralReward === undefined) {
      await db.collection('users').doc(doc.id).update({
        referralReward: 0,
      });
      console.log(`✅ Updated user [${doc.id}] → set referralReward = 0`);
    } else {
      console.log(`ℹ️ User [${doc.id}] already has referralReward: ${userData.referralReward}`);
    }
  }

  console.log('🎉 Finished updating missing referralReward fields.');
}

updateUsers().catch((err) => {
  console.error('🔥 Error updating users:', err);
});
