// 📁 src/pages/Dashboard.tsx
import { useEffect, useRef, useState } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import { Link } from 'react-router-dom';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { auth, db } from '../firebase';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaGem, FaRocket, FaShareAlt, FaInfoCircle, FaCoins,
  FaVideo, FaWallet, FaEnvelope, FaCogs, FaIdCard, FaPhoneAlt,
  FaChartLine, FaUsers, FaTrophy, FaArrowRight
} from 'react-icons/fa';
import logo from '../assets/fsn-logo.png';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Dashboard = () => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const { currentPlan, referrals, balance: contextBalance, referralReward, lockedInStaking: contextLockedInStaking, loading: contextLoading } = useUserPlan();



  const [showContactForm, setShowContactForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Calculate total balance (same formula as Wallet page)
  const totalBalance = contextBalance + contextLockedInStaking + referralReward;
  
  // Get mining level based on plan
  const getMiningLevel = () => {
    const plan = currentPlan || 'economy';
    if (plan === 'first-lifetime' || plan === 'first') return 'Diamond';
    if (plan === 'first-6') return 'Platinum';
    if (plan === 'business') return 'Gold';
    return 'Bronze';
  };

  const miningLevel = getMiningLevel();

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      requestPermissionAndToken(user.uid).catch(console.error);
    }
  }, []);

  // Get user information for contact form
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        setUserEmail(user.email || '');
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch wallet data directly from Firestore (similar to Wallet.tsx)
  useEffect(() => {
    const fetchWalletData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setLoading(true);
        
        // Get user document
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setBalance(userData.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const message = formData.get('message');

    if (message && userName && userEmail) {
      try {
        setSendingMessage(true);
        // Store the message in Firestore for admin review

        await addDoc(collection(db, 'contactMessages'), {
          name: userName,
          email: userEmail,
          message: message.toString(),
          userId: auth.currentUser?.uid,
          timestamp: serverTimestamp(),
          status: 'unread', // unread, read, replied
          priority: 'normal' // normal, urgent, spam
        });

        toast.success(t('contact.thankYou', 'Thank you for your message! We will get back to you soon.'));
        formRef.current.reset();
        setShowContactForm(false);
      } catch (error) {
        console.error('Error sending contact message:', error);
        toast.error(t('contact.sendError', 'Failed to send message. Please try again.'));
      } finally {
        setSendingMessage(false);
      }
    } else {
      toast.error(t('contact.fillAllFields', 'Please fill in all fields'));
    }
  };

  // Professional dashboard sections
  const quickActions = [
    {
      to: '/mining',
      icon: <FaGem className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.quickActions.mining.title'),
      description: t('dashboard.quickActions.mining.description'),
      color: 'bg-gradient-to-br from-amber-500 to-orange-500'
    },
    {
      to: '/staking',
      icon: <FaCoins className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.quickActions.staking.title'),
      description: t('dashboard.quickActions.staking.description'),
      color: 'bg-gradient-to-br from-green-500 to-emerald-500'
    },
    {
      to: '/wallet',
      icon: <FaWallet className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.quickActions.wallet.title'),
      description: t('dashboard.quickActions.wallet.description'),
      color: 'bg-gradient-to-br from-blue-500 to-purple-500'
    },
    {
      to: '/referral-program',
      icon: <FaShareAlt className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.quickActions.referrals.title'),
      description: t('dashboard.quickActions.referrals.description'),
      color: 'bg-gradient-to-br from-purple-500 to-pink-500'
    }
  ];

  const features = [
    {
      to: '/membership',
      icon: <FaRocket className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.features.membership.title'),
      description: t('dashboard.features.membership.description'),
      highlight: true
    },
    // {
    //   to: '/playtoearn',
    //   icon: <FaGamepad className="w-4 h-4 sm:w-5 sm:h-5" />,
    //   title: t('dashboard.features.playToEarn.title'),
    //   description: t('dashboard.features.playToEarn.description'),
    //   highlight: false
    // },
    {
      to: '/watch-to-earn',
      icon: <FaVideo className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.features.watchToEarn.title'),
      description: t('dashboard.features.watchToEarn.description'),
      highlight: false
    },
    {
      to: '/inbox',
      icon: <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.features.inbox.title'),
      description: t('dashboard.features.inbox.description'),
      highlight: false
    },
    {
      to: '/kyc',
      icon: <FaIdCard className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.features.kyc.title'),
      description: t('dashboard.features.kyc.description'),
      highlight: false
    },
    {
      to: '/settings',
      icon: <FaCogs className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t('dashboard.features.settings.title'),
      description: t('dashboard.features.settings.description'),
      highlight: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full blur-xl opacity-30"></div>
              <img
                src={logo}
                alt="FlySky Network"
                className="relative w-12 h-12 sm:w-16 sm:h-16 animate-spin-slow"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            {t('dashboard.tagline')}
          </p>
        </div>

        {/* Stats Overview - Mobile Optimized Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          {/* Total Balance Card (replacing Total Earnings) */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{t('dashboard.stats.totalBalance')}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{totalBalance.toLocaleString()} FSN</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl ml-2 sm:ml-3 flex-shrink-0">
                <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Available Balance Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{t('dashboard.stats.availableBalance')}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{balance.toLocaleString()} FSN</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl ml-2 sm:ml-3 flex-shrink-0">
                <FaWallet className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{t('dashboard.stats.referrals')}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {contextLoading ? (
                    <span className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    referrals
                  )}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl ml-2 sm:ml-3 flex-shrink-0">
                <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{t('dashboard.stats.miningLevel')}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{miningLevel}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg sm:rounded-xl ml-2 sm:ml-3 flex-shrink-0">
                <FaTrophy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile Optimized Grid */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{t('dashboard.quickActions.title')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.to} className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 h-full">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${action.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">{action.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Grid - Mobile Optimized */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{t('dashboard.features.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {features?.map((feature, index) => (
              <Link key={index} to={feature.to} className="group">
                <div className={`bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 h-full ${feature.highlight ? 'ring-2 ring-purple-500/50' : ''}`}>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      {feature.icon}
                    </div>
                    <FaArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{feature.description}</p>
                  {feature.highlight && (
                    <div className="mt-2 sm:mt-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {t('dashboard.features.popular')}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Additional Actions - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <button 
            onClick={() => setShowContactForm(true)}
            className="group bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaPhoneAlt className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <FaArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">{t('dashboard.contactSupport.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-400">{t('dashboard.contactSupport.description')}</p>
          </button>

          <Link to="/about" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 h-full">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaInfoCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <FaArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">{t('dashboard.aboutUs.title')}</h3>
              <p className="text-xs sm:text-sm text-gray-400">{t('dashboard.aboutUs.description')}</p>
            </div>
          </Link>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-slate-700 to-purple-700 px-4 sm:px-6 py-4 border-b border-white/10 rounded-t-xl sm:rounded-t-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-white">{t('dashboard.contactModal.title')}</h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">{t('dashboard.contactModal.subtitle')}</p>
              </div>
              <div className="p-4 sm:p-6">
                <form ref={formRef} onSubmit={sendEmail} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      {t('dashboard.contactModal.name')}
                    </label>
                    <input
                      type="text"
                      name="user_name"
                      value={userName}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-600 border border-white/10 rounded-lg text-gray-300 cursor-not-allowed text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      {t('dashboard.contactModal.email')}
                    </label>
                    <input
                      type="email"
                      name="user_email"
                      value={userEmail}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-600 border border-white/10 rounded-lg text-gray-300 cursor-not-allowed text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      {t('dashboard.contactModal.message')}
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none text-sm"
                      placeholder={t('dashboard.contactModal.messagePlaceholder')}
                      required
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sendingMessage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t('dashboard.contactModal.sending', 'Sending...')}
                        </>
                      ) : (
                        t('dashboard.contactModal.send')
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      {t('dashboard.contactModal.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
