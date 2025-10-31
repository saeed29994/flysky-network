// sendFCM.mjs
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

// ✅ ألصق هنا التوكن الذي نسخته من الكونسول بعد تسجيل الدخول
const testToken = '📋 الصق التوكن هنا بين علامتي التنصيص';

const getAccessToken = async () => {
  const client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const { token } = await client.getAccessToken();
  return token;
};

const sendNotification = async () => {
  try {
    const accessToken = await getAccessToken();

    const message = {
      message: {
        token: testToken,
        notification: {
          title: '🎁 Daily Bonus',
          body: 'Click to claim your 100 FSN reward now!',
        },
        webpush: {
          fcmOptions: {
            link: 'https://fsncrew.io/inbox', // أو أي رابط تريده
          },
        },
      },
    };

    const res = await axios.post(
      'https://fcm.googleapis.com/v1/projects/flysky-site/messages:send',
      message,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ تم إرسال الإشعار بنجاح:', res.data);
  } catch (err) {
    console.error('❌ فشل الإرسال:', err.response?.data || err.message);
  }
};

sendNotification();
