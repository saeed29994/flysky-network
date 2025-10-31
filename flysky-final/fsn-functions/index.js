const functions = require('firebase-functions');
const admin = require('firebase-admin');

// تهيئة Firebase Admin SDK
admin.initializeApp();

// دالة لإرسال إشعار Push لمستخدم معين باستخدام FCM Token
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  const { title, body, token } = data;

  if (!token || !title || !body) {
    return { success: false, error: 'Missing required fields (token, title, body)' };
  }

  const message = {
    notification: {
      title,
      body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error: error.message };
  }
});
