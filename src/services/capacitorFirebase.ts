import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { doc, updateDoc, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Initialize Firebase with platform-specific implementation
 * Note: Firebase is already initialized in firebase.ts, so we just set up Capacitor plugins
 */
export const initFirebase = async () => {
  try {
    // For native platforms, initialize the Capacitor Firebase plugins
    if (Capacitor.isNativePlatform()) {
      console.log('✅ Firebase ready for Capacitor');
    }
    
    return { auth, db };
  } catch (error) {
    console.error('Failed to initialize Capacitor Firebase', error);
    throw error;
  }
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

 