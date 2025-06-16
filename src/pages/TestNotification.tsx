// 📁 src/pages/TestNotification.tsx

import { useState } from 'react';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { toast } from 'react-toastify';

// ✅ إعداد Cloud Functions
const functions = getFunctions(app);

// ✅ ربط مع المحاكي فقط عند التشغيل محليًا
if (location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

const TestNotification = () => {
  const [token, setToken] = useState('');

  const sendNotification = async () => {
    try {
      if (!token.trim()) {
        toast.warn('⚠️ Please enter a valid FCM token.');
        return;
      }

      const sendFcmNotification = httpsCallable(functions, 'sendFcmNotification');
      const res = await sendFcmNotification({
        token,
        title: '🚀 Test Notification (Local)',
        body: 'This is a test from Firebase Emulator!',
        clickAction: 'http://localhost:5173/dashboard',
      });

      console.log('✅ Response:', res);
      toast.success('✅ Notification sent successfully!');
    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      toast.error(`❌ Failed to send notification: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] text-white px-4">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">📩 Test FCM Notification (Local)</h1>

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
