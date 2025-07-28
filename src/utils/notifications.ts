// 📁 src/utils/notifications.ts

import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
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
      console.log('✅ Local mining notification created successfully');
    } catch (error) {
      console.error('❌ Error creating local notification:', error);
    }
  }
  
  // Try calling the cloud function for push notifications
  try {
    const callFn = httpsCallable(functions, 'notifyMiningComplete');
    const result = await callFn();
    console.log('✅ Mining completion notification sent to cloud function:', result);
    return true;
  } catch (error: any) {
    console.error('❌ Error calling notifyMiningComplete cloud function:', error.message);
    // If we're in development and the cloud function failed, but local notification worked,
    // we can consider this a partial success
    if (import.meta.env.DEV && localNotificationSuccess) {
      console.log('⚠️ Cloud function failed but local notification created - development mode');
      return true;
    }
    return localNotificationSuccess; // Return true if at least the local notification worked
  }
};
