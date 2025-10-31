// 📁 src/utils/sendNotification.ts

import { auth} from '../firebase';
import { sendInternationalizedNotification } from './internationalizedNotificationService';

interface NotificationPayload {
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
  data?: Record<string, any>; // Add data field to support additional information
}

export const sendNotification = async ({
  title,
  body,
  link,
  imageUrl,
  data,
}: NotificationPayload) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('⛔ No authenticated user found.');
      return;
    }

    // Use the new internationalized notification system
    const result = await sendInternationalizedNotification({
      title,
      message: body,
      targetAudience: 'custom',
      platforms: ['mobile', 'web'],
      customUserIds: [user.uid], // Send only to the current user
      data: {
        ...(link && { link }),
        ...(imageUrl && { imageUrl }),
        ...data
      }
    });

    // console.log('✅ Notification sent via internationalized system:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return { success: false, error };
  }
};
