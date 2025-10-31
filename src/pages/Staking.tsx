import { useState, useEffect, type FormEvent } from 'react';
import { auth, db } from '../firebase';
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  getDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import StakingCard from '../components/StakingCard';
import PlanComparisonCard from '../components/PlanComparisonCard';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaCoins, FaRocket, FaClock, FaTrophy, FaChartLine,
  FaLock, FaUnlock, FaChevronDown, FaChevronUp, FaHistory, FaPlay, FaArrowRight,
  FaShieldAlt, FaChartBar, FaCalendarCheck
} from 'react-icons/fa';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StakingEntry {
  id: string;
  amount: number;
  duration: number;
  planType: string;
  startDate: Timestamp;
  endDate: Timestamp;
  expectedReturn: number;
  status: 'active' | 'completed';
  claimed: boolean;
}

const getPlanLabel = (plan: string, t: any) => {
  switch (plan) {
    case 'business': return t('plans.business');
    case 'first-6': return t('first6');
    case 'first-lifetime': return t('firstLifetime');
    default: return t('plans.economy');
  }
};

const StakingPage = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState('economy');
  const [userDocData, setUserDocData] = useState<any>(null);
  const [planNameToId, setPlanNameToId] = useState<Record<string, string>>({});
  const [planIds, setPlanIds] = useState<Set<string>>(new Set());
  const [planSlugToId, setPlanSlugToId] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('1');
  const [stakingList, setStakingList] = useState<StakingEntry[]>([]);
  const [lockedAmount, setLockedAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [planDurations, setPlanDurations] = useState<Array<{ months: number; apy: number }>>([]);

  const selectedMonths = parseInt(duration);
  const selectedApy = planDurations.find(d => d.months === selectedMonths)?.apy ?? 0;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch plans for name → id normalization
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const snap = await getDocs(collection(db, 'plans'));
        const mapping: Record<string, string> = {};
        const ids: Set<string> = new Set();
        const slugMap: Record<string, string> = {};
        const slugify = (s: string) => String(s || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        snap.forEach((d) => {
          const data: any = d.data();
          ids.add(d.id);
          if (data?.name) mapping[String(data.name)] = d.id;
          // Build slug mapping for both id and name
          slugMap[slugify(d.id)] = d.id;
          if (data?.name) slugMap[slugify(String(data.name))] = d.id;
        });
        setPlanNameToId(mapping);
        setPlanIds(ids);
        setPlanSlugToId(slugMap);
      } catch (_) {
        // ignore
      }
    };
    loadPlans();
  }, []);

  // Load APY config from Firestore -> rewards/staking (per-plan aware)
  useEffect(() => {
    const loadStakingConfig = async () => {
      try {
        const cfgRef = doc(db, 'rewards', 'staking');
        const snap = await getDoc(cfgRef);
        if (snap.exists()) {
          const data: any = snap.data();
          const plansMap: Record<string, any[]> = data?.plans || {};
          const keys = Object.keys(plansMap);
          const slugify = (s: string) => String(s || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          // Try to resolve the correct key in rewards config for the current plan
          let resolvedKey: string | null = null;
          if (keys.includes(plan)) {
            resolvedKey = plan;
          } else {
            const planLower = plan.toLowerCase();
            const planSlug = slugify(plan);
            // progressively relaxed matching
            resolvedKey = keys.find(k => k.toLowerCase() === planLower) ||
                          keys.find(k => slugify(k) === planSlug) ||
                          keys.find(k => planLower.includes(k.toLowerCase())) ||
                          keys.find(k => k.toLowerCase().includes(planLower)) ||
                          null;
          }

          const planArr: any[] = resolvedKey && Array.isArray(plansMap[resolvedKey]) ? plansMap[resolvedKey] : [];
          const durations: any[] = planArr.length > 0 ? planArr : (Array.isArray(data?.durations) ? data.durations : []);
          const parsed: Array<{ months: number; apy: number }> = durations
            .map((d) => {
              const months = Number(d.months || d.duration);
              let apy = Number(d.apy);
              if (!isFinite(apy)) apy = 0;
              const decimal = apy > 1 ? apy / 100 : apy;
              return { months, apy: decimal };
            })
            .filter((d) => d.months > 0)
            .sort((a, b) => a.months - b.months);
          setPlanDurations(parsed);
          if (parsed.length > 0) {
            if (!parsed.some(d => String(d.months) === duration)) {
              setDuration(String(parsed[0].months));
            }
          } else {
            // No durations configured for this plan; clear selection
            setDuration('');
          }
        } else {
          // No rewards config; clear durations
          setPlanDurations([]);
          setDuration('');
        }
      } catch (e) {
        // On error, clear durations
        setPlanDurations([]);
        setDuration('');
      }
    };
    loadStakingConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setBalance(data.balance || 0);
        setUserDocData(data);
      }
    });

    const stakeRef = query(collection(db, 'users', user.uid, 'staking'));
    const unsubStake = onSnapshot(stakeRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StakingEntry[];
      setStakingList(list);

      const totalLocked = list.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);

      setLockedAmount(totalLocked);
    });

    return () => {
      unsubUser();
      unsubStake();
    };
  }, [user]);

  // Normalize plan from user doc whenever userDocData or planNameToId changes
  useEffect(() => {
    if (!userDocData) return;
    const candidates: string[] = [];
    if (userDocData.membership?.planName) candidates.push(String(userDocData.membership.planName));
    if (userDocData.plan) candidates.push(String(userDocData.plan));
    candidates.push('economy');

    let resolved: string | null = null;
    for (const c of candidates) {
      const val = String(c).trim();
      if (!val) continue;
      // exact id match
      if (planIds.has(val)) { resolved = val; break; }
      // name -> id
      if (planNameToId[val]) { resolved = planNameToId[val]; break; }
      // slug match against id or name
      const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (planSlugToId[slug]) { resolved = planSlugToId[slug]; break; }
    }

    setPlan(resolved || 'economy');
  }, [userDocData, planNameToId, planIds, planSlugToId]);

  const handleStake = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error(t('error.userNotLoaded'));

    const amountNum = parseFloat(amount);
    const durationNum = parseInt(duration);

    if (isNaN(amountNum) || isNaN(durationNum)) {
      toast.error(t('error.invalidAmount'));
      return;
    }

    if (amountNum > balance) {
      toast.error(t('error.exceedsBalance'));
      return;
    }

    const expectedReturn = amountNum * (1 + selectedApy);
    const startDate = Timestamp.now();
    const endDate = Timestamp.fromDate(new Date(Date.now() + durationNum * 30 * 24 * 60 * 60 * 1000));

    setLoading(true);

    try {
      await addDoc(collection(db, 'users', user.uid, 'staking'), {
        amount: amountNum,
        duration: durationNum,
        planType: plan,
        startDate,
        endDate,
        expectedReturn,
        status: 'active',
        claimed: false
      });

      // Get current transaction history
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};
      const currentTransactionHistory = userData.transactionHistory || [];

      await updateDoc(userRef, {
        balance: balance - amountNum,
        // Add transaction to history
        transactionHistory: [...currentTransactionHistory, {
          description: `Staked ${amountNum.toLocaleString()} FSN for ${durationNum} months`,
          timestamp: Date.now(),
          type: 'staking',
          amount: -amountNum
        }]
      });

      toast.success(t('success.stakeCreated'));
      setAmount('');
    } catch (error) {
      console.error('❌ Error creating stake:', error);
      toast.error(t('error.stakeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (stake: StakingEntry) => {
    if (!user) return toast.error(t('error.notAuthenticated'));
    if (stake.claimed) return toast.error(t('error.alreadyClaimed'));

    const now = new Date();
    const end = stake.endDate.toDate();
    if (now < end) return toast.error(t('error.notEndedYet'));

    try {
      const stakeDocRef = doc(db, 'users', user.uid, 'staking', stake.id);
      await updateDoc(stakeDocRef, {
        claimed: true,
        status: 'completed'
      });

      const userDocRef = doc(db, 'users', user.uid);
      // Get current transaction history
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.data() || {};
      const currentTransactionHistory = userData.transactionHistory || [];

      await updateDoc(userDocRef, {
        balance: balance + stake.expectedReturn,
        // Add transaction to history
        transactionHistory: [...currentTransactionHistory, {
          description: `Staking reward claimed (+${stake.expectedReturn.toLocaleString()} FSN)`,
          timestamp: Date.now(),
          type: 'staking_reward',
          amount: stake.expectedReturn
        }]
      });

      toast.success(t('success.claimed'));
    } catch (error) {
      console.error("Claim failed:", error);
      toast.error(t('error.claimFailed'));
    }
  };

  const activeStakes = stakingList.filter(s => s.status === 'active');
  const completedStakes = stakingList.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      
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
                🔥 FSN {t('staking')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                {t('stakingPage.description')}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {!user && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-7xl mx-auto px-4 mb-8"
        >
          <div className="bg-red-500/20 backdrop-blur-sm text-red-400 text-center p-6 rounded-2xl border border-red-500/30">
            <FaShieldAlt className="w-6 h-6 mx-auto mb-2" />
            🚫 {t('loading.user')}
          </div>
        </motion.div>
      )}

      {user && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Main Content Grid - Professional Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Column - Staking Overview & Form (8 columns on xl) */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Staking Overview Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Current Plan Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <FaChartBar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{t('stakingPage.currentPlan')}</h3>
                      <p className="text-sm text-gray-400">{getPlanLabel(plan, t)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{t('stakingPage.availableBalance')}</span>
                      <span className="text-white font-semibold">{balance.toLocaleString()} FSN</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{t('stakingPage.lockedAmount')}</span>
                      <span className="text-amber-400 font-semibold">{lockedAmount.toLocaleString()} FSN</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FaChartLine className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{t('stakingPage.stakingStats')}</h3>
                      <p className="text-sm text-gray-400">{t('stakingPage.performanceOverview')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{t('stakingPage.activePositions')}</span>
                      <span className="text-green-400 font-semibold">{activeStakes.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{t('stakingPage.completed')}</span>
                      <span className="text-blue-400 font-semibold">{completedStakes.length}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* New Staking Form - Enhanced Design */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <FaRocket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{t('stakingPage.startNewStaking')}</h2>
                      <p className="text-gray-300 text-sm">{t('stakingPage.chooseAmountDuration')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleStake} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">{t('stakingPage.amountToStake')}</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder={t('stakingPage.enterAmount')}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none transition-all duration-300 text-lg"
                            required
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
                            FSN
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">{t('stakingPage.stakingDuration')}</label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:outline-none transition-all duration-300 h-auto data-[state=open]:border-amber-500 text-lg">
                            <SelectValue placeholder={t('stakingPage.selectDuration')} />
                          </SelectTrigger>
                          <SelectContent className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 text-white shadow-2xl">
                            {planDurations.map((d) => (
                              <SelectItem key={d.months} value={String(d.months)} className="hover:bg-white/10 focus:bg-white/10 text-white">
                                {d.months} {d.months === 1 ? 'Month' : 'Months'} - {(d.apy * 100).toFixed(0)}% APY
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {amount && duration && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-gray-400 text-sm mb-1">{t('stakingPage.stakedAmount')}</p>
                            <p className="text-white font-bold text-lg">{parseFloat(amount).toLocaleString()} FSN</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-sm mb-1">{t('stakingPage.expectedReturn')}</p>
                              <p className="text-amber-400 font-bold text-lg">
                                {(parseFloat(amount) * (1 + selectedApy)).toFixed(2)} FSN
                              </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-sm mb-1">{t('stakingPage.totalProfit')}</p>
                              <p className="text-green-400 font-bold text-lg">
                                +{(parseFloat(amount) * selectedApy).toFixed(2)} FSN
                              </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t('loading.processing')}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <FaRocket className="w-5 h-5" />
                          {t('startStaking')}
                          <FaArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Staking Card & Plan Comparison (4 columns on xl) */}
            <div className="xl:col-span-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6 sticky top-8"
              >
                <StakingCard plan={plan as any} lockedAmount={lockedAmount} />
                <PlanComparisonCard userPlan={plan} />
              </motion.div>
            </div>
          </div>

          {/* Staking Records Section - Full Width Below */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{t('stakingRecords')}</h2>
              <p className="text-gray-400">{t('stakingPage.trackPerformance')}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Active Staking Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                <button
                  onClick={() => setShowActive(!showActive)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FaPlay className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t('activeStaking')}</h3>
                      <p className="text-gray-400">{activeStakes.length} {t('stakingPage.activePositions')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    {showActive ? <FaChevronUp className="w-5 h-5 text-gray-400" /> : <FaChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                
                {showActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10"
                  >
                    {activeStakes.length > 0 ? (
                      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                        {activeStakes.map((stake) => {
                          const now = new Date();
                          const end = stake.endDate.toDate();
                          const start = stake.startDate.toDate();
                          const totalDuration = (end.getTime() - start.getTime()) / 1000;
                          const elapsed = (now.getTime() - start.getTime()) / 1000;
                          const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
                          const percent = Math.min(100, Math.floor((elapsed / totalDuration) * 100));
                          const canClaim = stake.status === 'active' && remaining <= 0;

                          return (
                            <motion.div 
                              key={stake.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <FaLock className="w-7 h-7 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xl font-bold text-white">{stake.amount.toLocaleString()} FSN</p>
                                    <p className="text-gray-400">{stake.duration} {t('duration.month')}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-400">{t('stakingPage.expectedReturn')}</p>
                                  <p className="text-xl font-bold text-green-400">{stake.expectedReturn.toFixed(2)} FSN</p>
                                </div>
                              </div>

                              <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400 flex items-center gap-2">
                                    <FaCalendarCheck className="w-4 h-4" />
                                    {t('stakingPage.endDate')}:
                                  </span>
                                  <span className="text-white font-medium">{end.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">{t('stakingPage.progress')}:</span>
                                  <span className="text-amber-400 font-bold">{percent}%</span>
                                </div>
                              </div>

                              {/* Enhanced Progress Bar */}
                              <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 relative"
                                  style={{ width: `${percent}%` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleClaim(stake)}
                                disabled={!canClaim || stake.claimed}
                                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 text-lg ${
                                  canClaim 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transform hover:scale-105 shadow-lg' 
                                    : 'bg-white/10 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {canClaim ? (
                                  <div className="flex items-center justify-center gap-3">
                                    <FaTrophy className="w-5 h-5" />
                                    {t('stakingSection.claimRewards')}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-3">
                                    <FaClock className="w-5 h-5" />
                                    {t('stakingSection.claimIn')}: {Math.floor(remaining / (3600 * 24))}d
                                  </div>
                                )}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-12 text-center border-t border-white/10">
                        <FaCoins className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                        <p className="text-gray-400 text-xl font-medium mb-2">{t('noActiveStaking')}</p>
                        <p className="text-gray-500">{t('stakingPage.startStakingToSee')}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Completed Staking Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FaHistory className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t('completedStaking')}</h3>
                      <p className="text-gray-400">{completedStakes.length} {t('stakingPage.completedPositions')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    {showCompleted ? <FaChevronUp className="w-5 h-5 text-gray-400" /> : <FaChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                
                {showCompleted && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10"
                  >
                    {completedStakes.length > 0 ? (
                      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                        {completedStakes.map((stake) => {
                          const end = stake.endDate.toDate();
                          return (
                            <motion.div 
                              key={stake.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white/5 rounded-xl p-5 border border-green-500/30 hover:border-green-500/50 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <FaUnlock className="w-7 h-7 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xl font-bold text-white">{stake.amount.toLocaleString()} FSN</p>
                                    <p className="text-gray-400">{stake.duration} {t('duration.month')}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-400">{t('stakingPage.returned')}</p>
                                  <p className="text-xl font-bold text-green-400">{stake.expectedReturn.toFixed(2)} FSN</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm mb-4">
                                <span className="text-gray-400 flex items-center gap-2">
                                  <FaCalendarCheck className="w-4 h-4" />
                                  {t('stakingPage.completed')}:
                                </span>
                                <span className="text-white font-medium">{end.toLocaleDateString()}</span>
                              </div>
                              <div className="w-full py-4 rounded-xl bg-green-500/20 text-green-400 text-center border border-green-500/30 font-semibold">
                                ✅ {t('claimed')}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-12 text-center border-t border-white/10">
                        <FaTrophy className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                        <p className="text-gray-400 text-xl font-medium mb-2">{t('noCompletedStaking')}</p>
                        <p className="text-gray-500">{t('stakingPage.completeFirstStaking')}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StakingPage;
