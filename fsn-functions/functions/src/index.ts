import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v2 } from "@google-cloud/translate";
import { translateText } from "./utils/translateText";

// Import notification functions
import { notifyMiningComplete } from "./notifications/notifyMiningComplete";
import { notifyNewMessage } from "./notifications/notifyNewMessage";
import { notifyReferralBonus } from "./notifications/notifyReferralBonus";
import { sendDailyReminders } from "./notifications/sendPeriodicReminders";

// process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + "/../flysky-site-3daa1e4343c4.json";

if (!admin.apps.length) {
  admin.initializeApp();
}

const translate = new v2.Translate();

const allowedOrigins = [
  "http://localhost:5173", // Local development server
  "http://localhost:3000", // Another common local port
  "https://fsncrew.io",
  "https://www.fsncrew.io"
];

// Export existing functions
export const translateFunction = functions.https.onRequest(
  async (req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Credentials", "true");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { text, targetLang } = req.body;
      if (!text || !targetLang) {
        res.status(400).json({ error: "Missing text or targetLang" });
        return;
      }

      const translated = await translateText(text, targetLang);
      res.status(200).json({ translation: translated });
    } catch (error) {
      console.error("🔥 Translation Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export const sendPushNotification = functions.https.onRequest(
  async (req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Credentials", "true");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

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
  }
);

// Configure functions for proper CORS and region
const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '256MB',
  cors: true
};

// Export notification functions with configuration
export { 
  notifyMiningComplete, 
  notifyNewMessage, 
  notifyReferralBonus, 
  sendDailyReminders
};
