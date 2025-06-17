// 📁 src/pages/TestNotification.tsx

import { useState } from 'react';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { toast } from 'react-toastify';

const functions = getFunctions(app);

// ✅ ربط مع المحاكي فقط إذا كنا على localhost
if (location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

const TestNotification = () => {
  const [token, setToken] = useState('');

  const sendNotification = async () => {
    try {
      if (!token || token.trim() === '') {
        toast.error('❌ Please paste a valid FCM token');
        return;
      }

      const title = '🚀 Test Notification';
      const body = 'This is a test notification!';
      const clickAction =
        location.hostname === 'localhost'
          ? 'http://localhost:5173/dashboard'
          : 'https://fsncrew.io/dashboard';

      const payload = {
        token: token.trim(),
        title: title.trim(),
        body: body.trim(),
        imageUrl: '',
        clickAction,
      };

      console.log('📦 Sending payload:', payload);

      const sendFcmNotification = httpsCallable(functions, 'sendFcmNotification');
      await sendFcmNotification(payload);

      toast.success('✅ Notification sent successfully!');
    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      toast.error(`❌ Failed to send notification: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] text-white px-4">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">📩 Test FCM Notification</h1>

        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter FCM Token"
          className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600"
        />

        <button
          onClick={sendNotification}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg shadow-md transition-all"
        >
          Send Notification
        </button>
      </div>
    </div>
  );
};

export default TestNotification;
