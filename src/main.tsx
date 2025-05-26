import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ✅ مزود الاتصال مع المحافظ (يدعم WalletConnect تلقائيًا)
import { AppKitProvider } from './providers/AppKitProvider';

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
