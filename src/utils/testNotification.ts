import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const functions = getFunctions(app);

// ✅ توصيل بالمحاكي فقط عند التشغيل محليًا
if (location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export const testLocalNotification = async (token: string) => {
  try {
    const sendNotification = httpsCallable(functions, 'sendFcmNotification');

    await sendNotification({
      token,
      title: '🔔 Local Test',
      body: 'This notification was sent from the local emulator!',
      imageUrl: 'https://i.imgur.com/I9ZQZ5v.png',
      clickAction: '/dashboard',
    });

    console.log('✅ Notification sent successfully from localhost.');
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
};
