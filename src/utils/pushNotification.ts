import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

// Standardize token storage across the app
export const requestPermissionAndToken = async (uid: string) => {
  try {
    const permission = await Notification.requestPermission();
    
    // Reference to user document
    const userRef = doc(db, 'users', uid);
    
    // Check if user document exists first
    const userDoc = await getDoc(userRef);
    
    if (permission !== 'granted') {
      console.warn('🔒 تم رفض إذن الإشعارات');
      
      // Only update if document exists
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          'notifications.push': false
        });
      }
      return;
    }

    // If permission was granted, update user preferences
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        'notifications.push': true
      });
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });

    console.log('📱 معلومات الجهاز:', {
      userAgent: navigator.userAgent,
      token,
      permission: Notification.permission,
    });

    if (token) {
      // Store token in both places to ensure backward compatibility
      // Only update user document if it exists
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          lastTokenUpdate: serverTimestamp(),
          lastUserAgent: navigator.userAgent,
        });
      }
      
      // Always store in userTokens collection (used by backend functions)
      // This uses setDoc which creates the document if it doesn't exist
      await setDoc(doc(db, 'userTokens', uid), {
        token: token, // Single token format expected by backend
        updatedAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: 'web',
      });

      console.log('✅ تم حفظ التوكن في قاعدة البيانات');
    } else {
      console.warn('⚠️ لم يتم الحصول على توكن FCM');
    }
    
    return token;
  } catch (error: any) {
    console.error('❌ خطأ أثناء طلب التوكن:', error?.message || error);
    return null;
  }
};

// Update to clear token from both storage locations
export const deleteCurrentToken = async (uid: string) => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      // Delete from browser
      await deleteToken(messaging);
      
      // Remove from Firestore if user is logged in
      if (uid) {
        try {
          // Reference to userTokens document
          const tokenDocRef = doc(db, 'userTokens', uid);
          
          // Remove from userTokens collection
          await setDoc(tokenDocRef, { 
            token: null,
            updatedAt: serverTimestamp(),
            status: 'deleted'
          });
          
          console.log('🗑️ تم حذف التوكن من المتصفح وقاعدة البيانات');
        } catch (tokenError) {
          console.error('❌ خطأ أثناء حذف التوكن من قاعدة البيانات:', tokenError);
        }
      }
    }
  } catch (error) {
    console.error('❌ خطأ أثناء حذف التوكن:', error);
  }
};

// Improved foreground message handler
export const listenToForegroundMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('📥 تم استقبال إشعار أثناء فتح التطبيق:', payload);
    
    // Show foreground notification using Notification API
    if (payload.notification) {
      const { title, body } = payload.notification;
      const notifOptions = {
        body: body,
        icon: '/fsn-logo.png',
        badge: '/fsn-logo.png',
        data: payload.data
      };
      
      try {
        // Check if we have permission before showing
        if (Notification.permission === 'granted') {
          new Notification(title || 'FSN Network', notifOptions);
        }
      } catch (error) {
        console.error('❌ Error showing foreground notification:', error);
      }
    }
  });
};

// Add a new method to check FCM permission status
export const checkNotificationPermission = (): 'granted' | 'denied' | 'default' => {
  return Notification.permission;
};
