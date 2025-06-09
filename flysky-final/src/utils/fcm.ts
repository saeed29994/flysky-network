import { messagingPromise } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

const VAPID_KEY = 'BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rtYj8r8rnI3YEPeJs9OAAV-fpzZYT6siymHDj6rWhyDNl0';

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('🔕 Notification permission not granted');
      return null;
    }

    const messaging = await messagingPromise;
    if (!messaging) {
      console.warn('📴 Firebase messaging not available');
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

export const listenToForegroundMessages = async () => {
  const messaging = await messagingPromise;
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('🔔 Foreground notification received:', payload);

    const { title, body } = payload.notification || {};
    if (title || body) {
      new Notification(title || '📬 إشعار جديد', {
        body: body || '',
        icon: '/fsn-logo.png',
      });
    }
  });
};
