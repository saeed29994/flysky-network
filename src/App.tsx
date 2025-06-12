import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  requestPermissionAndToken,
  listenToForegroundMessages
} from './utils/pushNotification';
import { auth, messagingPromise } from './firebase';
import { onMessage } from 'firebase/messaging';

import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Public Pages
import Inbox_Debug from './pages/Inbox_Debug';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import EmailVerification from './pages/EmailVerification';
import Inbox from './pages/Inbox';
import AboutUs from './pages/AboutUs';
import TestNotification from './pages/TestNotification';
import TermsPage from './pages/TermsPage'; // ✅ استيراد صفحة الشروط

// Protected Layout
import DashboardLayout from './pages/DashboardLayout';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MembershipPage from './pages/MembershipPage';
import ReferralProgram from './pages/ReferralProgram';
import StakingPage from './pages/Staking';
import KycPage from './pages/KycPage';
import MiningPage from './pages/MiningPage';
import PlayToEarn from './pages/PlayToEarn';
import WatchToEarn from './pages/WatchToEarn';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';

// Auth
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { UserPlanProvider } from './contexts/UserPlanContext';

const publicRoutes = [
  { path: '/', element: <LandingPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/verify-email', element: <EmailVerification /> },
  { path: '/inbox', element: <Inbox /> },
  { path: '/membership-page', element: <MembershipPage /> },
  { path: '/inbox-debug', element: <Inbox_Debug /> },
  { path: '/about', element: <AboutUs /> },
  { path: '/test-notification', element: <TestNotification /> },
  { path: '/terms', element: <TermsPage /> }, // ✅ إضافة مسار صفحة الشروط
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
  { path: '/playtoearn', element: <PlayToEarn /> },
  { path: '/watch-to-earn', element: <WatchToEarn /> },
  { path: '/settings', element: <Settings /> },
];

const router = createBrowserRouter([
  ...publicRoutes,
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </ProtectedRoute>
    ),
    children: dashboardRoutes,
  },
]);

function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await requestPermissionAndToken();
        listenToForegroundMessages();

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker
            .register('/firebase-messaging-sw.js')
            .then(() => {
              console.log('✅ Service Worker registered');
            })
            .catch((err) => {
              console.error('❌ SW registration failed', err);
            });
        }

        const messaging = await messagingPromise;
        if (messaging) {
          onMessage(messaging, (payload) => {
            console.log('🔔 Foreground notification (fallback):', payload);
            alert(`${payload.notification?.title}\n${payload.notification?.body}`);
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserPlanProvider>
      <RouterProvider router={router} />
      <ToastContainer position="top-center" autoClose={4000} />
    </UserPlanProvider>
  );
}

export default App;
