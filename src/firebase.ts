// 📁 src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Type definitions for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      getPlatform(): string;
    };
  }
}

// Platform detection utility
const getPlatform = (): 'web' | 'ios' | 'android' => {
  // Check if running in Capacitor (mobile app)
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor.getPlatform() as 'ios' | 'android';
  }
  // Default to web
  return 'web';
};

// Get platform-specific config
const getFirebaseConfig = () => {
  const platform = getPlatform();
  
  // Base configuration (same for all platforms)
  const baseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  };

  // Platform-specific app IDs
  const platformConfigs: Record<'web' | 'ios' | 'android', typeof baseConfig & { appId: string }> = {
    web: {
      ...baseConfig,
      appId: import.meta.env.VITE_FIREBASE_WEB_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
    },
    android: {
      ...baseConfig,
      appId: import.meta.env.VITE_FIREBASE_ANDROID_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
    },
    ios: {
      ...baseConfig,
      appId: import.meta.env.VITE_FIREBASE_IOS_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
    }
  };

  const config = platformConfigs[platform];
  
  // Log platform info in development
  if (import.meta.env.DEV) {
    console.log(`Firebase config for platform: ${platform}`, config);
  }
  
  return config;
};

// Initialize Firebase with platform-specific config
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);

// Messaging (web only - mobile uses native FCM)
let messaging: any = null;
let messagingPromise: Promise<any> = Promise.resolve(null);

if (getPlatform() === 'web') {
  try {
    messaging = getMessaging(app);
    messagingPromise = Promise.resolve(messaging);
  } catch (error) {
    console.warn('Messaging not supported on web:', error);
    messagingPromise = Promise.reject(error);
  }
} else {
  // For mobile platforms, messaging is handled by Capacitor Firebase plugin
  messagingPromise = Promise.resolve(null);
}

// Development emulator setup
if (import.meta.env.DEV) {
  try {
    console.log(`Development environment detected. Platform: ${getPlatform()}`);
    // Uncomment for local emulator
    // import { connectFunctionsEmulator } from 'firebase/functions';
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Development environment detected. CORS issues with Cloud Functions may occur.');
    console.log('To use local emulator, uncomment the connectFunctionsEmulator line.');
  } catch (error) {
    console.error('Failed to connect to emulator:', error);
  }
}

export { 
  app, 
  auth, 
  db, 
  functions, 
  messaging, 
  messagingPromise, 
  storage,
  getPlatform 
};
