import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ✅ إعداد Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// ✅ طلب الإذن وحفظ التوكن
export const requestPermissionAndToken = async (uid: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('🔒 Notification permission not granted');
      return;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    console.log('📦 Loaded VAPID KEY:', vapidKey);

    if (typeof vapidKey !== 'string') {
      console.error('🚫 VAPID key is not a string:', typeof vapidKey, vapidKey);
      return;
    }

    if (!vapidKey) {
      console.error('🚫 VAPID key is missing (empty)');
      return;
    }

    if (vapidKey.indexOf('BCN7') === -1) {
      console.error('🚫 VAPID key seems invalid format:', vapidKey);
      return;
    }

    const token = await getToken(messaging, {
      vapidKey,
    });

    if (token) {
      console.log('✅ FCM Token:', token);
      await setDoc(doc(db, 'userTokens', uid), {
        token,
        updatedAt: serverTimestamp(),
      });
    } else {
      console.warn('⚠️ Failed to retrieve FCM token');
    }
  } catch (error: any) {
    console.error('❌ Error getting permission or token:', error?.message || error);
  }
};

// ✅ استقبال إشعارات أثناء استخدام الموقع (Foreground)
export const listenToForegroundMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('📥 Foreground message received:', payload);
    // يمكنك هنا عرض toast أو modal حسب تصميمك
  });
};
