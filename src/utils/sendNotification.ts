// 📁 src/utils/sendNotification.ts

import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

interface NotificationPayload {
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
}

export const sendNotification = async ({
  title,
  body,
  link,
  imageUrl,
}: NotificationPayload) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('⛔ No authenticated user found.');
      return;
    }

    const tokenRef = doc(db, 'userTokens', user.uid);
    const tokenSnap = await getDoc(tokenRef);
    if (!tokenSnap.exists()) {
      console.warn('⚠️ No push token found for user.');
      return;
    }

    const { token } = tokenSnap.data() as { token: string };
    if (!token) {
      console.warn('❌ Invalid token.');
      return;
    }

    const sendPush = httpsCallable(functions, 'sendPushNotification');
    const result = await sendPush({
      title,
      body,
      link,
      imageUrl,
      tokens: [token], // ✅ التوكن كـ array
    });

    console.log('✅ Notification sent:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return { success: false, error };
  }
};
