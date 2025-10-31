// 📁 seedInitialTransactions.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedTransactions() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    const transactionsRef = db.collection('users').doc(userId).collection('transactions');

    if (userData.balance && userData.balance > 0) {
      await transactionsRef.add({
        type: 'initial_balance',
        amount: userData.balance,
        description: 'Imported initial balance',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added initial balance transaction for [${userId}]`);
    }

    if (userData.lockedFromStaking && userData.lockedFromStaking > 0) {
      await transactionsRef.add({
        type: 'staking_lock',
        amount: userData.lockedFromStaking,
        description: 'Imported staking lock',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added staking lock transaction for [${userId}]`);
    }

    if (userData.referralReward && userData.referralReward > 0) {
      await transactionsRef.add({
        type: 'referral_reward',
        amount: userData.referralReward,
        description: 'Imported referral reward',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added referral reward transaction for [${userId}]`);
    }
  }

  console.log('🎉 Finished seeding initial transactions.');
}

seedTransactions().catch((err) => {
  console.error('🔥 Error seeding transactions:', err);
});
