// 📁 src/utils/pushNotification.ts

import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase-config';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const VAPID_KEY = 'BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rtYj8r8rnI3YEPeJs9OAAV-fpzZYT6siymHDj6rWhyDNl0';

export const saveUserToken = async () => {
  try {
    // ⛔️ تأكد من الإذن
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⛔ Notification permission not granted.');
      return;
    }

    // ✅ تسجيل Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered:', registration);

    // ✅ جلب التوكن من FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn('❌ No FCM token retrieved.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ No authenticated user. Token not saved.');
      return;
    }

    // ✅ التحقق مما إذا كان التوكن محفوظ مسبقًا
    const tokenRef = doc(db, 'userTokens', user.uid);
    const tokenSnap = await getDoc(tokenRef);

    const savedToken = tokenSnap.exists() ? tokenSnap.data().token : null;

    if (savedToken === token) {
      console.log('ℹ️ Token already saved. No update needed.');
    } else {
      await setDoc(tokenRef, { token });
      console.log('✅ FCM Token saved to Firestore.');
    }

  } catch (error) {
    console.error('🔥 Error during FCM setup:', error);
  }
};
