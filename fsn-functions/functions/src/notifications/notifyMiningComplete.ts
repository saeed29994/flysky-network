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

  // Get FCM tokens from multiple sources for better compatibility
  let fcmTokens: string[] = [];
  
  // First, try to get tokens from user document
  if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
    fcmTokens = [...user.fcmTokens];
    console.log(`Found ${fcmTokens.length} tokens in user document for user ${uid}`);
  }
  
  // If no tokens found in user document, try userTokens collection
  if (fcmTokens.length === 0) {
    try {
      const tokenDoc = await db.collection("userTokens").doc(uid).get();
      if (tokenDoc.exists && tokenDoc.data()?.token) {
        fcmTokens = [tokenDoc.data()!.token];
        console.log(`Found token in userTokens collection for user ${uid}`);
      }
    } catch (error) {
      console.warn(`Error checking userTokens collection for user ${uid}:`, error);
    }
  }

  const lang: string = user.language || "en";

  const defaultTitle = "⛏️ Mining Complete!";
  const defaultBody = "You can now claim your FSN reward. Open the app to claim it.";

  // ✅ ترجمة النصوص إذا كانت اللغة غير الإنجليزية
  const translatedTitle =
    lang === "en" ? defaultTitle : await translateText(defaultTitle, lang);
  const translatedBody =
    lang === "en" ? defaultBody : await translateText(defaultBody, lang);

  const messaging = admin.messaging();
  let successCount = 0;
  let errorCount = 0;

  // ✅ إرسال إشعار FCM لكل توكن
  for (const token of fcmTokens) {
    try {
      await messaging.send({
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
      });
      successCount++;
      console.log(`✅ FCM notification sent successfully to token for user ${uid}`);
    } catch (err: any) {
      errorCount++;
      console.error(`❌ Failed to send FCM notification to token for user ${uid}:`, err);
      
      // Remove invalid tokens
      if (err.code === 'messaging/registration-token-not-registered') {
        try {
          // Remove from user document if it exists there
          if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
            await db.collection("users").doc(uid).update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
            });
            console.log(`🗑️ Removed invalid token from user document for user ${uid}`);
          }
          
          // Remove from userTokens collection if it exists there
          const tokenDoc = await db.collection("userTokens").doc(uid).get();
          if (tokenDoc.exists && tokenDoc.data()?.token === token) {
            await db.collection("userTokens").doc(uid).delete();
            console.log(`🗑️ Removed invalid token from userTokens collection for user ${uid}`);
          }
        } catch (cleanupError) {
          console.error(`❌ Error cleaning up invalid token for user ${uid}:`, cleanupError);
        }
      }
    }
  }

  console.log(`✅ Mining notification processing complete for user ${uid}: ${successCount} successful, ${errorCount} failed`);

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