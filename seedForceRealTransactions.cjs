// 📁 seedForceRealTransactions.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedForceRealTransactions() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const data = doc.data();
    const transactions = data.transactionHistory || [];
    const newTransactions = [];

    if (data.balance !== undefined) {
      newTransactions.push({
        description: `Current balance: ${data.balance} FSN`,
        timestamp: Date.now(),
      });
    }
    if (data.lockedFromStaking !== undefined) {
      newTransactions.push({
        description: `Current staking lock: ${data.lockedFromStaking} FSN`,
        timestamp: Date.now(),
      });
    }
    if (data.referralReward !== undefined) {
      newTransactions.push({
        description: `Current referral reward: ${data.referralReward} FSN`,
        timestamp: Date.now(),
      });
    }

    if (newTransactions.length > 0) {
      await db.collection('users').doc(userId).update({
        transactionHistory: [...transactions, ...newTransactions],
      });
      console.log(`✅ Forced real transactions added for user [${userId}]`);
    } else {
      console.log(`ℹ️ No relevant fields found for user [${userId}]`);
    }
  }

  console.log('🎉 Finished forcing real transactions.');
}

seedForceRealTransactions().catch((err) => {
  console.error('🔥 Error forcing real transactions:', err);
});
