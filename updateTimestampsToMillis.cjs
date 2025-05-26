// 📁 updateTimestampsToMillis.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateTimestamps() {
  const usersSnapshot = await db.collection('users').get();

  for (const docSnap of usersSnapshot.docs) {
    const userData = docSnap.data();
    const transactions = userData.transactionHistory || [];

    const updatedTransactions = transactions.map(tx => {
      if (tx.timestamp && typeof tx.timestamp.toMillis === 'function') {
        return { ...tx, timestamp: tx.timestamp.toMillis() };
      } else if (tx.timestamp && typeof tx.timestamp === 'object' && tx.timestamp._seconds) {
        return { ...tx, timestamp: tx.timestamp._seconds * 1000 };
      }
      return tx;
    });

    await db.collection('users').doc(docSnap.id).update({
      transactionHistory: updatedTransactions,
    });

    console.log(`✅ Updated timestamps for user [${docSnap.id}]`);
  }

  console.log('🎉 Finished updating all timestamps.');
}

updateTimestamps().catch(err => {
  console.error('🔥 Error updating timestamps:', err);
});
