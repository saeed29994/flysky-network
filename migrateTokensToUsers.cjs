// migrateTokensToUsers.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // ← تأكد من وضع مسار ملف الخدمة الصحيح

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateTokens() {
  const userTokensSnapshot = await db.collection('userTokens').get();

  for (const doc of userTokensSnapshot.docs) {
    const token = doc.data().token;
    const uid = doc.id;

    if (!token) continue;

    try {
      const userRef = db.collection('users').doc(uid);
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      });

      console.log(`✅ Token migrated for UID: ${uid}`);
    } catch (err) {
      console.error(`❌ Failed for UID: ${uid}`, err.message);
    }
  }

  console.log('✅ Migration complete');
}

migrateTokens();
