const admin = require('firebase-admin');
const path = require('path');

// تحميل بيانات اعتماد الخدمة يدويًا
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

const run = async () => {
  const userEmail = 's11053647@gmail.com';
  const userSnapshot = await db.collection('users').where('email', '==', userEmail).get();

  if (userSnapshot.empty) {
    console.log('❌ لم يتم العثور على المستخدم.');
    return;
  }

  const userDoc = userSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  const tokens = userData.fcmTokens || [];
  if (tokens.length === 0) {
    console.log('⚠️ لا يوجد FCM tokens لهذا المستخدم.');
  } else {
    const message = {
      notification: {
        title: 'Referral Reward Unlocked 🎉',
        body: 'You’ve received a new reward from a verified referral. Claim it now!',
      },
      tokens,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      console.log(`📤 تم إرسال الإشعار إلى ${response.successCount} من ${tokens.length} أجهزة.`);
    } catch (err) {
      console.error('❌ فشل إرسال الإشعار:', err);
    }
  }

  // أضف رسالة إلى البريد الداخلي
  const inboxRef = db.collection('inbox').doc();
  await inboxRef.set({
    userId,
    title: '🎉 New Referral Bonus',
    body: 'You’ve just earned a reward from one of your referrals! Visit the referral section to claim your bonus.',
    read: false,
    claimed: false,
    timestamp: Date.now(),
    type: 'referral-bonus'
  });

  console.log('📩 تم إرسال رسالة إلى البريد الداخلي للمستخدم.');
};

run();
