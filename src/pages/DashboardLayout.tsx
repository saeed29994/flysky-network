
// 📁 DashboardLayout.tsx

import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, User, Mail, LogOut, Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import ProfileModal from '../components/ProfileModal';
import { deleteCurrentToken } from '../utils/pushNotification';
import fsnLogo from '../assets/fsn-logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const hideFooter = location.pathname === '/watch-to-earn';

  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [kycStatus, setKycStatus] = useState<'Not Actived' | 'Pending' | 'Approved'>('Not Actived');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | undefined>(undefined);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
        const data = userSnap.data();

        setUserName(data?.fullName || '');
        setUserEmail(data?.email || '');

        const planValue = data?.membership?.planName || data?.plan || 'economy';
        const normalizedPlan =
          planValue.includes('first') ? 'first' :
          planValue === 'business' ? 'business' : 'economy';
        setUserPlan(normalizedPlan);

        const rawKyc = (data?.kycStatus || data?.kyc?.kycStatus || 'Not Actived').toLowerCase();
        const normalizedKyc =
          rawKyc === 'approved' || rawKyc === 'actived' || rawKyc === 'verified' ? 'Approved' :
          rawKyc === 'pending' ? 'Pending' : 'Not Actived';
        setKycStatus(normalizedKyc);

        const endDate = data?.membership?.subscriptionEnd;
        if (endDate) setSubscriptionEnd(new Date(endDate).toLocaleDateString());

        setIsLoading(false);
      });

      const inboxQuery = query(collection(db, 'users', user.uid, 'inbox'), where('read', '==', false));
      const unsubscribeInbox = onSnapshot(inboxQuery, (snapshot) => {
        setHasUnreadMessages(!snapshot.empty);
      });

      return () => {
        unsubscribeSnapshot();
        unsubscribeInbox();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setShowProfileModal(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  const scrollToContact = () => {
    navigate('/dashboard');
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await deleteCurrentToken();
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const menuLinks = (
    <>
      <Link to="/dashboard">{t('menu.home')}</Link>
      <Link to="/staking">{t('menu.staking')}</Link>
      <Link to="/mining">{t('menu.mining')}</Link>
      <Link to="/playtoearn">{t('menu.play')}</Link>
      <Link to="/watch-to-earn">{t('menu.watch')}</Link>
      <Link to="/referral">{t('menu.referral')}</Link>
      <Link to="/wallet">{t('menu.wallet')}</Link>
      <Link to="/about">{t('menu.about')}</Link>
      <Link to="/inbox" className="relative">
        {t('menu.inbox')}
        {hasUnreadMessages && <span className="absolute -top-2 -right-2 bg-red-500 w-3 h-3 rounded-full"></span>}
      </Link>
      <Link to="/settings">{t('menu.settings')}</Link>
    </>
  );

  const footerItems = (
    <div className="flex flex-col gap-2 pt-6 border-t border-yellow-800">
      <button onClick={scrollToContact}>{t('menu.contact')}</button>
      <button type="button" onClick={handleProfileClick}>{t('menu.profile')}</button>
      <button onClick={handleLogout} className="text-red-400">{t('menu.logout')}</button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-yellow-400 text-lg">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className={`bg-gray-950 min-h-screen ${i18n.language === 'ar' ? 'md:pr-56' : 'md:pl-56'}`}>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-yellow-400 flex justify-between items-center p-3 z-50">
        <button onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <Menu size={24} />
        </button>
        <div className="font-bold text-sm">
          <span className="text-yellow-400">Fly</span>
          <span className="text-sky-400">Sky</span>
          <span className="text-yellow-400"> Network</span>
        </div>
        <div></div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden fixed top-12 left-0 right-0 bg-gray-800 text-yellow-400 flex flex-col gap-2 p-4 z-40 text-sm">
          {menuLinks}
          {footerItems}
        </div>
      )}

      <div className="min-h-screen flex flex-col">
        <aside className={`hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col justify-between bg-gray-900 text-yellow-400 p-4 ${i18n.language === 'ar' ? 'right-0' : 'left-0'}`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <img src={fsnLogo} alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-sm whitespace-nowrap">
                <span className="text-yellow-400">Fly</span>
                <span className="text-sky-400">Sky</span>
                <span className="text-yellow-400"> Network</span>
              </span>
            </div>
            <nav className="flex flex-col gap-2 text-sm">{menuLinks}</nav>
          </div>
          {footerItems}
        </aside>

        <main className="flex-1 pt-16 md:pt-0 px-2 md:px-6">{children}</main>

        {!hideFooter && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 text-yellow-400 flex justify-around py-2 z-40">
            <div className="flex flex-col items-center">
              <Link to="/dashboard">
                <Home size={20} />
                <span className="text-xs mt-1">{t('menu.home')}</span>
              </Link>
            </div>
            <div className="flex flex-col items-center">
              <Link to="/wallet">
                <Wallet size={20} />
                <span className="text-xs mt-1">{t('menu.wallet')}</span>
              </Link>
            </div>
            <div className="flex flex-col items-center relative">
              <Link to="/inbox">
                <Mail size={20} />
                <span className="text-xs mt-1">{t('menu.inbox')}</span>
                {hasUnreadMessages && <span className="absolute top-0 right-1 bg-red-500 w-2 h-2 rounded-full"></span>}
              </Link>
            </div>
            <div className="flex flex-col items-center">
              <button onClick={handleProfileClick}>
                <User size={20} />
                <span className="text-xs mt-1">{t('menu.profile')}</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <button type="button" onClick={handleLogout}>
                <LogOut size={20} />
                <span className="text-xs mt-1">{t('menu.logout')}</span>
              </button>
            </div>
          </div>
        )}

        {showProfileModal && userName && userEmail && (
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            fullName={userName}
            email={userEmail}
            plan={userPlan}
            kycStatus={kycStatus}
            subscriptionEnd={subscriptionEnd}
            onUpgrade={() => navigate('/membership')}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
