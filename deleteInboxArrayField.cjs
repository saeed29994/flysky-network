
// deleteInboxArrayField.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود الملف

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const deleteInboxArrayFromUsers = async () => {
  const usersSnap = await db.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const data = userDoc.data();

    if (data.inbox && Array.isArray(data.inbox)) {
      await db.collection('users').doc(userId).update({
        inbox: admin.firestore.FieldValue.delete()
      });
      console.log(`🗑️ Deleted 'inbox' array from user ${userId}`);
    } else {
      console.log(`⏭️ No 'inbox' array for user ${userId}`);
    }
  }

  console.log('✅ Finished deleting all inbox arrays.');
};

deleteInboxArrayFromUsers().catch((error) => {
  console.error('❌ Error deleting inbox arrays:', error);
});
