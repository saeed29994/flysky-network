import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { translateText } from "../utils/translateText";

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();

// Create the onCall function with CORS support
export const notifyMiningComplete = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User not authenticated.");
  }

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const user = userSnap.data();

  if (!user) {
    throw new functions.https.HttpsError("not-found", "User not found.");
  }

  const fcmTokens: string[] = user.fcmTokens || [];
  const lang: string = user.language || "en";

  const defaultTitle = "⛏️ Mining Complete!";
  const defaultBody = "You can now claim your FSN reward. Open the app to claim it.";

  // ✅ ترجمة النصوص إذا كانت اللغة غير الإنجليزية
  const translatedTitle =
    lang === "en" ? defaultTitle : await translateText(defaultTitle, lang);
  const translatedBody =
    lang === "en" ? defaultBody : await translateText(defaultBody, lang);

  const messaging = admin.messaging();

  // ✅ إرسال إشعار FCM لكل توكن
  for (const token of fcmTokens) {
    await messaging
      .send({
        token,
        notification: {
          title: translatedTitle,
          body: translatedBody,
        },
        webpush: {
          fcmOptions: {
            link: "https://fsncrew.io/dashboard",
          },
        },
      })
      .catch((err) => {
        console.error("🔥 FCM send error", token, err.message);
      });
  }

  // ✅ إضافة رسالة إلى صندوق البريد الداخلي
  await db.collection("inbox").add({
    userId: uid,
    title: translatedTitle,
    body: translatedBody,
    read: false,
    claimed: false,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    type: "mining",
  });

  // Add to the user's notifications collection
  await db.collection("users").doc(uid).collection("notifications").add({
    type: "claim_reward",
    title: translatedTitle,
    body: translatedBody,
    read: false,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    link: "/mining", // Link to mining page
  });

  return { success: true };
}); 