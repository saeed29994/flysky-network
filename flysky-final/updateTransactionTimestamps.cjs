// 📁 updateTransactionTimestamps.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateTransactionTimestamps() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const transactions = userData.transactionHistory || [];

    let updated = false;

    const updatedTransactions = transactions.map((tx) => {
      if (tx.timestamp && typeof tx.timestamp.toDate === 'function') {
        updated = true;
        return {
          ...tx,
          timestamp: tx.timestamp.toDate().getTime(), // convert to milliseconds
        };
      } else if (tx.timestamp && tx.timestamp._seconds) {
        updated = true;
        return {
          ...tx,
          timestamp: tx.timestamp._seconds * 1000, // convert Firestore Timestamp
        };
      }
      return tx;
    });

    if (updated) {
      await db.collection('users').doc(userId).update({
        transactionHistory: updatedTransactions,
      });
      console.log(`✅ Updated timestamps for user [${userId}]`);
    } else {
      console.log(`ℹ️ No timestamp update needed for user [${userId}]`);
    }
  }

  console.log('🎉 Finished updating all transaction timestamps.');
}

updateTransactionTimestamps().catch((err) => {
  console.error('🔥 Error updating transaction timestamps:', err);
});
