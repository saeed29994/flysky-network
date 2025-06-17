// 📁 fsn-functions/src/index.ts

import { onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// ✅ تهيئة Firebase Admin SDK
initializeApp();

// ✅ Cloud Function: إرسال إشعار FCM إلى مستخدم واحد
export const sendPushNotification = onCall(async (request) => {
  const { token, title, body, imageUrl, clickAction } = request.data; // ← تأكد من استخدام .data

  // ✅ تحقق من الحقول المطلوبة
  if (!token || !title || !body) {
    throw new Error('Missing required fields: token, title, body');
  }

  // ✅ إعداد الرسالة
  const message = {
    token,
    notification: {
      title,
      body,
      image: imageUrl || undefined,
    },
    webpush: {
      fcmOptions: {
        link: clickAction || 'https://fsncrew.io/dashboard',
      },
      notification: {
        icon: 'https://fsncrew.io/fsn-logo.png',
        click_action: clickAction || 'https://fsncrew.io/dashboard',
      },
    },
  };

  try {
    const response = await getMessaging().send(message);
    console.log('✅ Notification sent:', response);
    return { success: true, id: response };
  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error);
    throw new Error('FCM notification failed');
  }
});
