// 📁 src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
  authDomain: "flysky-site.firebaseapp.com",
  projectId: "flysky-site",
  storageBucket: "flysky-site.appspot.com",
  messagingSenderId: "3676998780",
  appId: "1:3676998780:web:7660a9ff69960163550df9",
  measurementId: "G-17PESJ4RBQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Analytics (اختياري)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isAnalyticsSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

// Messaging (بشكل آمن باستخدام Promise)
const messagingPromise = isMessagingSupported().then((supported) => {
  return supported ? getMessaging(app) : null;
});

export { app, auth, db, storage, functions, analytics, messagingPromise };
