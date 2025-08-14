// 📁 src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);
const functions = getFunctions(app, 'us-central1');

// Use local emulator when in development
if (import.meta.env.DEV) {
  try {
    // Uncomment the next line when running Firebase emulator
    // import { connectFunctionsEmulator } from 'firebase/functions';
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Development environment detected. CORS issues with Cloud Functions may occur.');
    console.log('To use local emulator, uncomment the connectFunctionsEmulator line.');
  } catch (error) {
    console.error('Failed to connect to functions emulator:', error);
  }
}

const storage = getStorage(app); // ✅ بدون تحديد bucket يدويًا

const messagingPromise = Promise.resolve(messaging);

export { app, auth, db, functions, messaging, messagingPromise, storage };
