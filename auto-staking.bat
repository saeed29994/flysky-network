// نسخة إنتاجية - سكربت استقطاع 30% من economy users يوم 30 من كل شهر فقط
import * as fs from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function autoStakingProduction() {
  const today = new Date();
  const is30th = today.getDate() === 30;

  if (!is30th) {
    console.log("⏳ Today is not the 30th. Exiting without changes.");
    return;
  }

  console.log("🚀 Running production auto-staking for economy users (only on 30th)...");

  const usersSnapshot = await db.collection('users').where('plan', '==', 'economy').get();
  const now = Timestamp.now();
  const sixMonthsLater = Timestamp.fromDate(new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userRef = userDoc.ref;
    const uid = userDoc.id;
    const balance = userData.balance || 0;
    const stakeAmount = Math.floor(balance * 0.3);

    if (stakeAmount <= 0) {
      console.log(`⚠️ Skipping ${uid}, insufficient balance.`);
      continue;
    }

    const stakingRef = db.collection('users').doc(uid).collection('staking').doc();
    const expectedReturn = parseFloat((stakeAmount * 1.05).toFixed(2));

    await db.runTransaction(async (t) => {
      t.set(stakingRef, {
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

      t.update(userRef, {
        balance: balance - stakeAmount
      });
    });

    console.log(`✅ Processed ${uid}: Staked ${stakeAmount} FSN with 5% return.`);
  }

  console.log("🎉 AUTO-STAKING COMPLETE: Operation finished.");
}

autoStakingProduction().catch(console.error);
