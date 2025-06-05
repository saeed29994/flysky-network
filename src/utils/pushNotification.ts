// 📁 src/utils/pushNotification.ts

import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

const VAPID_KEY = 'BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rtYj8r8rnI3YEPeJs9OAAV-fpzZYT6siymHDj6rWhyDNl0';

export const saveUserToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('🔕 Notification permission not granted');
      return;
    }

    if (!messaging) {
      console.warn('❗️ Firebase messaging is not available');
      return;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('✅ FCM Token:', token);

    // ✉️ يمكنك هنا إرسال التوكن إلى قاعدة البيانات Firestore إن أردت
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
  }
};

export const listenToForegroundMessages = () => {
  if (!messaging) {
    console.warn('❗️ Firebase messaging is not available');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('🔔 Foreground notification:', payload);

    const { title, body } = payload.notification || {};
    if (title || body) {
      new Notification(title || '📬 إشعار جديد', {
        body: body || '',
        icon: '/logo.png',
      });
    }
  });
};
