import { getToken } from 'firebase/messaging';
import { messaging, auth, db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

const VAPID_KEY = 'BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rtYj8r8rnI3YEPeJs9OAAV-fpzZYT6siymHDj6rWhyDNl0';

export const saveUserToken = async () => {
  try {
    // ✅ طلب إذن الإشعارات من المستخدم
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⛔ Notification permission not granted.');
      return;
    }

    // ✅ تسجيل Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered:', registration);

    // ✅ جلب FCM Token
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

    // ✅ حفظ التوكن في userTokens/{uid}
    const tokenRef = doc(db, 'userTokens', user.uid);
    const tokenSnap = await getDoc(tokenRef);

    const savedToken = tokenSnap.exists() ? tokenSnap.data().token : null;
    if (savedToken === token) {
      console.log('ℹ️ Token already saved in userTokens.');
    } else {
      await setDoc(tokenRef, { token });
      console.log('✅ Token saved to userTokens.');
    }

    // ✅ إضافة التوكن إلى مصفوفة fcmTokens داخل users/{uid}
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, { fcmTokens: [token] });
      console.log('✅ Created user document with fcmTokens.');
    } else {
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
      console.log('✅ Token added to fcmTokens array in users.');
    }

  } catch (error) {
    console.error('🔥 Error during FCM setup:', error);
  }
};
