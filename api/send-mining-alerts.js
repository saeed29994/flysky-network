// 📁 api/send-mining-alerts.js
import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json'); // عدّل المسار إذا كان ملف الخدمة خارج المجلد الجذري

// ✅ تهيئة Firebase Admin عند أول تشغيل فقط
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const MAX_MINED_BY_PLAN = {
  economy: 600,
  business: 3000,
  first: 6000,
};

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection('users').get();
    const now = Date.now();
    const hours12 = 12 * 60 * 60 * 1000;
    let sentCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const tokens = data.fcmTokens || [];
      const plan = data.plan || 'economy';
      const mined = data.dailyMined || 0;
      const lastStart = data.miningStartTime?.toDate?.() || new Date(0);
      const claimed = mined === 0;
      const timePassed = now - lastStart.getTime();

      if ((mined >= MAX_MINED_BY_PLAN[plan] || timePassed >= hours12) && !claimed) {
        for (const token of tokens) {
          const message = {
            token,
            notification: {
              title: '⛏️ Mining Ready!',
              body: 'Your mining session has completed. Don’t forget to claim your FSN!',
            },
            webpush: {
              notification: {
                icon: 'https://fsncrew.io/fsn-logo.png'
              },
            },
          };

          try {
            const response = await admin.messaging().send(message);
            console.log(`✅ Mining alert sent to ${doc.id}:`, response);
            sentCount++;
          } catch (error) {
            console.error(`❌ Failed to send mining alert to ${doc.id}:`, error);
          }
        }
      }
    }

    res.status(200).json({ message: 'Notifications sent', sentCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}
