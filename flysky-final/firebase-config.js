// 📁 firebase-config.js
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
  authDomain: "flysky-site.firebaseapp.com",
  projectId: "flysky-site",
  storageBucket: "flysky-site.firebasestorage.app",
  messagingSenderId: "3676998780",
  appId: "1:3676998780:web:7660a9ff69960163550df9"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };
