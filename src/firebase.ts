// src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

// ✅ إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
  authDomain: "flysky-site.firebaseapp.com",
  projectId: "flysky-site",
  storageBucket: "flysky-site.appspot.com",
  messagingSenderId: "3676998780",
  appId: "1:3676998780:web:7660a9ff69960163550df9",
  measurementId: "G-17PESJ4RBQ",
};

// ✅ تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// ✅ الخدمات المختلفة
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

// ✅ تهيئة Firebase Messaging بشرط دعم المتصفح
let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');
    } else {
      console.warn('⚠️ Firebase Messaging not supported on this browser.');
    }
  });
}

// ✅ تصدير Messaging بطريقة مرنة
export { messaging, app };
