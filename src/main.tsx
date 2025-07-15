import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ✅ مزود الاتصال مع المحافظ (يدعم WalletConnect تلقائيًا)
import { AppKitProvider } from './providers/AppKitProvider';

// ✅ تهيئة Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://6023cef691f776e41ae829efda870ca1@o4509665089355776.ingest.us.sentry.io/4509665099907072",
  sendDefaultPii: true, // يسمح بجمع معلومات مثل IP تلقائيًا
});

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppKitProvider>
        <App />
      </AppKitProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}

// ✅ تسجيل Service Worker لإشعارات FCM
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("✅ SW registered:", registration);
    })
    .catch((err) => {
      console.error("❌ SW registration failed:", err);
    });
}
