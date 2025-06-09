const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkTransactions() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const txSnapshot = await db.collection('users').doc(userId).collection('transactions').get();

    console.log(`\n🧾 Transactions for user [${userId}]:`);
    if (txSnapshot.empty) {
      console.log('❌ No transactions found.');
    } else {
      txSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- Description: ${data.description}`);
        console.log(`  Timestamp: ${data.timestamp}`);
      });
    }
  }

  console.log('\n🎉 Finished checking transactions.');
}

checkTransactions().catch(console.error);
