const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// === Auto Staking Function موجود عندك هنا ✅
exports.autoMonthlyEconomyStaking = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const today = new Date();
  if (today.getDate() !== 30) {
    console.log("⏳ Not the 30th. Skipping.");
    return null;
  }

  console.log("🚀 Running Auto-Staking for Economy users on 30th");
  const usersSnapshot = await db.collection('users').where('plan', '==', 'economy').get();
  const now = admin.firestore.Timestamp.now();
  const sixMonthsLater = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000));

  const batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userRef = userDoc.ref;
    const uid = userDoc.id;
    const balance = userData.balance || 0;
    const stakeAmount = Math.floor(balance * 0.3);

    if (stakeAmount <= 0) continue;

    const stakingRef = db.collection('users').doc(uid).collection('staking').doc();
    const expectedReturn = parseFloat((stakeAmount * 1.05).toFixed(2));

    batch.set(stakingRef, {
      amount: stakeAmount,
      duration: 6,
      planType: 'economy',
      startDate: now,
      endDate: sixMonthsLater,
      expectedReturn,
      status: 'active',
      claimed: false,
      mandatory: true
    });

    batch.update(userRef, {
      balance: balance - stakeAmount
    });

    console.log(`✅ Processed user ${uid} - Staked ${stakeAmount} FSN`);
  }

  await batch.commit();
  console.log("🎉 Auto-staking completed.");
  return null;
});

// === ✅ هنا نضيف الكلاود فانكشن الجديدة لإرسال الإشعارات
exports.sendNotification = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { title, body, tokens } = req.body;

    if (!title || !body || !tokens || !Array.isArray(tokens)) {
      return res.status(400).send('Invalid request');
    }

    const message = {
      notification: { title, body },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      return res.status(200).send(`Successfully sent to ${response.successCount} devices.`);
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).send('Error sending notification');
    }
  });
});
