import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v2 } from "@google-cloud/translate";

// ✅ تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ تهيئة مترجم Google
const translate = new v2.Translate();

// ✅ دالة إرسال الإشعارات بدون runWith()
export const sendPushNotification = functions.https.onRequest(async (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    res.status(400).json({ success: false, message: "Missing required fields." });
    return;
  }

  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const lang = userDoc.exists && userDoc.data()?.language ? userDoc.data()!.language : "ar";

    const tokenDoc = await admin.firestore().collection("userTokens").doc(userId).get();
    if (!tokenDoc.exists || !tokenDoc.data()?.token) {
      res.status(404).json({ success: false, message: "FCM token not found for user." });
      return;
    }

    const token = tokenDoc.data()!.token;

    let translatedTitle = title;
    let translatedBody = body;

    try {
      [translatedTitle] = await translate.translate(title, lang);
      [translatedBody] = await translate.translate(body, lang);
    } catch (translationError: any) {
      console.warn("⚠️ Failed to translate:", translationError.message);
    }

    const message = {
      notification: {
        title: translatedTitle,
        body: translatedBody,
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    res.status(200).json({ success: true, message: "Notification sent successfully" });
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);

    if (error.errorInfo?.code === 'messaging/registration-token-not-registered') {
      await admin.firestore().collection("userTokens").doc(userId).delete();
      console.log("🚫 تم حذف التوكن غير الصالح.");
    }

    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});
