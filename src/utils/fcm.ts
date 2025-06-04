import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

// ضع هنا مفتاح VAPID الخاص بك من Firebase Console → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BKhpE...اكتب مفتاحك هنا...ZTx1U';

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('🔕 Notification permission not granted');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('✅ FCM Token:', token);
    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

// استقبال الإشعارات في المقدمة (foreground)
export const listenToForegroundMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('🔔 Foreground notification received:', payload);

    const { title, body } = payload.notification || {};
    if (title || body) {
      new Notification(title || '📬 إشعار جديد', {
        body: body || '',
        icon: '/logo.png', // 🔁 غيّر هذا إذا أردت أيقونة مخصصة
      });
    }
  });
};
