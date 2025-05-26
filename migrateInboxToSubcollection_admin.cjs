
// migrateInboxToSubcollection_admin.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود هذا الملف في نفس المجلد

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const migrateInbox = async () => {
  const usersSnap = await db.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const inboxArray = userData.inbox;

    if (!Array.isArray(inboxArray)) {
      console.log(`⏭️ No inbox array for user ${userId}`);
      continue;
    }

    console.log(`🔄 Migrating inbox for user: ${userId}`);

    const batch = db.batch();

    inboxArray.forEach((msg, index) => {
      const msgRef = db.doc(`users/${userId}/inbox/msg_${index + 1}`);
      batch.set(msgRef, {
        ...msg,
        archived: msg.archived || false,
        deleted: msg.deleted || false,
      });
    });

    const userRef = db.doc(`users/${userId}`);
    batch.update(userRef, { inbox: admin.firestore.FieldValue.delete() });

    await batch.commit();
    console.log(`✅ Migration complete for ${userId}`);
  }
};

migrateInbox()
  .then(() => {
    console.log('🎉 All users migrated successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
