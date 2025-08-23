// 📁 DashboardLayout.tsx

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Wallet, User, Mail, LogOut, Menu, X, Phone, Settings,
  Gem, Share2, Gamepad2, Video, Coins, Info, Shield, Trash2
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

import { deleteCurrentToken } from '../utils/pushNotification';
import fsnLogo from '../assets/fsn-logo.png';
import { NotificationBell } from '../components/NotificationBell';
import PushNotificationManager from '../components/PushNotificationManager';
import LanguageSwitcher from '../components/LanguageSwitcher';

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
  const [isAdmin, setIsAdmin] = useState(false);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  console.log(userEmail,kycStatus, subscriptionEnd)
  // Store all active listeners in a ref so we can detach them during logout
  const firestoreListeners = useRef<(() => void)[]>([]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Clear any existing listeners when auth state changes
      firestoreListeners.current.forEach(unsub => unsub());
      firestoreListeners.current = [];
      
      if (!user) {
        navigate('/login');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
        const data = userSnap.data();

        setUserName(data?.fullName || '');
        setUserEmail(data?.email || '');
        setIsAdmin(data?.role === 'admin');

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
      
      // Store the listener
      firestoreListeners.current.push(unsubscribeSnapshot);

      const inboxQuery = query(collection(db, 'users', user.uid, 'inbox'), where('read', '==', false));
      const unsubscribeInbox = onSnapshot(inboxQuery, (snapshot) => {
        setHasUnreadMessages(!snapshot.empty);
      });
      
      // Store the listener
      firestoreListeners.current.push(unsubscribeInbox);

      return () => {
        unsubscribeSnapshot();
        unsubscribeInbox();
        firestoreListeners.current = [];
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const scrollToContact = () => {
    navigate('/contact');
  };

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      
      // First detach all Firestore listeners to prevent permission errors
      firestoreListeners.current.forEach(unsubscribe => unsubscribe());
      firestoreListeners.current = [];
      
      if (user) {
        // Delete the token from Firestore while still authenticated
        await deleteCurrentToken(user.uid);
        // Then sign out
        await signOut(auth);
      } else {
        // If no user, just sign out
        await signOut(auth);
      }
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Menu structure with categories
  const menuSections = [
    {
      title: t('menu.sections.main'),
      items: [
        { to: "/dashboard", icon: <Home size={20} />, label: t('menu.home') }
      ]
    },
    {
      title: t('menu.sections.earning'),
      items: [
        { to: "/mining", icon: <Gem size={20} />, label: t('menu.mining') },
        { to: "/staking", icon: <Coins size={20} />, label: t('menu.staking') },
        { to: "/referral-program", icon: <Share2 size={20} />, label: t('menu.referral') },
        { to: "/playtoearn", icon: <Gamepad2 size={20} />, label: t('menu.play') },
        { to: "/watch-to-earn", icon: <Video size={20} />, label: t('menu.watch') }
      ]
    },
    {
      title: t('menu.sections.account'),
      items: [
        { to: "/wallet", icon: <Wallet size={20} />, label: t('menu.wallet') },
        { to: "/inbox", icon: <Mail size={20} />, label: t('menu.inbox'), badge: hasUnreadMessages },
        { to: "/settings", icon: <Settings size={20} />, label: t('menu.settings') },
        { to: "/data-deletion", icon: <Trash2 size={20} />, label: "Data Deletion" },
        { to: "/about", icon: <Info size={20} />, label: t('menu.about') }
      ]
    }
  ];

  // Add admin section if user is admin
  if (isAdmin) {
    menuSections.push({
      title: t('menu.sections.admin'),
      items: [
        { to: "/admin", icon: <Shield size={20} />, label: t('menu.goToAdmin') }
      ]
    });
  }

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-inter">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${i18n.language === 'ar' ? 'md:pr-64' : 'md:pl-64'}`}>
      {/* Enhanced Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-800/95 to-purple-800/95 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 py-3 z-50 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="relative">
            <img src={fsnLogo} alt="Logo" className="w-8 h-8" />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full opacity-20 blur-sm"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm leading-tight">
              <span className="text-amber-400">Fly</span>
              <span className="text-purple-400">Sky</span>
              <span className="text-white"> Network</span>
            </span>
            <span className="text-xs text-gray-400">{userName}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <LanguageSwitcher />
          <NotificationBell />
          <PushNotificationManager showInHeader={true} />
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-white p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={() => setShowMobileMenu(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* Enhanced Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} h-full w-80 bg-gradient-to-br from-slate-800/98 to-slate-900/98 backdrop-blur-xl border-r border-white/10 z-50 transform transition-all duration-300 ease-out ${showMobileMenu ? 'translate-x-0' : i18n.language === 'ar' ? 'translate-x-full' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Enhanced Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={fsnLogo} alt="Logo" className="w-12 h-12" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full opacity-30 blur-lg"></div>
              </div>
              <div>
                <h1 className="font-bold text-white text-lg leading-tight">
                  <span className="text-amber-400">Fly</span>
                  <span className="text-purple-400">Sky</span>
                  <span className="text-white"> Network</span>
                </h1>
                <p className="text-gray-400 text-sm">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{t(`planNames.${userPlan}`)}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowMobileMenu(false)}
              className="text-gray-400 hover:text-white p-3 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Enhanced Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      to={item.to}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                        isActiveLink(item.to)
                          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30 shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10'
                      }`}
                      style={{ minHeight: '56px' }}
                    >
                      <div className={`${isActiveLink(item.to) ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'} transition-colors`}>
                        {item.icon}
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Mobile Footer */}
          <div className="p-6 border-t border-white/10 space-y-3">
            <button
              onClick={() => { setShowMobileMenu(false); scrollToContact(); }}
              className="flex items-center gap-4 w-full px-4 py-4 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:bg-white/10"
              style={{ minHeight: '56px' }}
            >
              <Phone size={20} className="text-gray-400" />
              {t('menu.contact')}
            </button>
            <button
              onClick={() => { setShowMobileMenu(false); handleProfileClick(); }}
              className="flex items-center gap-4 w-full px-4 py-4 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:bg-white/10"
              style={{ minHeight: '56px' }}
            >
              <User size={20} className="text-gray-400" />
              {t('menu.profile')}
            </button>
            <button
              onClick={() => { setShowMobileMenu(false); handleLogout(); }}
              className="flex items-center gap-4 w-full px-4 py-4 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 active:bg-red-500/20"
              style={{ minHeight: '56px' }}
            >
              <LogOut size={20} />
              {t('menu.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-r border-white/10 ${i18n.language === 'ar' ? 'right-0' : 'left-0'}`}>
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={fsnLogo} alt="Logo" className="w-10 h-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full opacity-20 blur-sm"></div>
                </div>
                <div>
                  <h1 className="font-bold text-white text-lg">
                    <span className="text-amber-400">Fly</span>
                    <span className="text-purple-400">Sky</span>
                    <span className="text-white"> Network</span>
                  </h1>
                  <p className="text-gray-400 text-sm">{userName}</p>
                </div>
              </div>
              <div>
                <PushNotificationManager showInHeader={true} />
              </div>
            </div>
          </div>

          {/* Desktop Menu Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                        isActiveLink(item.to)
                          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30 shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={`${isActiveLink(item.to) ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'} transition-colors`}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Footer */}
          <div className="p-6 border-t border-white/10 space-y-2">
            <button
              onClick={scrollToContact}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Phone size={20} className="text-gray-400" />
              {t('menu.contact')}
            </button>
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <User size={20} className="text-gray-400" />
              {t('menu.profile')}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={20} />
              {t('menu.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Notification Bell - Floating */}
      <div className={`hidden md:block fixed top-6 z-40 ${i18n.language === 'ar' ? 'left-6' : 'right-6'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className={`flex items-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <LanguageSwitcher />
          <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-1.5 rounded-full shadow-lg backdrop-blur-sm">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <main className="flex-1 pt-20 md:pt-0 px-4 md:px-6 pb-28 md:pb-8">
        {children}
      </main>

      {/* Enhanced Mobile Bottom Navigation */}
      {!hideFooter && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-800/98 to-slate-900/98 backdrop-blur-xl border-t border-white/10 z-40">
          <div className="grid grid-cols-5 gap-1 p-3">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${
                isActiveLink('/dashboard')
                  ? 'text-purple-400 bg-purple-500/15 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
              style={{ minHeight: '64px' }}
            >
              <Home size={22} className="mb-1" />
              <span className="text-xs font-medium">{t('menu.home')}</span>
            </Link>
            <Link
              to="/mining"
              className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${
                isActiveLink('/mining')
                  ? 'text-purple-400 bg-purple-500/15 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
              style={{ minHeight: '64px' }}
            >
              <Gem size={22} className="mb-1" />
              <span className="text-xs font-medium">{t('menu.mining')}</span>
            </Link>
            <Link
              to="/wallet"
              className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${
                isActiveLink('/wallet')
                  ? 'text-purple-400 bg-purple-500/15 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
              style={{ minHeight: '64px' }}
            >
              <Wallet size={22} className="mb-1" />
              <span className="text-xs font-medium">{t('menu.wallet')}</span>
            </Link>
            <Link
              to="/inbox"
              className={`relative flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${
                isActiveLink('/inbox')
                  ? 'text-purple-400 bg-purple-500/15 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
              style={{ minHeight: '64px' }}
            >
              <Mail size={22} className="mb-1" />
              <span className="text-xs font-medium">{t('menu.inbox')}</span>
              {hasUnreadMessages && (
                <span className="absolute top-2 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </Link>
            <button
              onClick={handleProfileClick}
              className="flex flex-col items-center py-3 px-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200"
              style={{ minHeight: '64px' }}
            >
              <User size={22} className="mb-1" />
              <span className="text-xs font-medium">{t('menu.profile')}</span>
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default DashboardLayout;
