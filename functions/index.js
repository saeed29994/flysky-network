const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Function لإرسال إشعار FCM باستخدام Firebase Admin SDK
exports.sendFcmNotification = functions.https.onCall(async (data, context) => {
  const { token, title, body } = data;

  if (!token || !title || !body) {
    throw new functions.https.HttpsError("invalid-argument", "Missing token, title, or body");
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    android: {
      priority: "high",
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ FCM message sent:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Error sending FCM message:", error);
    throw new functions.https.HttpsError("internal", "Failed to send message", error);
  }
});
