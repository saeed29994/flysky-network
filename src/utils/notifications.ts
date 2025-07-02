// 📁 src/utils/notifications.ts

import { auth, db, functions } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// ✅ إرسال إشعار باستخدام Cloud Function
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

    // الحصول على FCM Token
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
      token,
      title,
      body,
      imageUrl,
      clickAction,
    });

    console.log('✅ Notification sent via Firebase Function.');
  } catch (error) {
    console.error('🔥 Error sending notification:', error);
  }
};

// ✅ اختصارات جاهزة:
export const notifyNewInboxMessage = async () => {
  await sendUserNotification({
    title: '📬 New Message',
    body: 'You have received a new message in your inbox.',
    clickAction: '/inbox',
  });
};

export const notifyMiningComplete = async (redirectUrl = '/mining') => {
  await sendUserNotification({
    title: '⛏️ Mining Complete!',
    body: 'Claim your rewards now!',
    clickAction: redirectUrl,
  });
};

export const notifyRewardClaimed = async () => {
  await sendUserNotification({
    title: '🎁 Reward Claimed',
    body: 'You have successfully claimed your mining reward.',
    clickAction: '/mining',
  });
};

export const notifyAccountUpdate = async () => {
  await sendUserNotification({
    title: '🔧 Account Updated',
    body: 'Your account information has been updated.',
    clickAction: '/profile',
  });
};
