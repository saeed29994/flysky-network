import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore';

let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let functions: ReturnType<typeof getFunctions>;
let storage: ReturnType<typeof getStorage>;

/**
 * Initialize Firebase with platform-specific implementation
 */
export const initFirebase = async () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'us-central1');
  storage = getStorage(app);
  
  // For native platforms, initialize the Capacitor Firebase plugins
  if (Capacitor.isNativePlatform()) {
    try {
      // No need to explicitly initialize @capacitor-firebase/app
      // It's automatically initialized when using other Firebase plugins
      console.log('✅ Firebase ready for Capacitor');
    } catch (error) {
      console.error('Failed to initialize Capacitor Firebase', error);
    }
  }

  return { app, auth, db, functions, storage };
};

/**
 * Request permission for push notifications and get token
 */
export const requestPushPermissionAndToken = async (uid: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native implementation using Capacitor plugin
      const { token } = await FirebaseMessaging.getToken();
      
      await saveFcmToken(uid, token);
      return token;
    } else {
      // Web implementation (redirects to the existing web implementation)
      const permission = await Notification.requestPermission();
      const userRef = doc(db, 'users', uid);
      
      if (permission !== 'granted') {
        console.warn('🔒 Notification permission denied');
        await updateDoc(userRef, {
          'notifications.push': false
        });
        return null;
      }
      
      // Update user preferences
      await updateDoc(userRef, {
        'notifications.push': true
      });
      
      return null; // Web token handling should be done in the web service
    }
  } catch (error: any) {
    console.error('❌ Error requesting push token:', error?.message || error);
    return null;
  }
};

/**
 * Save FCM token to Firestore
 */
const saveFcmToken = async (uid: string, token: string) => {
  if (!token || !uid) return;
  
  try {
    // Store token in user document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      lastTokenUpdate: serverTimestamp(),
      lastUserAgent: Capacitor.getPlatform(),
    });
    
    // Store in userTokens collection (used by backend functions)
    await setDoc(doc(db, 'userTokens', uid), {
      token: token,
      updatedAt: serverTimestamp(),
      userAgent: 'Capacitor App',
      platform: Capacitor.getPlatform(),
    });
    
    console.log('✅ FCM token saved to database');
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
  }
};

/**
 * Register for push notifications (iOS specific)
 */
export const registerForPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    // Request permissions for push notifications
    await FirebaseMessaging.requestPermissions();
    
    // Check if push is supported
    const result = await FirebaseMessaging.isSupported();
    
    if (result) {
      console.log('✅ Push notifications registered');
      
      // Register for foreground messages
      FirebaseMessaging.addListener('notificationReceived', (notification) => {
        console.log('📣 Notification received in foreground', notification);
      });
      
      // Handle notification open events
      FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
        console.log('👆 Notification action performed', action);
      });
    } else {
      console.warn('⚠️ Push notifications not registered');
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
  }
};

/**
 * Delete FCM token
 */
export const deletePushToken = async (uid: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Delete token on native platforms
      await FirebaseMessaging.deleteToken();
      
      // Remove from Firestore
      if (uid) {
        await setDoc(doc(db, 'userTokens', uid), { 
          token: null,
          updatedAt: serverTimestamp(),
          status: 'deleted'
        });
      }
      
      console.log('🗑️ FCM token deleted');
    }
  } catch (error) {
    console.error('❌ Error deleting FCM token:', error);
  }
};

export { app, auth, db, functions, storage }; 