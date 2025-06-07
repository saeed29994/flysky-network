// 📁 src/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
  authDomain: "flysky-site.firebaseapp.com",
  projectId: "flysky-site",
  storageBucket: "flysky-site.appspot.com", // ✅ تصحيح هنا
  messagingSenderId: "3676998780",
  appId: "1:3676998780:web:7660a9ff69960163550df9",
  measurementId: "G-17PESJ4RBQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

// ✅ تهيئة Messaging باستخدام Promise لضمان الترتيب
export const messagingPromise = (async () => {
  const supported = await isSupported();
  if (supported) {
    console.log("✅ Firebase Messaging initialized");
    return getMessaging(app);
  } else {
    console.warn("⚠️ Firebase Messaging not supported");
    return null;
  }
})();

export { app };
