// 📁 seedRealTransactions.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedTransactions() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const userRef = db.collection('users').doc(doc.id);

    const newTransactions = [];

    // سجل staking
    if (userData.lockedFromStaking > 0) {
      newTransactions.push({
        description: `Locked ${userData.lockedFromStaking} FSN in staking`,
        timestamp: Date.now(),
      });
    }

    // سجل referral
    if (userData.referralReward > 0) {
      newTransactions.push({
        description: `Earned ${userData.referralReward} FSN from referrals`,
        timestamp: Date.now(),
      });
    }

    // سجل claim reward
    if (userData.dailyMined > 0) {
      newTransactions.push({
        description: `Claimed ${userData.dailyMined} FSN mining reward`,
        timestamp: Date.now(),
      });
    }

    if (newTransactions.length > 0) {
      await userRef.update({
        transactionHistory: admin.firestore.FieldValue.arrayUnion(...newTransactions),
      });
      console.log(`✅ Added real transactions for user [${doc.id}]`);
    } else {
      console.log(`ℹ️ No real transactions to add for user [${doc.id}]`);
    }
  }

  console.log('🎉 Finished adding real transactions.');
}

seedTransactions().catch((err) => {
  console.error('🔥 Error adding transactions:', err);
});
