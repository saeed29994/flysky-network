import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v2 } from "@google-cloud/translate";

if (!admin.apps.length) {
  admin.initializeApp();
}

const translate = new v2.Translate();

// ✅ دالة مساعدة لإرسال الإشعار (تُستخدم داخل باقي الـ Cloud Functions)
export const sendFCM = async (
  userId: string,
  title: string,
  body: string
): Promise<void> => {
  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const lang = userDoc.exists && userDoc.data()?.language ? userDoc.data()!.language : "ar";

    const tokenDoc = await admin.firestore().collection("userTokens").doc(userId).get();
    if (!tokenDoc.exists || !tokenDoc.data()?.token) return;

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
      token,
    };

    await admin.messaging().send(message);
    console.log("✅ FCM sent to", userId);
  } catch (error) {
    console.error("❌ Error sending FCM:", error);
  }
};

// ✅ دالة HTTP لاستدعائها عبر رابط مباشر (POST)
export const sendPushNotification = functions.https.onRequest(async (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    res.status(400).json({ success: false, message: "Missing required fields." });
    return;
  }

  try {
    await sendFCM(userId, title, body);
    res.status(200).json({ success: true, message: "Notification sent successfully" });
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});
