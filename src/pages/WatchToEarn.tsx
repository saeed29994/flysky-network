// 📁 src/pages/WatchToEarn.tsx

import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, Clock, Coins, Play, CheckCircle, X, AlertCircle, Video, Monitor, Smartphone } from 'lucide-react';

const REQUIRED_ADS = 5;
const REWARD_FOR_ALL = 200;

const WatchToEarn = () => {
  const { t } = useTranslation();
  const [adsWatched, setAdsWatched] = useState(0);
  const [balance, setBalance] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [adTimer, setAdTimer] = useState(20);
  const [timerFinished, setTimerFinished] = useState(false);
  const [adStarted, setAdStarted] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

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

    fetchUserData();
  }, []);

  useEffect(() => {
    if (adStarted && adTimer > 0) {
      const interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (adStarted && adTimer === 0) {
      setTimerFinished(true);
      // Return to first modal after 20 seconds (without processing reward)
      setTimeout(() => {
        setAdStarted(false); // Go back to first modal
      }, 1000);
    }
  }, [adStarted, adTimer]);

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

  const handleWatchAd = () => {
    setShowModal(true);
    setAdTimer(20);
    setTimerFinished(false);
    setAdStarted(false);
  };

  const handleStartVideoAd = () => {
    setAdStarted(true);
    setTimerFinished(false); // Reset timer finished state
  };

  const handleConfirmAdWatched = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const currentIndex = userSnap.data()?.adIndex || 0;
    const currentWatched = userSnap.data()?.watchedAdsToday || 0;
    const nextIndex = (currentIndex + 1) % REQUIRED_ADS;
    const newWatched = currentWatched + 1;

    await updateDoc(userRef, {
      adIndex: nextIndex,
      watchedAdsToday: newWatched,
      adsLastWatched: serverTimestamp(),
    });

    setAdsWatched(newWatched);
    setCurrentAdIndex(nextIndex);
    toast.success(t("watchToEarn.adWatched"));
    closeModal();
  };

  const handleClaimReward = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const newBalance = balance + REWARD_FOR_ALL;

    await updateDoc(userRef, {
      balance: newBalance,
      watchedAdsToday: 0,
      adIndex: 0,
      adsLastWatched: serverTimestamp(),
    });

    setBalance(newBalance);
    setAdsWatched(0);
    setCurrentAdIndex(0);
    setCountdown(24 * 3600);

    toast.success(t("watchToEarn.rewardClaimed", { amount: REWARD_FOR_ALL }));
  };

  const closeModal = () => {
    setShowModal(false);
    setAdTimer(20);
    setTimerFinished(false);
    setAdStarted(false);
  };

  const progressPercent = (adsWatched / REQUIRED_ADS) * 100;
  const canClaim = adsWatched >= REQUIRED_ADS;

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
                {t("watchToEarn.description", { count: REQUIRED_ADS, reward: REWARD_FOR_ALL })}
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
                    <h2 className="text-xl font-bold text-white">FSN Rewards</h2>
                    <p className="text-gray-400">Earn tokens by watching video ads</p>
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
                    <h2 className="text-xl font-bold text-white">Watch Progress</h2>
                    <p className="text-gray-400">Track your daily video ad watching progress</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">Progress</span>
                    <span className="text-blue-400 font-bold">{adsWatched}/{REQUIRED_ADS}</span>
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
                      {Math.round(progressPercent)}% Complete
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{adsWatched}</div>
                    <div className="text-sm text-gray-400">Video Ads Watched Today</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{balance}</div>
                    <div className="text-sm text-gray-400">Current Balance (FSN)</div>
                  </div>
                </div>

                {/* Action Button */}
                {countdown > 0 ? (
                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-red-400" />
                      <span className="text-white font-semibold">Wait Time</span>
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
                    {t("watchToEarn.claimRewards")} ({REWARD_FOR_ALL} FSN)
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
                    <h3 className="text-lg font-bold text-white">How It Works</h3>
                    <p className="text-sm text-gray-400">Simple 3-step process</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Watch Video Ads</h4>
                      <p className="text-gray-400 text-xs">Watch {REQUIRED_ADS} video ads daily</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Complete Viewing</h4>
                      <p className="text-gray-400 text-xs">Watch each ad completely (20 seconds)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Claim Rewards</h4>
                      <p className="text-gray-400 text-xs">Earn {REWARD_FOR_ALL} FSN tokens</p>
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
                    <h3 className="text-lg font-bold text-white">Rewards Info</h3>
                    <p className="text-sm text-gray-400">Daily earning structure</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">Daily Limit</span>
                      <span className="text-blue-400 font-bold text-sm">{REQUIRED_ADS} Video Ads</span>
                    </div>
                    <p className="text-xs text-gray-300">Watch {REQUIRED_ADS} video ads per day</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">Daily Reward</span>
                      <span className="text-green-400 font-bold text-sm">{REWARD_FOR_ALL} FSN</span>
                    </div>
                    <p className="text-xs text-gray-300">Complete all ads to claim</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">Ad Duration</span>
                      <span className="text-purple-400 font-bold text-sm">20 Seconds</span>
                    </div>
                    <p className="text-xs text-gray-300">Each video ad is 20 seconds long</p>
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
            // 20-Second Ad Modal
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
                <h2 className="text-lg font-bold mb-1">Video Ad</h2>
                <p className="text-gray-400 text-sm">Please watch the complete ad</p>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-bold">{adTimer}</span>
                    <span className="text-blue-400 text-sm">seconds</span>
                  </div>
                </div>
              </div>

              {/* Ad Placeholder - Compact */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-4 mb-4 text-center border border-gray-600">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Play className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Video Ad Placeholder</h3>
                <p className="text-gray-400 text-xs">This is where the actual video ad will be displayed</p>
              </div>

              {/* Progress Info */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 mb-4 border border-blue-500/30">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Please wait for the ad to complete</span>
                </div>
              </div>

              {/* Loading Spinner */}
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-400">Processing ad completion...</p>
              </div>
            </motion.div>
          ) : (
            // Original Modal
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
                <p className="text-gray-400 text-sm">Watch video ad and earn rewards</p>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-4">
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{t("watchToEarn.timer")}</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{adTimer} {t("watchToEarn.seconds")}</div>
                </div>
              </div>

              {/* Action Button */}
              {!timerFinished ? (
                <button 
                  onClick={handleStartVideoAd} 
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" />
                  {t("watchToEarn.openAd")}
                </button>
              ) : (
                <button 
                  onClick={handleConfirmAdWatched} 
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t("watchToEarn.confirmAdWatched")}
                </button>
              )}

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
