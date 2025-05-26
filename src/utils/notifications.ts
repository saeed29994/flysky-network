// 📁 src/utils/notifications.ts

import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// إرسال إشعار فردي لمستخدم
export const sendUserNotification = async (title: string, body: string, imageUrl?: string, clickAction?: string) => {
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
      console.warn('⚠️ User token is empty.');
      return;
    }

    const payload: any = {
      title,
      body,
      tokens: [token],
      clickAction, // ✅ دعم النقر على الإشعار
    };

    if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    const response = await fetch('https://flysky-server.onrender.com/sendNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Notification sent successfully.');
    } else {
      console.error('❌ Failed to send notification:', result.message);
    }
  } catch (error) {
    console.error('🔥 Error sending notification:', error);
  }
};

// ✅ اختصارات جاهزة مع clickAction مضاف:

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
