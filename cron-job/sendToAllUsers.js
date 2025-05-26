// 📁 sendToAllUsers.js
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const MAX_MINED_BY_PLAN = {
  economy: 600,     // نصف القيمة السابقة
  business: 3000,
  first: 6000
};

async function sendToUsersWithFullMining() {
  const snapshot = await db.collection('users').get();
  const now = Date.now();
  const hours12 = 12 * 60 * 60 * 1000;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const tokens = data.fcmTokens || [];
    const plan = data.plan || 'economy';
    const mined = data.dailyMined || 0;
    const lastStart = data.miningStartTime?.toDate?.() || new Date(0);
    const claimed = mined === 0; // اعتبر أن المستخدم قام بـ Claim إذا تم تصفير dailyMined
    const timePassed = now - lastStart.getTime();

    if ((mined >= MAX_MINED_BY_PLAN[plan] || timePassed >= hours12) && !claimed) {
      for (const token of tokens) {
        const message = {
          token,
          notification: {
            title: '⛏️ Mining Ready!',
            body: 'Your mining session has completed. Don’t forget to claim your FSN!'
          },
          webpush: {
            notification: {
              icon: 'https://fsncrew.io/fsnicon.jpg'
            }
          }
        };

        try {
          const response = await admin.messaging().send(message);
          console.log(`✅ Mining alert sent to ${doc.id}:`, response);
        } catch (error) {
          console.error(`❌ Failed to send mining alert to ${doc.id}:`, error);
        }
      }
    }
  }
}

sendToUsersWithFullMining();
