import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Import notification polyfill for Android compatibility
import './utils/notificationPolyfill';

// Services
import { 
  initFirebase, 
  registerForPushNotifications, 
  requestPushPermissionAndToken 
} from './services/capacitorFirebase';
import { auth } from './firebase';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ReferralProgram from './pages/ReferralProgram';
import MembershipPage from './pages/MembershipPage';
import AdminDashboard from './pages/AdminDashboard';
import EmailVerification from './pages/EmailVerification';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Inbox from './pages/Inbox';
import Inbox_Debug from './pages/Inbox_Debug';
import StakingPage from './pages/Staking';
import KycPage from './pages/KycPage';
import Wallet from './pages/Wallet';
import MiningPage from './pages/MiningPage';
// import PlayToEarn from './pages/PlayToEarn';
import WatchToEarn from './pages/WatchToEarn';
import Settings from './pages/Settings';
import Contact from './pages/Contact';
import AboutUs from './pages/AboutUs';
import DashboardLayout from './pages/DashboardLayout';
import TermsPage from './pages/TermsPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PublicDataDeletion from './pages/PublicDataDeletion';
import PrintToken from './pages/PrintToken';
import UploadBanner from './pages/UploadBanner';
import NotificationsPage from './pages/NotificationsPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { NotificationProvider } from './components/NotificationProvider';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Context
import { UserPlanProvider } from './contexts/UserPlanContext';
import { PlansProvider } from './contexts/PlansContext';

// Utils - Use selectively for web only
import { listenToForegroundMessages } from './utils/pushNotification';

// styles
import 'react-toastify/dist/ReactToastify.css';

// Create router outside of component to avoid recreation on each render
const publicRoutes = [
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/verify-email', element: <EmailVerification /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/inbox', element: <Inbox /> },
  { path: '/membership-page', element: <MembershipPage /> },
  { path: '/inbox-debug', element: <Inbox_Debug /> },
  { path: '/about', element: <AboutUs /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/data-deletion', element: <PublicDataDeletion /> },
  { path: '/upload-banner', element: <UploadBanner /> },
  { path: '/print-token', element: <PrintToken /> },
];

const dashboardRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/profile', element: <Profile /> },
  { path: '/membership', element: <MembershipPage /> },
  { path: '/referral-program', element: <ReferralProgram /> },
  { path: '/referrals', element: <ReferralProgram /> },
  { path: '/referral', element: <Navigate to="/referral-program" replace /> },
  { path: '/staking', element: <StakingPage /> },
  { path: '/kyc', element: <KycPage /> },
  { path: '/wallet', element: <Wallet /> },
  { path: '/mining', element: <MiningPage /> },
  // { path: '/playtoearn', element: <PlayToEarn /> },
  { path: '/watch-to-earn', element: <WatchToEarn /> },
  { path: '/settings', element: <Settings /> },
  { path: '/contact', element: <Contact /> },
  { path: '/notifications', element: <NotificationsPage /> },
];

// Create the router with notification provider for authenticated routes
const router = createBrowserRouter([
  ...publicRoutes,
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminRoute>
          <NotificationProvider>
            <AdminDashboard />
          </NotificationProvider>
        </AdminRoute>
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <NotificationProvider>
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        </NotificationProvider>
      </ProtectedRoute>
    ),
    children: dashboardRoutes,
  },
]);

function AppContent() {
  const { i18n } = useTranslation();

  // Set language direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);
  
  // Initialize Capacitor plugins
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Firebase for web or native platforms
        await initFirebase();
        
        if (Capacitor.isNativePlatform()) {
          // Hide the splash screen with a fade effect
          await SplashScreen.hide({ fadeOutDuration: 500 });
          
          // Set status bar style for better Android compatibility
          if (Capacitor.getPlatform() === 'android') {
            StatusBar.setBackgroundColor({ color: '#00000000' }); // Transparent
            StatusBar.setStyle({ style: Style.Light });
            StatusBar.setOverlaysWebView({ overlay: false });
          } else if (Capacitor.getPlatform() === 'ios') {
            StatusBar.setStyle({ style: Style.Dark });
          }
          
          // Register for push notifications on native platforms
          await registerForPushNotifications();
          
          console.log(`✅ App initialized on ${Capacitor.getPlatform()}`);
        } else {
          // Register service worker for web push notifications
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker
              .register('/firebase-messaging-sw.js')
              .then(() => console.log('✅ Service Worker registered successfully'))
              .catch((err) => console.error('❌ Service Worker registration failed', err));
          }
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
      }
    };
    
    initApp();
  }, []);

  // Handle auth state and FCM token
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set Sentry user
        Sentry.setUser({
          id: user.uid,
          email: user.email || undefined,
        });

        // Get FCM token based on platform
        if (Capacitor.isNativePlatform()) {
          await requestPushPermissionAndToken(user.uid);
        } else {
          // Use web implementation for push notifications
          const { requestPermissionAndToken } = await import('./utils/pushNotification');
          await requestPermissionAndToken(user.uid);
          listenToForegroundMessages();
          
          // Inform service worker about authenticated user (web only)
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'AUTH_USER',
              userId: user.uid
            });
          }
        }
      } else {
        // Clear Sentry user when logged out
        Sentry.setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <ToastContainer position="top-center" autoClose={4000} />
      <PWAInstallPrompt />
    </>
  );
}

function App() {
  return (
    <PlansProvider>
      <UserPlanProvider>
        <RouterProvider router={router} />
        <AppContent />
      </UserPlanProvider>
    </PlansProvider>
  );
}

export default App;
