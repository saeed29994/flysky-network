
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import { chartOptions } from '../utils/chartOptions';

interface MiningCardProps {
  plan: string;
  onClaim: (amount: number) => void; // ✅ تم إضافة هذا السطر
}

const planLimits: Record<string, number> = {
  economy: 600,
  business: 3000,
  'first-6': 6000,
  'first-lifetime': 6000,
};

const MiningCard: React.FC<MiningCardProps> = ({ plan, onClaim }) => {
  const [minedToday, setMinedToday] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [claimReady, setClaimReady] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  const dailyLimit = planLimits[plan] || 0;

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      setMinedToday(data.dailyMined || 0);
      setStartTime(data.miningStartTime?.toDate?.() || null);

      // تحميل بيانات الرسم البياني
      const historyRef = doc(db, 'users', user.uid);
      const historySnap = await getDoc(historyRef);
      if (historySnap.exists()) {
        const historyData = historySnap.data()?.miningHistory || [];
        const chartLabels = historyData.map((d: any) => d.date);
        const chartValues = historyData.map((d: any) => d.amount);

        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: 'Mining History',
              data: chartValues,
              borderColor: '#facc15',
              backgroundColor: 'transparent',
            },
          ],
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime.getTime()) / 1000;
      if (elapsed >= 43200 || minedToday >= dailyLimit) {
        setClaimReady(true);
        setShowUnlock(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, minedToday, dailyLimit]);

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const balance = snap.data()?.balance || 0;

    await updateDoc(userRef, {
      balance: balance + minedToday,
      dailyMined: 0,
      miningStartTime: serverTimestamp(),
    });

    const today = new Date().toISOString().split('T')[0];
    const historyRef = doc(db, `users/${user.uid}/miningHistory`, today);
    await setDoc(historyRef, {
      amount: minedToday,
      date: today,
      updatedAt: serverTimestamp(),
    });

    setMinedToday(0);
    setClaimReady(false);
    setShowUnlock(false);
    fetchData();

    onClaim(minedToday); // ✅ استدعاء onClaim هنا!
  };

  const handleWatchAd = () => {
    window.open("//upmonetag.com/2XXXXXX.js", "_blank");
    setShowUnlock(false);
  };

  const progress = Math.min((minedToday / dailyLimit) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 text-white p-4 rounded shadow w-full max-w-md mx-auto"
    >
      <h2 className="text-xl font-bold mb-2">Your Plan: {plan}</h2>
      <p className="text-sm mb-4">Daily Limit: {dailyLimit} FSN</p>

      <div className="w-full bg-gray-700 rounded h-4 overflow-hidden mb-2">
        <div
          className="bg-yellow-400 h-4 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs mb-4">Progress: {minedToday}/{dailyLimit} FSN</p>

      {showUnlock && (
        <button
          onClick={handleWatchAd}
          className="w-full py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
        >
          Unlock Rewards
        </button>
      )}

      {claimReady && !showUnlock && (
        <button
          onClick={handleClaim}
          className="w-full py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-colors"
        >
          Claim Rewards
        </button>
      )}

      {!claimReady && !showUnlock && (
        <button
          disabled
          className="w-full py-2 rounded bg-gray-600 text-white font-semibold cursor-not-allowed"
        >
          Mining in Progress...
        </button>
      )}

      {chartData && (
        <div className="mt-4">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </motion.div>
  );
};

export default MiningCard;
