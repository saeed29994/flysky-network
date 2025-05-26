const admin = require('firebase-admin');

// ✅ تأكد من أن ملف الخدمة الخاص بك موجود بنفس المجلد
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateMembershipPlans() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  console.log(`🔍 Checking ${snapshot.size} users...`);

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // إذا كان يحتوي على membership.planName لا حاجة للتحديث
    if (data.membership?.planName) continue;

    let detectedPlan =
      data.plan || data.userPlan || 'economy'; // تحقق من الحقول البديلة

    // التحقق من كون الخطة صالحة
    const validPlans = ['economy', 'business', 'first-6', 'first-lifetime'];
    if (!validPlans.includes(detectedPlan)) {
      detectedPlan = 'economy';
    }

    await doc.ref.update({
      membership: {
        planName: detectedPlan,
      },
    });

    console.log(`✅ Updated ${doc.id} → ${detectedPlan}`);
    updatedCount++;
  }

  console.log(`\n🎉 Finished. Total updated: ${updatedCount}`);
}

updateMembershipPlans().catch((err) => {
  console.error('❌ Error updating plans:', err);
});
