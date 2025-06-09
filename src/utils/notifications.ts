// 📁 src/utils/notifications.ts

import { auth, db, functions } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// إرسال إشعار باستخدام Cloud Function
export const sendUserNotification = async (
  title: string,
  body: string,
  imageUrl?: string,
  clickAction?: string
) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('⛔ No authenticated user found.');
      return;
    }

    // الحصول على FCM Token
    const tokenRef = doc(db, 'userTokens', user.uid);
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

    // ✅ استدعاء Cloud Function بالاسم الصحيح
    const sendNotification = httpsCallable(functions, 'sendFcmNotification');

    await sendNotification({
      token, // ✅ مفرد
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
  await sendUserNotification(
    '📬 New Message',
    'You have received a new message in your inbox.',
    undefined,
    '/inbox'
  );
};

export const notifyMiningComplete = async (redirectUrl = '/mining') => {
  await sendUserNotification(
    '⛏️ Mining Complete!',
    'Claim your rewards now!',
    undefined,
    redirectUrl
  );
};

export const notifyRewardClaimed = async () => {
  await sendUserNotification(
    '🎁 Reward Claimed',
    'You have successfully claimed your mining reward.',
    undefined,
    '/mining'
  );
};

export const notifyAccountUpdate = async () => {
  await sendUserNotification(
    '🔧 Account Updated',
    'Your account information has been updated.',
    undefined,
    '/profile'
  );
};
