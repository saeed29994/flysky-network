import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import StakingCard from '../components/StakingCard';
import { useTranslation } from 'react-i18next';

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
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('1');
  const [stakingList, setStakingList] = useState<StakingEntry[]>([]);
  const [lockedAmount, setLockedAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const returnRate =
    plan === 'first-lifetime' ? [0.05, 0.2, 0.45, 1.0] :
    plan === 'first-6' ? [0.03, 0.15, 0.35, 0.8] :
    plan === 'business' ? [0, 0.10, 0.25, 0.6] :
    [0, 0, 0.15, 0.4];

  const durationIndex =
    duration === '1' ? 0 :
    duration === '3' ? 1 :
    duration === '6' ? 2 :
    3;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setBalance(data.balance || 0);
        const fallbackPlan = data.plan || 'economy';
        const finalPlan = data.membership?.planName || fallbackPlan;
        setPlan(finalPlan);
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

  const handleStake = async (e: React.FormEvent) => {
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

    const expectedReturn = amountNum * (1 + returnRate[durationIndex]);
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

      await updateDoc(doc(db, 'users', user.uid), {
        balance: balance - amountNum
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
      await updateDoc(userDocRef, {
        balance: balance + stake.expectedReturn
      });

      toast.success(t('success.claimed'));
    } catch (error) {
      console.error("Claim failed:", error);
      toast.error(t('error.claimFailed'));
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-950 text-white">
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="text-3xl font-bold text-center text-yellow-400 mb-10">🔥 FSN {t('staking')}</h1>

      {!user && (
        <div className="bg-red-700 text-white text-center p-3 rounded mb-4">
          🚫 {t('loading.user')}
        </div>
      )}

      {user && (
        <>
          <div className="mb-6 max-w-md mx-auto">
            <StakingCard plan={plan as any} lockedAmount={lockedAmount} />
            <p className="text-center text-sm text-gray-400 mt-2">
              {t('plan.current')} <span className="text-white font-semibold">{getPlanLabel(plan, t)}</span>
            </p>
          </div>

          <section className="bg-gray-900 p-6 rounded-xl max-w-2xl mx-auto mb-8 shadow-lg">
            <h2 className="text-xl text-yellow-300 font-bold text-center mb-1">{getPlanLabel(plan, t)} {t('plan.title')}</h2>
            <p className="text-center text-sm text-gray-400 mb-4">{t('plan.startNew')}</p>
            <form onSubmit={handleStake} className="space-y-4">
              <input
                type="number"
                placeholder={t('form.amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                required
              />
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 rounded bg-gray-800 border border-gray-700"
              >
                <option value="1">1 {t('duration.month')} – {returnRate[0] * 100}%</option>
                <option value="3">3 {t('duration.months')} – {returnRate[1] * 100}%</option>
                <option value="6">6 {t('duration.months')} – {returnRate[2] * 100}%</option>
                <option value="12">12 {t('duration.months')} – {returnRate[3] * 100}%</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-semibold"
              >
                {loading ? t('loading.processing') : '🚀 ' + t('startStaking')}
              </button>
            </form>
          </section>

          <section className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-yellow-300 mb-4">📊 {t('stakingRecords')}</h3>

            <h4 className="text-lg font-bold text-green-400 mb-2">🟢 {t('activeStaking')}</h4>
            {stakingList.filter(s => s.status === 'active').length > 0 ? (
              <div className="grid gap-4">
                {stakingList.filter(s => s.status === 'active').map((stake) => {
                  const now = new Date();
                  const end = stake.endDate.toDate();
                  const start = stake.startDate.toDate();
                  const totalDuration = (end.getTime() - start.getTime()) / 1000;
                  const elapsed = (now.getTime() - start.getTime()) / 1000;
                  const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
                  const percent = Math.min(100, Math.floor((elapsed / totalDuration) * 100));
                  const canClaim = stake.status === 'active' && remaining <= 0;

                  return (
                    <div key={stake.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <p>💰 <strong>{stake.amount} FSN</strong></p>
                      <p>⏳ {stake.duration === 12 ? '12 ' + t('duration.months') : `${stake.duration} ` + t('duration.month')}</p>
                      <p>📅 {t('stakingSection.endsOn')}: {end.toLocaleDateString()}</p>
                      <p>💸 {t('stakingSection.expectedReturn')}: <span className="text-green-400">{stake.expectedReturn.toFixed(2)} FSN</span></p>
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                      <button
                        onClick={() => handleClaim(stake)}
                        disabled={!canClaim || stake.claimed}
                        className={`mt-4 w-full py-2 rounded font-semibold shadow ${canClaim ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
                      >
                        {canClaim ? '🎁 ' + t('stakingSection.claimRewards') : `⏳ ${t('stakingSection.claimIn')}: ${Math.floor(remaining / (3600 * 24))}d`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">{t('noActiveStaking')}</p>
            )}

            <h4 className="text-lg font-bold text-gray-400 cursor-pointer mt-6" onClick={() => setShowCompleted(!showCompleted)}>
              ✅ {t('completedStaking')} {showCompleted ? '▲' : '▼'}
            </h4>
            {showCompleted && (
              stakingList.filter(s => s.status === 'completed').length > 0 ? (
                <div className="grid gap-4 mt-2">
                  {stakingList.filter(s => s.status === 'completed').map((stake) => {
                    const end = stake.endDate.toDate();
                    return (
                      <div key={stake.id} className="bg-gray-900 p-4 rounded-lg border border-green-500">
                        <p>💰 <strong>{stake.amount} FSN</strong></p>
                        <p>⏳ {stake.duration === 12 ? '12 ' + t('duration.months') : `${stake.duration} ` + t('duration.month')}</p>
                        <p>📅 {t('stakingSection.endsOn')}: {end.toLocaleDateString()}</p>
                        <p>💸 {t('stakingSection.expectedReturn')}: <span className="text-green-400">{stake.expectedReturn.toFixed(2)} FSN</span></p>
                        <div className="mt-4 w-full py-2 rounded font-semibold text-green-400 bg-gray-700 text-center border border-green-400">
                          ✅ {t('claimed')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">{t('noCompletedStaking')}</p>
              )
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StakingPage;
