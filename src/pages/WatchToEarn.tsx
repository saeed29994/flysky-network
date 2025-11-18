// 📁 src/pages/WatchToEarn.tsx

import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, Clock, Coins, Play, CheckCircle, X, AlertCircle, Video, Loader2} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import admobService from '../services/admobService'; // eslint-disable-line

const WatchToEarn = () => {
  const { t } = useTranslation();
  const [adsWatched, setAdsWatched] = useState(0);
  const [balance, setBalance] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [adStarted, setAdStarted] = useState(false);
  const [, setCurrentAdIndex] = useState(0); // Used in handleConfirmAdWatched and handleClaimReward
  // Config values fetched from Firestore; no static defaults
  const [requiredAds, setRequiredAds] = useState<number>(0);
  const [rewardForAll, setRewardForAll] = useState<number>(0);
  // Web timer states (for web platform)
  const [adTimer, setAdTimer] = useState(20);
  const [timerFinished, setTimerFinished] = useState(false);
  // AdMob states (for native platforms)
  const [adLoading, setAdLoading] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [isNativePlatform, setIsNativePlatform] = useState(false);

  // Initialize AdMob on component mount
  useEffect(() => {
    const initAdMob = async () => {
      const isNative = Capacitor.isNativePlatform();
      setIsNativePlatform(isNative);
      
      if (isNative) {
        try {
          await admobService.initialize();
          // Pre-load ad when component mounts
          await prepareAd();
        } catch (error: any) {
          // Only show error if it's not the expected UNIMPLEMENTED error
          if (error?.code !== 'UNIMPLEMENTED') {
            console.error('Failed to initialize AdMob:', error);
            setAdError('AdMob initialization failed');
          }
        }
      } else {
        console.log('📱 Running on web - AdMob features disabled (use native iOS/Android app for ads)');
      }
    };
    
    initAdMob();
  }, []);

  // Prepare ad (pre-load)
  const prepareAd = async () => {
    if (!isNativePlatform) return;
    
    try {
      setAdLoading(true);
      setAdError(null);
      
      await admobService.prepareRewardedAd({
        onAdLoaded: () => {
          setAdReady(true);
          setAdLoading(false);
          console.log('✅ Ad ready to show');
        },
        onAdFailedToLoad: (error) => {
          setAdError(error);
          setAdLoading(false);
          setAdReady(false);
          console.error('❌ Ad failed to load:', error);
        },
      });
    } catch (error: any) {
      setAdError(error.message || 'Failed to prepare ad');
      setAdLoading(false);
      setAdReady(false);
    }
  };

  useEffect(() => {
    const fetchConfigAndUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Load watchAds config from rewards/watchAds (single document)
      try {
        const cfgRef = doc(db, 'rewards', 'watchAds');
        const cfgSnap = await getDoc(cfgRef);
        if (cfgSnap.exists()) {
          const cfg = cfgSnap.data() as any;
          setRequiredAds(typeof cfg.dailyLimit === 'number' ? cfg.dailyLimit : 0);
          setRewardForAll(typeof cfg.collectBonus === 'number' ? cfg.collectBonus : 0);
        }
      } catch (e) {
        // Do not apply static defaults; keep 0s
      }

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const lastWatched = data?.adsLastWatched?.toDate?.() || new Date(0);
        const today = new Date();
        const hoursDiff = (today.getTime() - lastWatched.getTime()) / (1000 * 60 * 60);

        let watchedToday = typeof data?.watchedAdsToday === 'number' ? data.watchedAdsToday : 0;
        if (hoursDiff >= 24) {
          watchedToday = 0;
          await updateDoc(userRef, { watchedAdsToday: 0, adIndex: 0 });
        }

        setAdsWatched(watchedToday);
        setBalance(data?.balance || 0);
        setCurrentAdIndex(data?.adIndex || 0);

        if (watchedToday === 0 && hoursDiff < 24) {
          const secondsLeft = 24 * 3600 - Math.floor((today.getTime() - lastWatched.getTime()) / 1000);
          setCountdown(secondsLeft);
        } else {
          setCountdown(0);
        }
      }
    };

    fetchConfigAndUserData();
  }, []);

  // Timer effect for web platform (fake timer)
  useEffect(() => {
    if (!isNativePlatform && adStarted && adTimer > 0) {
      const interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (!isNativePlatform && adStarted && adTimer === 0) {
      setTimerFinished(true);
      // Auto-confirm after timer finishes (web only)
      setTimeout(() => {
        handleConfirmAdWatched();
      }, 500);
    }
  }, [adStarted, adTimer, isNativePlatform]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleWatchAd = async () => {
    if (requiredAds <= 0) {
      toast.error('Watch Ads is currently unavailable');
      return;
    }
    if (adsWatched >= requiredAds) {
      toast.error('Daily ad limit reached');
      return;
    }

    // For web: use fake timer approach
    if (!isNativePlatform) {
      setShowModal(true);
      setAdTimer(20);
      setTimerFinished(false);
      setAdStarted(false);
      return;
    }

    // For native: use AdMob
    // Check if ad is ready, if not prepare it
    if (!adReady && !adLoading) {
      await prepareAd();
    }

    setShowModal(true);
    setAdError(null);
  };

  const handleStartVideoAd = async () => {
    if (requiredAds <= 0 || adsWatched >= requiredAds) {
      return;
    }

    // For web: start fake timer
    if (!isNativePlatform) {
      setAdStarted(true);
      setTimerFinished(false);
      setAdTimer(20); // Reset timer
      return;
    }

    // For native: show AdMob ad
    if (!adReady) {
      toast.error('Ad is not ready yet. Please wait...');
      if (!adLoading) {
        await prepareAd();
      }
      return;
    }

    try {
      setAdStarted(true);
      setAdError(null);
      
      await admobService.showRewardedAd({
        onAdRewarded: async (reward) => {
          console.log('🎉 User earned reward:', reward);
          // Ad successfully watched - update Firebase
          await handleConfirmAdWatched();
        },
        onAdClosed: () => {
          setAdStarted(false);
          setAdReady(false);
          // Prepare next ad
          prepareAd();
        },
        onAdFailedToLoad: (error) => {
          setAdError(error);
          setAdStarted(false);
          toast.error(`Ad error: ${error}`);
        },
        onAdOpened: () => {
          console.log('📱 Ad opened');
        },
      });
    } catch (error: any) {
      console.error('Error showing ad:', error);
      setAdError(error.message || 'Failed to show ad');
      setAdStarted(false);
      toast.error('Failed to show ad. Please try again.');
    }
  };

  const handleConfirmAdWatched = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const cfgRef = doc(db, 'rewards', 'watchAds');

    let txNewWatched = 0;
    let txNextIndex = 0;

    try {
      await runTransaction(db, async (tx) => {
        const [userSnapTx, cfgSnap] = await Promise.all([tx.get(userRef), tx.get(cfgRef)]);
        if (!cfgSnap.exists()) throw new Error('CFG_MISSING');
        const cfg = cfgSnap.data() as any;
        const limit = typeof cfg.dailyLimit === 'number' ? cfg.dailyLimit : 0;
        if (typeof cfg.status === 'string' && cfg.status === 'inactive') throw new Error('CFG_INACTIVE');
        if (limit <= 0) throw new Error('CFG_DISABLED');

        const usr = userSnapTx.data() || {};
        const currentIndex = usr.adIndex || 0;
        const currentWatched = usr.watchedAdsToday || 0;
        if (currentWatched >= limit) throw new Error('LIMIT');

        txNextIndex = (currentIndex + 1) % limit;
        txNewWatched = Math.min(currentWatched + 1, limit);

        tx.update(userRef, {
          adIndex: txNextIndex,
          watchedAdsToday: txNewWatched,
          adsLastWatched: serverTimestamp(),
        });
      });

      setAdsWatched(txNewWatched);
      setCurrentAdIndex(txNextIndex);
      toast.success(t('watchToEarn.adWatched'));
      closeModal();
    } catch (e: any) {
      const code = e?.message || '';
      if (code === 'CFG_MISSING' || code === 'CFG_DISABLED' || code === 'CFG_INACTIVE') {
        toast.error('Watch Ads is currently unavailable');
      } else if (code === 'LIMIT') {
        toast.error('Daily ad limit reached');
      } else {
        toast.error('Failed to record ad watch');
      }
      closeModal();
    }
  };

  const handleClaimReward = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const cfgRef = doc(db, 'rewards', 'watchAds');

    let txNewBalance = balance;
    let txReward = 0;

    try {
      await runTransaction(db, async (tx) => {
        const [userSnapTx, cfgSnap] = await Promise.all([tx.get(userRef), tx.get(cfgRef)]);
        if (!cfgSnap.exists()) throw new Error('CFG_MISSING');
        const cfg = cfgSnap.data() as any;
        const limit = typeof cfg.dailyLimit === 'number' ? cfg.dailyLimit : 0;
        const reward = typeof cfg.collectBonus === 'number' ? cfg.collectBonus : 0;
        if (typeof cfg.status === 'string' && cfg.status === 'inactive') throw new Error('CFG_INACTIVE');
        if (limit <= 0 || reward <= 0) throw new Error('CFG_DISABLED');

        const usr = userSnapTx.data() || {};
        const currentWatched = usr.watchedAdsToday || 0;
        const currentBalance = usr.balance || 0;
        if (currentWatched < limit) throw new Error('NOT_ELIGIBLE');

        txNewBalance = currentBalance + reward;
        txReward = reward;

        // Get current transaction history
        const currentTransactionHistory = usr.transactionHistory || [];
        
        tx.update(userRef, {
          balance: txNewBalance,
          watchedAdsToday: 0,
          adIndex: 0,
          adsLastWatched: serverTimestamp(),
          // Add transaction to history
          transactionHistory: [...currentTransactionHistory, {
            description: `Watch-to-earn reward claimed (+${reward.toLocaleString()} FSN)`,
            timestamp: Date.now(),
            type: 'watch_to_earn',
            amount: reward
          }]
        });
      });

      setBalance(txNewBalance);
      setAdsWatched(0);
      setCurrentAdIndex(0);
      setCountdown(24 * 3600);
      toast.success(t('watchToEarn.rewardClaimed', { amount: txReward }));
    } catch (e: any) {
      const code = e?.message || '';
      if (code === 'NOT_ELIGIBLE') {
        toast.error('You have not reached today\'s ad limit yet');
      } else if (code === 'CFG_MISSING' || code === 'CFG_DISABLED' || code === 'CFG_INACTIVE') {
        toast.error('Watch Ads is currently unavailable');
      } else {
        toast.error('Failed to claim reward');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setAdStarted(false);
    setAdError(null);
    setAdTimer(20);
    setTimerFinished(false);
  };

  const progressPercent = requiredAds > 0 ? (adsWatched / requiredAds) * 100 : 0;
  const canClaim = requiredAds > 0 && adsWatched >= requiredAds;

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Professional Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative px-4 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Eye className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                🎥 {t("watchToEarn.title")}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                {t("watchToEarn.description", { count: requiredAds, reward: rewardForAll })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Main Content Grid - Professional Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Main Content (8 columns on xl) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Banner Image - MOVED TO TOP */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('watchToEarn.fsnRewards')}</h2>
                    <p className="text-gray-400">{t('watchToEarn.earnTokensByWatching')}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <img 
                  src="/watch-to-eaen.png" 
                  alt="FSN Coin Rewards Banner" 
                  className="w-full h-auto rounded-xl shadow-lg object-cover" 
                />
              </div>
            </motion.div>
            
            {/* Watch Progress Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('watchToEarn.watchProgress')}</h2>
                    <p className="text-gray-400">{t('watchToEarn.trackDailyProgress')}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">{t('watchToEarn.progress')}</span>
                    <span className="text-blue-400 font-bold">{adsWatched}/{requiredAds}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 transition-all duration-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm text-gray-400">
                      {Math.round(progressPercent)}% {t('watchToEarn.complete')}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{adsWatched}</div>
                    <div className="text-sm text-gray-400">{t('watchToEarn.videoAdsWatchedToday')}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{balance}</div>
                    <div className="text-sm text-gray-400">{t('watchToEarn.currentBalanceFSN')}</div>
                  </div>
                </div>

                {/* Action Button */}
                {countdown > 0 ? (
                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-red-400" />
                      <span className="text-white font-semibold">{t('watchToEarn.waitTime')}</span>
                    </div>
                    <p className="text-red-400 font-bold text-center">
                      {t("watchToEarn.waitMessage", { time: formatTime(countdown) })}
                    </p>
                  </div>
                ) : !canClaim ? (
                  <button 
                    onClick={handleWatchAd} 
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <Video className="w-5 h-5" />
                    {t("watchToEarn.watchAd")}
                  </button>
                ) : (
                  <button 
                    onClick={handleClaimReward} 
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 animate-pulse"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {t("watchToEarn.claimRewards")} ({rewardForAll} FSN)
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Info (4 columns on xl) */}
          <div className="xl:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6 sticky top-8"
            >
              {/* How It Works Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('watchToEarn.howItWorks')}</h3>
                    <p className="text-sm text-gray-400">{t('watchToEarn.simple3StepProcess')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{t('watchToEarn.watchVideoAds')}</h4>
                      <p className="text-gray-400 text-xs">{t('watchToEarn.watchAdsDaily', { count: requiredAds })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{t('watchToEarn.completeViewing')}</h4>
                      <p className="text-gray-400 text-xs">{t('watchToEarn.watchEachAdCompletely')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{t('watchToEarn.claimRewards')}</h4>
                      <p className="text-gray-400 text-xs">{t('watchToEarn.earnFSNTokens', { amount: rewardForAll })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('watchToEarn.rewardsInfo')}</h3>
                    <p className="text-sm text-gray-400">{t('watchToEarn.dailyEarningStructure')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{t('watchToEarn.dailyLimit')}</span>
                      <span className="text-blue-400 font-bold text-sm">{requiredAds} {t('watchToEarn.videoAds')}</span>
                    </div>
                     <p className="text-xs text-gray-300">{t('watchToEarn.watchAdsPerDay', { count: requiredAds })}</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{t('watchToEarn.dailyReward')}</span>
                      <span className="text-green-400 font-bold text-sm">{rewardForAll} FSN</span>
                    </div>
                    <p className="text-xs text-gray-300">{t('watchToEarn.completeAllAdsToClaim')}</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{t('watchToEarn.adDuration')}</span>
                      <span className="text-purple-400 font-bold text-sm">{t('watchToEarn.twentySeconds')}</span>
                    </div>
                    <p className="text-xs text-gray-300">{t('watchToEarn.eachAdTwentySeconds')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Video Ad Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          {adStarted ? (
            // Ad is showing
            isNativePlatform ? (
              // Native: AdMob handles the actual ad display
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-white relative border border-white/20 max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">{t('watchToEarn.videoAd')}</h2>
                  <p className="text-gray-400 text-sm">{t('watchToEarn.pleaseWatchCompleteAd')}</p>
                </div>

                {/* Ad Info */}
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 mb-4 border border-blue-500/30">
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <Video className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('watchToEarn.adIsPlaying')}</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 mb-4 border border-yellow-500/30">
                  <div className="flex items-start gap-2 text-yellow-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">{t('watchToEarn.watchCompleteAdToEarn')}</p>
                  </div>
                </div>

                {/* Loading Spinner */}
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">{t('watchToEarn.processingAdCompletion')}</p>
                </div>
              </motion.div>
            ) : (
              // Web: Show timer
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-white relative border border-white/20 max-h-[90vh] overflow-y-auto"
              >
                {/* Progress Indicator on Top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 rounded-t-2xl overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${((20 - adTimer) / 20) * 100}%` }}
                  ></div>
                </div>

                {/* Header */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">{t('watchToEarn.videoAd')}</h2>
                  <p className="text-gray-400 text-sm">{t('watchToEarn.pleaseWatchCompleteAd')}</p>
                </div>

                {/* Timer Display */}
                <div className="text-center mb-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-bold">{adTimer}</span>
                      <span className="text-blue-400 text-sm">{t('watchToEarn.seconds')}</span>
                    </div>
                  </div>
                </div>

                {/* Ad Placeholder */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-4 mb-4 text-center border border-gray-600">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Play className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{t('watchToEarn.videoAdPlaceholder')}</h3>
                  <p className="text-gray-400 text-xs">{t('watchToEarn.videoAdPlaceholderDescription')}</p>
                </div>

                {/* Progress Info */}
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 mb-4 border border-blue-500/30">
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('watchToEarn.pleaseWaitForAdComplete')}</span>
                  </div>
                </div>

                {/* Loading Spinner */}
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">{t('watchToEarn.processingAdCompletion')}</p>
                </div>
              </motion.div>
            )
          ) : (
            // Pre-ad Modal (before showing ad)
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-white relative border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={closeModal} 
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold mb-1">{t("watchToEarn.adModalTitle")}</h2>
                <p className="text-gray-400 text-sm">{t('watchToEarn.watchVideoAdAndEarn')}</p>
              </div>

              {/* Ad Status Display - Only for native platforms */}
              {isNativePlatform && (
                <>
                  {adError ? (
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 mb-4 border border-red-500/30">
                      <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold">{t('watchToEarn.adError')}</span>
                      </div>
                      <p className="text-xs text-red-300 text-center">{adError}</p>
                      <button
                        onClick={prepareAd}
                        className="mt-3 w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
                      >
                        {t('watchToEarn.retryLoadingAd')}
                      </button>
                    </div>
                  ) : adLoading ? (
                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 mb-4 border border-blue-500/30">
                      <div className="flex items-center justify-center gap-2 text-blue-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">{t('watchToEarn.loadingAd')}</span>
                      </div>
                    </div>
                  ) : adReady ? (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 mb-4 border border-green-500/30">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('watchToEarn.adReady')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 mb-4 border border-yellow-500/30">
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('watchToEarn.preparingAd')}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Timer Display - Only for web platform */}
              {!isNativePlatform && (
                <div className="text-center mb-4">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{t("watchToEarn.timer")}</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{adTimer} {t("watchToEarn.seconds")}</div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={handleStartVideoAd}
                disabled={isNativePlatform && (adLoading || !adReady || !!adError)}
                className={`w-full py-4 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 ${
                  isNativePlatform && (adLoading || !adReady || adError)
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                }`}
              >
                {isNativePlatform ? (
                  <>
                    {adLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("watchToEarn.loadingAd")}
                      </>
                    ) : adError ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        {t("watchToEarn.adNotAvailable")}
                      </>
                    ) : adReady ? (
                      <>
                        <Play className="w-5 h-5" />
                        {t("watchToEarn.openAd")}
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5" />
                        {t("watchToEarn.waitingForAd")}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {timerFinished ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        {t("watchToEarn.confirmAdWatched")}
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        {t("watchToEarn.openAd")}
                      </>
                    )}
                  </>
                )}
              </button>

              {/* Stay on Page Notice */}
              <div className="mt-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-500/30">
                <p className="text-sm text-blue-400 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {t("watchToEarn.stayOnPage")}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
};

export default WatchToEarn;
