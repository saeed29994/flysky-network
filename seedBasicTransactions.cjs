// 📁 seedBasicTransactions.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedTransactionsIfMissing() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();

    const transactions = userData.transactionHistory || [];

    if (transactions.length === 0) {
      const newTransaction = {
        description: 'Initial balance record',
        timestamp: Date.now(),
      };

      await db.collection('users').doc(userId).update({
        transactionHistory: [newTransaction],
      });

      console.log(`✅ Added initial transaction for user [${userId}]`);
    } else {
      console.log(`ℹ️ User [${userId}] already has transactions, skipping.`);
    }
  }

  console.log('🎉 Finished seeding initial transactions.');
}

seedTransactionsIfMissing().catch((err) => {
  console.error('🔥 Error while seeding transactions:', err);
});
