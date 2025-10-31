/// <reference types="node" />
import * as admin from 'firebase-admin';
import * as serviceAccount from './serviceAccountKey.json'; // ✅ تأكد أن الملف موجود بنفس المجلد

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const payload = {
  notification: {
    title: '🚀 Test Notification',
    body: 'Push notification sent successfully!',
  },
  tokens: [
    'feedhapfqrxh0NzyewDJ8q:APA91bEDQq33nUFJbqFxHbp6hleV4HoyvymNxEYaJJbPU17bPhj_zJDc764ElHkMfJ0HyTQmtRW5cg8gJjUpQHQLL3yQv8p60FzjZhSW48lz283YuDxk-jw',
  ],
};

admin
  .messaging()
  .sendEachForMulticast(payload)
  .then((response) => {
    console.log('✅ Sent:', response.successCount, '🧨 Failed:', response.failureCount);
    console.log(response.responses);
  })
  .catch((err) => {
    console.error('❌ Error sending notification:', err);
  });
