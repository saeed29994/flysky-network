const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkFinalTransactions() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    const transactions = userData.transactionHistory || [];

    if (transactions.length === 0) {
      console.warn(`❌ No transactions for user [${userId}]`);
      continue;
    }

    console.log(`🧾 Transactions for user [${userId}]:`);
    transactions.forEach((tx, idx) => {
      const desc = tx.description || '❌ Missing description';
      const time = typeof tx.timestamp === 'number' ? new Date(tx.timestamp).toLocaleString() : '❌ Invalid or missing timestamp';
      console.log(`  ${idx + 1}. ${desc} — ${time}`);
    });
    console.log('-------------------------------------');
  }

  console.log('🎉 Finished final transaction check.');
}

checkFinalTransactions().catch((err) => {
  console.error('🔥 Error checking transactions:', err);
});
