// sendFCM.cjs
const admin = require('firebase-admin');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

async function sendNotificationToAllUsers() {
  try {
    const snapshot = await db.collection('userTokens').get();
    const tokens = snapshot.docs.map(doc => doc.data().token).filter(Boolean);

    if (tokens.length === 0) {
      console.log('🚫 لا توجد توكنات لإرسال الإشعار.');
      return;
    }

    const message = {
      notification: {
        title: '🎉 إشعار جديد',
        body: 'تم تفعيل نظام الإشعارات بنجاح!',
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`📨 تم الإرسال إلى ${response.responses.length} جهاز:`);
    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        console.log(`✅ ${tokens[idx]}`);
      } else {
        console.error(`❌ ${tokens[idx]}: ${resp.error.message}`);
      }
    });
  } catch (error) {
    console.error('❌ خطأ أثناء الإرسال:', error);
  }
}

sendNotificationToAllUsers();
