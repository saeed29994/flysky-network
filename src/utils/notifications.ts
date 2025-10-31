// 📁 src/utils/notifications.ts

import { auth, db, functions } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// ✅ إرسال إشعار FCM عام (من خلال sendPushNotification)
export const sendUserNotification = async ({
  title,
  body,
  imageUrl,
  clickAction,
  uid,
}: {
  title: string;
  body: string;
  imageUrl?: string;
  clickAction?: string;
  uid?: string;
}) => {
  try {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) {
      console.warn('⛔ No authenticated user found.');
      return;
    }

    const tokenRef = doc(db, 'userTokens', userId);
    const tokenSnap = await getDoc(tokenRef);
    if (!tokenSnap.exists()) {
      console.warn('⚠️ No push token found for user.');
      return;
    }

    const { token } = tokenSnap.data() as { token: string };
    if (!token) {
      console.warn('⚠️ User token is empty.');
      return;
    }

    const sendNotification = httpsCallable(functions, 'sendPushNotification');
    await sendNotification({
      userId,
      title,
      body,
      imageUrl,
      clickAction,
    });

    console.log('✅ Notification sent to user:', userId);
  } catch (error: any) {
    console.error('❌ Error sending notification:', error.message);
  }
};

// ✅ إشعار عند اكتمال التعدين (notifyMiningComplete)
export const notifyMiningComplete = async () => {
  try {
    const callFn = httpsCallable(functions, 'notifyMiningComplete');
    const result = await callFn();
    console.log('✅ Mining completion notification sent:', result);
  } catch (error: any) {
    console.error('❌ Error calling notifyMiningComplete:', error.message);
  }
};
