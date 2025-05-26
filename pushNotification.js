// 📁 pushNotification.js
import { messaging } from './firebase-config';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase'; // تأكد أن لديك db مُعد من Firebase Firestore

const vapidKey = 'BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rtYj8r8rnI3YEPeJs9OAAV-fpzZYT6siymHDj6rWhyDNl0';

// ✅ طلب إذن المستخدم للإشعارات + جلب التوكن
export const requestNotificationPermission = async (uid) => {
  try {
    const token = await getToken(messaging, { vapidKey });
    console.log('✅ Notification token:', token);

    if (token && uid) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      });
    }
  } catch (err) {
    console.error('❌ Failed to get token:', err);
  }
};

// ✅ الاستماع للإشعارات أثناء استخدام التطبيق (Foreground only)
export const listenToForegroundMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('🔔 New message received:', payload);
    alert(`${payload.notification.title}\n${payload.notification.body}`);
  });
};
