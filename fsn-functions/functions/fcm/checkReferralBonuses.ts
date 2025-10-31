import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v2 } from "@google-cloud/translate";

// ✅ تهيئة Firebase Admin و Google Translate
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const translate = new v2.Translate();

// ✅ المسار إلى مفتاح الخدمة (يجب تعديله حسب موقع ملفك الحقيقي)
process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + "/../serviceAccountKey.json";

export const checkReferralBonuses = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    const beforeVerified = (beforeData.referralList || []).filter((r: any) => r.status === "Verified").length;
    const afterVerified = (afterData.referralList || []).filter((r: any) => r.status === "Verified").length;

    // ✅ تحقق من وجود إحالة مفعّلة جديدة
    if (afterVerified > beforeVerified) {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      const user = userSnap.data();

      const fcmTokens = user?.fcmTokens || [];
      const lang = user?.language || "ar";
      const reward = afterVerified < 10 ? 100 : afterVerified < 20 ? 200 : 300;

      // ✅ نصوص أصلية بالإنجليزية
      const title = "🎉 New Referral!";
      const body = `A new referral was verified. You'll earn ${reward} FSN once you claim it.`;

      let translatedTitle = title;
      let translatedBody = body;

      // ✅ محاولة الترجمة حسب لغة المستخدم
      try {
        [translatedTitle] = await translate.translate(title, lang);
        [translatedBody] = await translate.translate(body, lang);
      } catch (err: any) {
        console.warn("⚠️ Failed to translate FCM message:", err.message);
      }

      // ✅ إضافة الرسالة إلى البريد
      await db.collection("inbox").add({
        userId,
        title: translatedTitle,
        body: translatedBody,
        read: false,
        claimed: false,
        timestamp: Date.now(),
      });

      const messaging = admin.messaging();
      const message = {
        notification: {
          title: translatedTitle,
          body: translatedBody,
        },
        webpush: {
          fcmOptions: {
            link: "https://fsncrew.io/referral",
          },
        },
      };

      // ✅ إرسال الإشعار لجميع التوكنات
      for (const token of fcmTokens) {
        try {
          await messaging.send({ ...message, token });
        } catch (err: any) {
          console.error("❌ FCM error:", err.message);
          if (err.code === 'messaging/registration-token-not-registered') {
            await userRef.update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
            });
            console.log("🚫 Removed invalid token:", token);
          }
        }
      }
    }
  });
