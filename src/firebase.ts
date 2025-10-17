// 📁 src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
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

// Secure Firebase configuration using environment variables
const getFirebaseConfig = () => {
  const platform = getPlatform();

  // Validate required environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_WEB_APP_ID'
    // Note: VITE_FIREBASE_IOS_APP_ID and VITE_FIREBASE_ANDROID_APP_ID are optional
    // They'll fall back to VITE_FIREBASE_WEB_APP_ID if not provided
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Base configuration from environment variables
  const baseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  };

  // For Capacitor (mobile), use platform-specific configurations
  if (platform === 'ios' || platform === 'android') {
    const mobileAppId = platform === 'ios' 
      ? import.meta.env.VITE_FIREBASE_IOS_APP_ID || import.meta.env.VITE_FIREBASE_WEB_APP_ID
      : import.meta.env.VITE_FIREBASE_ANDROID_APP_ID || import.meta.env.VITE_FIREBASE_WEB_APP_ID;
    
    const config = {
      ...baseConfig,
      appId: mobileAppId,
    };
    
    // Only log in development and without sensitive data
    if (import.meta.env.DEV) {
      console.log(`Firebase initialized for Capacitor (${platform}) with app ID type: ${
        platform === 'ios' && import.meta.env.VITE_FIREBASE_IOS_APP_ID ? 'iOS-specific' : 
        platform === 'android' && import.meta.env.VITE_FIREBASE_ANDROID_APP_ID ? 'Android-specific' : 
        'Web fallback'
      }`);
    }
    
    return config;
  }

  // Platform-specific app IDs for web
  const platformConfigs: Record<'web', typeof baseConfig & { appId: string }> = {
    web: {
      ...baseConfig,
      appId: import.meta.env.VITE_FIREBASE_WEB_APP_ID,
    }
  };

  const config = platformConfigs[platform];
  
  // Only log in development and without sensitive data
  if (import.meta.env.DEV) {
    console.log(`Firebase initialized for platform: ${platform}`);
  }
  
  return config;
};

// Initialize Firebase with platform-specific config
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with platform-specific configuration
let auth: any;

const platform = getPlatform();

// Log the platform and authentication configuration (only in development)
if (import.meta.env.DEV) {
  console.log(`🔥 Firebase initialized for platform: ${platform}`);
  
  if (platform === 'ios') {
    console.log('📱 iOS authentication setup: Using initializeAuth for native iOS app');
  } else {
    console.log(`📱 ${platform} authentication setup: Using standard getAuth`);
  }
}
if (platform === 'ios') {
  // For iOS, use initializeAuth with custom configuration
  try {
    auth = initializeAuth(app, {
      // iOS-specific auth configuration
      // This ensures proper initialization for iOS native apps
    });
    console.log('✅ Firebase Auth initialized for iOS with initializeAuth');
  } catch (error) {
    // If auth is already initialized, get the existing instance
    auth = getAuth(app);
    console.log('✅ Using existing Firebase Auth instance for iOS');
  }
} else {
  // For web and Android, use standard getAuth
  auth = getAuth(app);
  console.log(`✅ Firebase Auth initialized for ${platform}`);
}

// Initialize other Firebase services
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
    console.log('Development environment detected');
    // Uncomment for local emulator
    // import { connectFunctionsEmulator } from 'firebase/functions';
    // connectFunctionsEmulator(functions, 'localhost', 5001);
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
