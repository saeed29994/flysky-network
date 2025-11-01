// 📁 src/utils/notifications.ts

import { auth } from '../firebase';
import { addNotification,  } from './notificationSystem';

export const notifyMiningComplete = async () => {
  // Create a local notification immediately for better user experience
  // This ensures users see notifications even if the cloud function fails
  const user = auth.currentUser;
  let localNotificationSuccess = false;
  
  if (user) {
    try {
      await addNotification(user.uid, {
        type: 'claim_reward',
        title: '⛏️ Mining Complete!',
        body: 'You can now claim your FSN reward. Open the app to claim it.',
        link: '/mining'
      });
      localNotificationSuccess = true;
      // console.log('✅ Local mining notification created successfully');
    } catch (error) {
      console.error('❌ Error creating local notification:', error);
    }
  }
  
  // Call the HTTP function for push notifications and server-side processing
  try {
    // console.log('🚀 Calling notifyMiningComplete HTTP function...');
    
    const response = await fetch('https://us-central1-flysky-site.cloudfunctions.net/notifyMiningComplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user?.uid
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // console.log('✅ Mining completion notification sent to HTTP function:', result);
    
    // Check the result for detailed information
    if (result) {
      const { fcmTokensFound, inAppNotificationCreated, userLanguage } = result;
      
      if (fcmTokensFound > 0) {
        // console.log(`📱 Push notification: ${fcmSuccessCount} successful, ${fcmErrorCount} failed`);
      } else {
        // console.log('⚠️ No FCM tokens found for push notifications');
      }

      if (inAppNotificationCreated) {
        // console.log('✅ Server-side in-app notification created');
      }

      if (userLanguage && userLanguage !== 'en') {
        // console.log(`🌍 Notification translated to ${userLanguage}: "${translatedTitle}" - "${translatedBody}"`);
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Error calling notifyMiningComplete HTTP function:', error.message);
    
    // If we're in development and the HTTP function failed, but local notification worked,
    // we can consider this a partial success
    if (import.meta.env.DEV && localNotificationSuccess) {
      // console.log('⚠️ HTTP function failed but local notification created - development mode');
      return true;
    }
    
    return localNotificationSuccess; // Return true if at least the local notification worked
  }
};

// Test function to verify notification system is working
export const testNotificationSystem = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No authenticated user found');
    return false;
  }

  // console.log('🧪 Testing notification system...');

  try {
    // Test local notification
    // console.log('📱 Testing local notification...');
    await addNotification(user.uid, {
      type: 'system',
      title: '🧪 Test Notification',
      body: 'This is a test notification to verify the system is working.',
      link: '/dashboard'
    });
    // console.log('✅ Local notification test successful');

    // Test push notification permission
    // console.log('🔔 Testing push notification permission...');
    const permission = Notification.permission;
    // console.log(`📋 Notification permission: ${permission}`);

    if (permission === 'granted') {
      // console.log('✅ Push notifications are enabled');

      // Test foreground notification
      if ('serviceWorker' in navigator) {
        // console.log('🔧 Service worker is available');
      } else {
        // console.log('⚠️ Service worker not available');
      }
    } else {
      // console.log('⚠️ Push notifications are not enabled');
    }

    return true;
  } catch (error) {
    console.error('❌ Notification system test failed:', error);
    return false;
  }
};
