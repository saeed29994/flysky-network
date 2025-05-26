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

const StakingPage = () => {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState('economy');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('1');
  const [stakingList, setStakingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const returnRate =
    plan === 'first' ? [0.25, 0.4, 0.55] :
    plan === 'business' ? [0.15, 0.3, 0.45] :
    [0.05, 0.15, 0.25];

  // ✅ حفظ المستخدم من onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('✅ User authenticated:', firebaseUser.uid);
        setUser(firebaseUser);
      } else {
        console.log('❌ User not logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ الاشتراك في بيانات الرصيد والخطة والستايكنج
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Subscribing to user data and staking...');

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        console.log('📥 Balance updated:', data.balance);
        setBalance(data.balance || 0);
        setPlan(data.plan || 'economy');
      }
    });

    const stakingRef = query(collection(db, 'users', user.uid, 'staking'));
    const unsubscribeStaking = onSnapshot(stakingRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('📥 Staking list updated:', list);
      setStakingList(list);
    });

    return () => {
      unsubscribeUser();
      unsubscribeStaking();
    };
  }, [user]);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = parseFloat(amount);
    const durationNum = parseInt(duration);

    if (amountNum > balance) {
      toast.error('❌ You cannot stake more than your balance.');
      return;
    }

    const durationIndex = durationNum === 1 ? 0 : durationNum === 3 ? 1 : 2;
    const expectedReturn = amountNum * (1 + returnRate[durationIndex]);
    const startDate = Timestamp.now();
    const endDate = Timestamp.fromDate(new Date(Date.now() + durationNum * 30 * 24 * 60 * 60 * 1000));

    setLoading(true);

    try {
      console.log('📤 Adding new stake...');
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

      console.log('📝 Updating user balance...');
      await updateDoc(doc(db, 'users', user.uid), {
        balance: balance - amountNum
      });

      toast.success('✅ Staking created successfully!');
      setAmount('');
    } catch (error) {
      console.error('❌ Error during staking:', error);
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (stake: any) => {
    if (!user) return;

    try {
      console.log('💰 Claiming stake reward...');
      await updateDoc(doc(db, 'users', user.uid, 'staking', stake.id), {
        status: 'completed',
        claimed: true
      });

      await updateDoc(doc(db, 'users', user.uid), {
        balance: balance + stake.expectedReturn
      });

      toast.success(`🎁 Claimed ${stake.expectedReturn.toFixed(2)} FSN successfully!`);
    } catch (error) {
      console.error('❌ Error during claim:', error);
      toast.error('Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-950 text-white">
      <Toaster position="top-center" reverseOrder={false} />

      <h1 className="text-3xl font-bold text-center text-yellow-400 mb-10">🔥 FSN Staking</h1>

      <div className="mb-8 bg-gray-900 rounded-xl p-6 text-center shadow-md max-w-md mx-auto">
        <p className="text-gray-400 text-sm">Your Current Balance</p>
        <p className="text-4xl font-bold text-yellow-400">{balance} FSN</p>
        <p className="text-sm text-gray-500 mt-2">
          Membership: <span className="text-white font-semibold uppercase">{plan}</span>
        </p>
      </div>

      <section className="bg-gray-900 p-6 rounded-xl max-w-2xl mx-auto mb-8 shadow-lg">
        <h2 className="text-xl text-yellow-300 font-bold text-center mb-1">{plan.toUpperCase()} PLAN</h2>
        <p className="text-center text-sm text-gray-400 mb-4">Start a new stake based on your plan</p>

        <form onSubmit={handleStake} className="space-y-4">
          <input
            type="number"
            placeholder="Amount to Stake"
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
            <option value="1">1 Month – {returnRate[0] * 100}%</option>
            <option value="3">3 Months – {returnRate[1] * 100}%</option>
            <option value="6">6 Months – {returnRate[2] * 100}%</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-semibold"
          >
            {loading ? 'Processing...' : '🚀 Start Staking'}
          </button>
        </form>
      </section>

      <section className="max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-yellow-300 mb-4">📊 Your Staking Entries</h3>
        {stakingList.length === 0 ? (
          <p className="text-gray-500 text-center">You haven’t staked yet.</p>
        ) : (
          <div className="grid gap-4">
            {stakingList.map((stake) => {
              const now = new Date();
              const canClaim = stake.status === 'active' && stake.endDate.toDate() <= now;

              return (
                <div key={stake.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p>💰 Amount: <strong>{stake.amount} FSN</strong></p>
                  <p>⏳ Duration: {stake.duration} month(s)</p>
                  <p>📆 Ends: {stake.endDate.toDate().toLocaleDateString()}</p>
                  <p>💸 Expected Return: <span className="text-green-400">{stake.expectedReturn.toFixed(2)} FSN</span></p>
                  <p>Status: <span className={`font-semibold ${stake.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{stake.status}</span></p>

                  {canClaim && !stake.claimed && (
                    <button
                      onClick={() => handleClaim(stake)}
                      className="mt-4 bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded shadow"
                    >
                      🎁 Claim Rewards
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StakingPage;
