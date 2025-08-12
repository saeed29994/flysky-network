import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { notifyMiningComplete } from '../utils/notifications';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaCoins, FaClock, FaChartLine, FaPlay, FaUnlock, FaCheckCircle, FaWallet } from 'react-icons/fa';
import { MINING_CYCLE_SECONDS } from '../utils/planConstants';
import { fetchPlansFromFirebase, FirebasePlan } from '../utils/plansService';
import PlanComparisonCard from './PlanComparisonCard';
import { useUserPlan } from '../contexts/UserPlanContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface MiningCardProps {
  plan: 'economy' | 'business' | 'first' | 'first-6' | 'first-lifetime';
  onClaim: (amount: number) => void;
  balance: number;
}

const MiningCard = ({ plan, onClaim, balance }: MiningCardProps) => {
  const { t } = useTranslation();
  const { userData, dailyMined: contextDailyMined } = useUserPlan();
  const sentNotification = useRef(false);

  const [mined, setMined] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [claimReady, setClaimReady] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [showUnlock, setShowUnlock] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState<FirebasePlan | null>(null);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Map legacy 'first' to 'first-lifetime' for compatibility
  const normalizedPlan = (plan === 'first' ? 'first-lifetime' : plan) as 'economy' | 'business' | 'first-6' | 'first-lifetime';

  // Fetch plans data from Firebase
  useEffect(() => {
    const loadPlansData = async () => {
      try {
        setIsLoading(true);
        const plans = await fetchPlansFromFirebase();
        
        // Get current plan data
        if (plans[normalizedPlan]) {
          setCurrentPlanData(plans[normalizedPlan]);
          setDailyLimit(plans[normalizedPlan].dailyMiningReward);
        } else {
          console.error(`Plan ${normalizedPlan} not found in Firebase`);
          setDailyLimit(0);
        }
      } catch (error) {
        console.error('Error loading plans data:', error);
        setDailyLimit(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlansData();
  }, [normalizedPlan]);

  // Calculate mining rate based on daily limit from Firebase
  const miningRate = dailyLimit > 0 ? dailyLimit / MINING_CYCLE_SECONDS : 0;

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const startTimestamp = data.miningStartTime;
      if (!startTimestamp) {
        setFirstTime(true);
        setMined(0);
        setStartTime(null);
        setClaimReady(false);
        setIsMaxed(false);
        setRemainingTime(0);
      } else {
        const startDate = typeof startTimestamp.toDate === 'function'
          ? startTimestamp.toDate()
          : new Date(startTimestamp);
        setStartTime(startDate);

        let safeMined = 0;
        if (typeof data.dailyMined === 'number' && !isNaN(data.dailyMined)) {
          safeMined = data.dailyMined;
        } else {
          await updateDoc(userRef, { dailyMined: 0 });
        }

        setMined(safeMined);
        setFirstTime(false);
        setInitialized(true);
      }
    } else {
      // User document doesn't exist, set as first time mining
      setFirstTime(true);
      setMined(0);
      setStartTime(null);
      setClaimReady(false);
      setIsMaxed(false);
    }

    const historyCol = collection(db, `users/${user.uid}/miningHistory`);
    const historyDocs = await getDocs(historyCol);
    const amounts: number[] = [];

    historyDocs.forEach((doc) => {
      const val = doc.data()?.amount;
      if (typeof val === 'number') {
        amounts.push(val);
      }
    });

    setHistory(amounts.slice(-7));
  };

  useEffect(() => {
    fetchUserData();
  }, [plan]);

  // Use data from context when available
  useEffect(() => {
    if (userData && initialized) {
      const currentMined = typeof contextDailyMined === 'number' && !isNaN(contextDailyMined) 
        ? contextDailyMined 
        : 0;
      
      setMined(currentMined);
    }
  }, [userData, contextDailyMined, initialized]);

  // Handle mining timer and progress
  useEffect(() => {
    if (!startTime || claimReady || isMaxed || firstTime || dailyLimit === 0) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const rawMined = elapsed * miningRate;
      const currentMined = Math.min(dailyLimit, isNaN(rawMined) ? 0 : rawMined);
      
      setMined(currentMined);

      if ((elapsed >= MINING_CYCLE_SECONDS || currentMined >= dailyLimit) && !claimReady) {
        setClaimReady(true);
        setIsMaxed(true);
        setRemainingTime(0);
        if (!sentNotification.current) {
          // Trigger the notification and set the flag
          notifyMiningComplete()
            .then(() => {
              console.log("✅ Mining completion notification triggered successfully");
              sentNotification.current = true;
            })
            .catch((error) => {
              console.error("❌ Error triggering mining notification:", error);
            });
        }
      } else {
        setRemainingTime(MINING_CYCLE_SECONDS - elapsed);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, plan, claimReady, isMaxed, miningRate, dailyLimit, firstTime]);

  useEffect(() => {
    if (claimReady) {
      setShowUnlock(true);
    }
  }, [claimReady]);

  const handleStartMining = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      miningStartTime: serverTimestamp(),
      dailyMined: 0,
      lastMiningTime: serverTimestamp() // Update lastMiningTime when mining starts
    });
    setStartTime(new Date());
    setFirstTime(false);
    setMined(0);
    setClaimReady(false);
    setIsMaxed(false);
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0h 0m 0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const chartData = {
    labels: history.map((_, i) => `${t('miningPage.day')} ${i + 1}`),
    datasets: [
      {
        label: t('miningPage.miningHistory'),
        data: history,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#f59e0b',
        borderColor: '#f59e0b',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  // Show loading state while fetching plan data
  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/20"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <FaCoins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('miningPage.loading')}</h2>
          <p className="text-gray-400 mb-6">{t('miningPage.loadingPlanData')}</p>
        </motion.div>
      </div>
    );
  }

  // Show error state if no plan data is available
  if (!currentPlanData || dailyLimit === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/20"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaCoins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('miningPage.planNotFound')}</h2>
          <p className="text-gray-400 mb-6">{t('miningPage.planNotFoundDesc')}</p>
        </motion.div>
      </div>
    );
  }

  if (firstTime) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/20"
        >
          <div className={`w-16 h-16 bg-gradient-to-r ${currentPlanData.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <FaCoins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('miningPage.readyToMine')}</h2>
          <p className="text-gray-400 mb-6">{t('dashboard.miningDesc')}</p>
          <button 
            onClick={handleStartMining} 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black w-full py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaPlay className="inline mr-2" />
            {t('miningPage.startMining')}
          </button>
        </motion.div>
      </div>
    );
  }

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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-amber-500/5"></div>
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
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <FaCoins className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                ⛏️ FSN {t('mining')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                {t('dashboard.miningDesc')}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Main Content Grid - Professional Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Mining Overview & Progress (8 columns on xl) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Compact Balance & Plan Overview - Using Grid for Better Space Utilization */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Balance Card - Compact */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FaWallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('miningPage.balance')}</h3>
                    <p className="text-xs text-gray-400">{t('miningPage.available')}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {balance.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400 font-semibold">{t('miningPage.fsn')}</div>
                </div>
              </div>

              {/* Plan Info Card - Compact */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${currentPlanData.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <FaCoins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentPlanData.name}</h3>
                    <p className="text-xs text-gray-400">{t('miningPage.currentPlan')}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{dailyLimit}</div>
                  <div className="text-xs text-amber-400 font-semibold">{t('miningPage.dailyLimit')}</div>
                </div>
              </div>

              {/* Mining Progress Card - Compact */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FaChartLine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('miningPage.progress')}</h3>
                    <p className="text-xs text-gray-400">{t('miningPage.currentCycle')}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{Math.floor(mined)}</div>
                  <div className="text-xs text-yellow-400 font-semibold">
                    {Math.round((mined / dailyLimit) * 100)}% {t('miningPage.complete')}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mining Progress Card - Full Size */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <div className="text-center mb-6">
                <div className="text-5xl font-extrabold text-white mb-2">
                  {isNaN(mined) ? 0 : Math.floor(mined)}
        </div>
                <div className="text-xl text-yellow-400 font-semibold mb-4">{t('miningPage.fsn')} {t('mining')}</div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(mined / dailyLimit) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
        </div>
                
                <div className="text-sm text-gray-400">
                  {Math.floor(mined)} / {dailyLimit} {t('miningPage.fsn')}
                </div>
              </div>

              {/* Time Remaining */}
              {!claimReady && (
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center justify-center gap-3">
                    <FaClock className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">{t('miningPage.timeRemaining')}:</span>
                    <span className="text-blue-400 font-bold">{formatTime(remainingTime)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6">
        {claimReady && showUnlock && (
          <button
            onClick={() => {
              window.open('https://otieu.com/4/9386723', '_blank');
              setShowUnlock(false);
            }}
                    className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
                    <FaUnlock className="inline mr-2" />
            {t('miningPage.unlockRewards')}
          </button>
        )}

        {claimReady && !showUnlock && (
          <button
            onClick={async () => {
              onClaim(Math.floor(mined));
              setClaimReady(false);
              setIsMaxed(false);
              setShowUnlock(false);
              sentNotification.current = false;
              const user = auth.currentUser;
              if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                  miningStartTime: serverTimestamp(),
                  dailyMined: 0,
                  lastMiningTime: serverTimestamp() // Update lastMiningTime when claiming
                });
                setStartTime(new Date());
                setMined(0);
              }
            }}
                    className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
                    <FaCheckCircle className="inline mr-2" />
                    {t('miningPage.claim')} {Math.floor(mined)} FSN
          </button>
        )}

        {!claimReady && (
          <button
            disabled
            className="w-full py-4 rounded-xl font-bold bg-gray-700 text-gray-400 cursor-not-allowed transition-all duration-300"
          >
            <FaClock className="inline mr-2" />
            {t('miningPage.miningInProgress')}
          </button>
        )}
        
      </div>
            </motion.div>

            {/* Mining History Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaChartLine className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">{t('miningPage.miningHistory')}</h3>
              </div>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </motion.div>
          </div>

          {/* Right Column - Plan Details, Stats & Upgrade (4 columns on xl) */}
          <div className="xl:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6 sticky top-8"
            >
              {/* Plan Details Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-r ${currentPlanData.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <FaCoins className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('miningPage.fsnDailyMining')}</h2>
                    <p className="text-gray-400">{currentPlanData.name}</p>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                    <span className="text-gray-300">{t('miningPage.dailyMiningRewards')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                    <span className="text-gray-300">{t('miningPage.miningCycles')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"></div>
                    <span className="text-gray-300">{t('miningPage.manualClaimSystem')}</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaChartLine className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">
                        {claimReady ? 'Ready to Claim' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <FaChartLine className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('miningPage.miningStats')}</h3>
                    <p className="text-sm text-gray-400">{t('miningPage.performanceOverview')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('miningPage.currentMined')}</span>
                    <span className="text-yellow-400 font-semibold">{Math.floor(mined)} FSN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('miningPage.dailyLimit')}</span>
                    <span className="text-white font-semibold">{dailyLimit} FSN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('miningPage.progress')}</span>
                    <span className="text-green-400 font-semibold">{Math.round((mined / dailyLimit) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Plan Comparison Card - Upgrade Membership Widget */}
              <PlanComparisonCard userPlan={normalizedPlan} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningCard;