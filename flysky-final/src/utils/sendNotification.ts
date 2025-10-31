// 📁 src/utils/sendNotification.ts

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase'; // ✅ تم دمج كل شيء في firebase.ts

const functions = getFunctions(app);

interface NotificationPayload {
  title: string;
  body: string;
  tokens: string[]; // قائمة التوكنات
  link?: string;    // رابط عند الضغط على الإشعار
}

export const sendNotification = async (payload: NotificationPayload) => {
  try {
    const sendPush = httpsCallable(functions, 'sendPushNotification');
    const result = await sendPush(payload);
    console.log('✅ Notification result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return { success: false, error };
  }
};
