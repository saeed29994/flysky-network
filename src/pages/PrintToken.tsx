// 📁 src/pages/PrintToken.tsx

import { useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from '../firebase';

const PrintToken = () => {
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const supported = await isSupported();
        if (!supported) {
          alert('🚫 FCM is not supported on this browser.');
          return;
        }

        const messaging = getMessaging(app);

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
          console.log('🔥 Manual FCM Token:', token);
          alert(`✅ FCM Token:\n${token}`);
        } else {
          alert('⚠️ No FCM token available. Please allow notifications.');
        }
      } catch (error) {
        console.error('❌ Error while retrieving FCM token:', error);
        alert('❌ Failed to get FCM token. Check console for details.');
      }
    };

    fetchToken();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-yellow-400 text-xl text-center px-4">
      📲 Retrieving your FCM token... Please check the console or wait for an alert.
    </div>
  );
};

export default PrintToken;
