
// addReadFieldToInbox.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود هذا الملف

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const addReadFieldToInboxMessages = async () => {
  const usersSnap = await db.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const inboxSnap = await db.collection(`users/${userId}/inbox`).get();

    if (inboxSnap.empty) {
      console.log(`⏭️ No inbox messages for user ${userId}`);
      continue;
    }

    const batch = db.batch();
    inboxSnap.forEach((msgDoc) => {
      const msgData = msgDoc.data();
      if (typeof msgData.read === 'undefined') {
        const msgRef = msgDoc.ref;
        batch.update(msgRef, { read: false });
        console.log(`✅ Adding 'read: false' to ${userId}/inbox/${msgDoc.id}`);
      }
    });

    await batch.commit();
    console.log(`🔄 Done updating inbox for user ${userId}`);
  }

  console.log('🎉 All messages updated with read: false (if missing)');
};

addReadFieldToInboxMessages().catch((error) => {
  console.error('❌ Error updating inbox messages:', error);
});
