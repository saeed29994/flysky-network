const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkDetailedTransactions() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    const transactions = userData.transactionHistory || [];

    if (transactions.length === 0) {
      console.log(`❌ No transactions for user [${userId}]`);
      continue;
    }

    console.log(`\n🧾 Detailed transactions for user [${userId}]:`);
    transactions.forEach((tx, index) => {
      const rawTimestamp = tx.timestamp;
      let type = typeof rawTimestamp;
      let displayValue = rawTimestamp;

      if (rawTimestamp && rawTimestamp._seconds) {
        displayValue = rawTimestamp._seconds * 1000;
        type = 'Firestore.Timestamp (converted to ms)';
      } else if (typeof rawTimestamp === 'object') {
        displayValue = JSON.stringify(rawTimestamp);
      }

      console.log(`- Tx #${index + 1}`);
      console.log(`  Description: ${tx.description}`);
      console.log(`  Raw Timestamp:`, rawTimestamp);
      console.log(`  Type: ${type}`);
      console.log(`  Display (ms if possible): ${displayValue}`);
    });
  }

  console.log('\n🎉 Finished checking detailed transactions.');
}

checkDetailedTransactions().catch((err) => {
  console.error('🔥 Error:', err);
});
