// 📁 public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// ✅ تهيئة Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
  authDomain: "flysky-site.firebaseapp.com",
  projectId: "flysky-site",
  storageBucket: "flysky-site.appspot.com",
  messagingSenderId: "3676998780",
  appId: "1:3676998780:web:7660a9ff69960163550df9",
  measurementId: "G-17PESJ4RBQ",
});

const messaging = firebase.messaging();

// ✅ استقبال الإشعارات في الخلفية (يدعم notification و data)
messaging.onBackgroundMessage(function(payload) {
  console.log('[🔥 PAYLOAD RECEIVED]', payload);

  const title = payload.notification?.title || payload.data?.title || '📢 Notification';
  const body = payload.notification?.body || payload.data?.body || '';
  const image = payload.notification?.image || payload.data?.image || undefined;
  const link = payload.data?.link || 'https://fsncrew.io/mining';

  const notificationOptions = {
    body,
    icon: '/fsn-logo.png',
    image,
    data: { link },
  };

  self.registration.showNotification(title, notificationOptions);
});

// ✅ فتح الرابط عند الضغط على الإشعار
self.addEventListener('notificationclick', function(event) {
  const targetLink = event.notification?.data?.link || '/';
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === targetLink && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetLink);
      }
    })
  );
});
