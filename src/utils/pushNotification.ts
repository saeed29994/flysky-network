// 📁 src/utils/pushNotification.ts

import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ✅ طلب الإذن وحفظ التوكن مع بيانات إضافية
export const requestPermissionAndToken = async (uid: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('🔒 Notification permission not granted');
      return;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });

    console.log('📱 Device Info:', {
      userAgent: navigator.userAgent,
      token,
      permission: Notification.permission,
    });

    if (token) {
      await setDoc(doc(db, 'userTokens', uid), {
        token,
        userAgent: navigator.userAgent,
        permission: Notification.permission,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Token saved to Firestore');
    } else {
      console.warn('⚠️ No FCM token retrieved');
    }
  } catch (error: any) {
    console.error('❌ Error requesting token:', error?.message || error);
  }
};

// ✅ حذف التوكن من المتصفح
export const deleteCurrentToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      await deleteToken(messaging);
      console.log('🗑️ Token deleted from browser');
    }
  } catch (error) {
    console.error('❌ Error deleting token:', error);
  }
};

// ✅ استقبال الإشعارات أثناء فتح التطبيق
export const listenToForegroundMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('📥 Foreground FCM message:', payload);
  });
};
