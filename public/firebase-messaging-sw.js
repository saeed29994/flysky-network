// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Service worker state
let currentUserId = null;

// Log service worker activation
self.addEventListener('install', event => {
  // console.log('[Firebase Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // console.log('[Firebase Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUTH_USER') {
    currentUserId = event.data.userId;
  }
});

// Firebase configuration - should match your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCbAz_c1hz2Xd5Ju7u1TOdftZL7OGzCEKA",
  authDomain: "flysky-site.firebaseapp.com",
  projectId: "flysky-site",
  storageBucket: "flysky-site.appspot.com",
  messagingSenderId: "3676998780",
  appId: "1:3676998780:web:7660a9ff69960163550df9",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {

  // Extract notification data
  const title = payload.notification?.title || payload.data?.title || 'FSN Network';
  const body = payload.notification?.body || payload.data?.body || '';
  const image = payload.notification?.image || payload.data?.image || undefined;
  const link = payload.data?.link || '/';
  const type = payload.data?.type || 'general';
  const targetUserId = payload.data?.userId || null;

  // Only show notification if it's not targeted or if it's for the current user
  if (targetUserId && currentUserId && targetUserId !== currentUserId) {
    console.log(`[Firebase Service Worker] Skipping notification: targeted to ${targetUserId} but current user is ${currentUserId}`);
    return;
  }

  // Create notification options
  const notificationOptions = {
    body,
    icon: '/fsn-logo.png',
    image,
    badge: '/fsn-logo.png',
    data: { 
      link,
      type,
      userId: currentUserId
    },
    actions: [
      {
        action: 'open',
        title: 'Open',
      }
    ],
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  // Show notification
  self.registration.showNotification(title, notificationOptions)
    .catch(error => console.error('[Firebase Service Worker] Error showing notification:', error));
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {

  event.notification.close();

  // Extract target URL
  const targetLink = event.notification.data?.link || '/';
  const clickAction = event.action === 'open' ? targetLink : targetLink;

  // Focus or open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICKED', path: clickAction });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(clickAction);
        }
      })
      .catch(error => console.error('[Firebase Service Worker] Error handling click:', error))
  );
});
