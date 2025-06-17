// 📁 fsn-functions/src/index.ts

import { onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// ✅ تهيئة Firebase Admin SDK
initializeApp();

// ✅ Cloud Function: إرسال إشعار FCM إلى مستخدم واحد
export const sendFcmNotification = onCall(async (data) => {
  // ✅ طباعة البيانات المستلمة للتصحيح
  console.log('📥 Incoming raw data:', data);

  // ✅ تفكيك القيم من الكائن مباشرة
  const token = data.token;
  const title = data.title;
  const body = data.body;
  const imageUrl = data.imageUrl;
  const clickAction = data.clickAction;

  // ✅ التحقق من القيم المطلوبة
  if (!token || !title || !body) {
    throw new Error('Missing required fields: token, title, body');
  }

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
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error);
    throw new Error('FCM notification failed');
  }
});
