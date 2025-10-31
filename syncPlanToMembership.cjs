const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const planMapping = {
  economy: 'economy',
  business: 'business',
  'first-6': 'first-6',
  first: 'first-lifetime', // ← تحويل "first" إلى الخطة المعتمدة
};

async function syncMembershipPlans() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const currentPlan = data.membership?.planName;
    const fallbackPlan = data.plan;

    // إذا كانت الخطة الحالية غير صحيحة أو غير متوافقة مع خطة user.plan
    if (!currentPlan || currentPlan === 'economy') {
      const normalizedPlan = planMapping[fallbackPlan] || 'economy';

      await doc.ref.update({
        membership: {
          planName: normalizedPlan,
        },
      });

      console.log(`✅ Updated ${doc.id}: plan → ${normalizedPlan}`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Finished. Total users updated: ${updatedCount}`);
}

syncMembershipPlans().catch((err) => {
  console.error('❌ Error syncing plans:', err);
});
