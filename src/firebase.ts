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

  // Use consistent hardcoded config (same as firebase-config.js)
  const baseConfig = {
    apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
    authDomain: "flysky-site.firebaseapp.com",
    projectId: "flysky-site",
    storageBucket: "flysky-site.firebasestorage.app",
    messagingSenderId: "3676998780",
  };

  // For Capacitor (mobile), always use web config to avoid URL scheme issues
  if (platform === 'ios' || platform === 'android') {
    const config = {
      ...baseConfig,
      appId: "1:3676998780:web:7660a9ff69960163550df9", // Use web app ID for Capacitor
    };
    
    if (import.meta.env.DEV) {
      console.log(`Firebase config for Capacitor (${platform}):`, config);
    }
    
    return config;
  }

  // Platform-specific app IDs for web
  const platformConfigs: Record<'web', typeof baseConfig & { appId: string }> = {
    web: {
      ...baseConfig,
      appId: "1:3676998780:web:7660a9ff69960163550df9",
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

// Note: Using web config for Capacitor to avoid URL scheme blocking issues
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
