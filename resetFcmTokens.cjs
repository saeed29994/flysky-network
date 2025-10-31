// resetFcmTokens.cjs
const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("./serviceAccountKey.json"); // ضع ملف الخدمة هنا

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetFcmTokens() {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  for (const doc of snapshot.docs) {
    const userId = doc.id;

    try {
      // 1. حذف حقل fcmTokens أو إعادة تعيينه كمصفوفة فارغة
      await db.collection("users").doc(userId).update({
        fcmTokens: [],
      });

      console.log(`✅ تم مسح التوكنات القديمة للمستخدم: ${userId}`);
    } catch (error) {
      console.error(`❌ فشل مع المستخدم ${userId}:`, error.message);
    }
  }

  console.log("🎯 تم مسح جميع التوكنات بنجاح. يمكنك الآن تحديثها من داخل التطبيق.");
}

resetFcmTokens();
