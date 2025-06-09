import { useEffect, useState } from 'react';
import {
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  collection,
  getDocs,
  setDoc
} from 'firebase/firestore';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface MiningCardProps {
  plan: 'economy' | 'business' | 'first' | 'first-6' | 'first-lifetime';
  onClaim: (amount: number) => void;
}

const planLimits: Record<string, number> = {
  economy: 600,
  business: 3000,
  'first-6': 6000,
  'first-lifetime': 6000,
  first: 6000,
};

let sentNotification = false;

const MiningCard = ({ plan, onClaim }: MiningCardProps) => {
  const [mined, setMined] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [claimReady, setClaimReady] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [showUnlock, setShowUnlock] = useState(false);

  const miningRate = planLimits[plan] ? planLimits[plan] / 43200 : 0;

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
      }
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

  useEffect(() => {
    if (!startTime || claimReady || isMaxed) return;
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const rawMined = elapsed * miningRate;
      const currentMined = Math.min(planLimits[plan], isNaN(rawMined) ? 0 : rawMined);
      setMined(currentMined);

      if ((elapsed >= 43200 || currentMined >= planLimits[plan]) && !claimReady) {
        setClaimReady(true);
        setIsMaxed(true);
        setRemainingTime(0);
        if (!sentNotification) {
          notifyMiningComplete().catch(() => {});
          sentNotification = true;
        }
      } else {
        setRemainingTime(43200 - elapsed);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, plan, claimReady, isMaxed]);

  useEffect(() => {
    if (claimReady) {
      setShowUnlock(true);
    }
  }, [claimReady]);

  useEffect(() => {
    const sendInboxNotification = async () => {
      const user = auth.currentUser;
      if (!user || !claimReady) return;
      const inboxRef = doc(collection(db, `users/${user.uid}/inbox`));
      await setDoc(inboxRef, {
        title: "🎉 Mining Completed",
        body: "Your mining session has finished! Click 'Claim Reward' to collect your FSN.",
        timestamp: serverTimestamp(),
        read: false,
        claimed: false,
        type: "mining-alert",
      });
    };

    if (claimReady && !sentNotification) {
      sendInboxNotification().catch(console.error);
    }
  }, [claimReady]);

  const handleUnlock = () => {
    window.open('https://otieu.com/4/9386723', '_blank');
    setShowUnlock(false);
  };

  const handleClaim = async () => {
    console.log("🟡 handleClaim triggered");
    const user = auth.currentUser;
    if (!user || !claimReady) {
      console.log("⛔️ Not allowed to claim - user or claimReady missing");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const currentBalance = snap.data()?.balance || 0;
      console.log("✅ Step 1: Got user and balance:", currentBalance);

      const today = new Date().toISOString().split('T')[0];
      const historyRef = doc(db, `users/${user.uid}/miningHistory`, today);

      await updateDoc(userRef, {
        balance: currentBalance + mined,
        dailyMined: 0,
        miningStartTime: serverTimestamp(),
      });
      console.log("✅ Step 2: Updated user data");

      await setDoc(historyRef, {
        amount: Math.floor(mined),
        date: today,
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Step 3: Added to history");

      onClaim(Math.floor(mined));
      console.log("✅ Step 4: Called onClaim");

      setMined(0);
      setClaimReady(false);
      setIsMaxed(false);
      sentNotification = false;

      fetchUserData();
      console.log("✅ Step 5: Refetched data");

    } catch (err) {
      console.error("🔥 Claim error:", err);
      alert("❌ Error while claiming reward. See console.");
    }
  };

  const handleStartMining = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      miningStartTime: serverTimestamp(),
    });
    setStartTime(new Date());
    setFirstTime(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const chartData = {
    labels: history.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Mining History',
        data: history,
        borderColor: '#facc15',
        backgroundColor: '#facc15',
        fill: false,
        tension: 0.4,
      },
    ],
  };

  if (firstTime) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-[#0B1622] flex justify-center items-center px-4">
        <motion.div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md text-center">
          <h2 className="text-xl text-yellow-400 font-bold mb-4">Ready to Start Mining?</h2>
          <button onClick={handleStartMining} className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2 rounded font-bold transition">
            Start Mining
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0B1622] px-0 pt-4 pb-24">
      <motion.div className="w-full max-w-2xl mx-auto bg-gray-900 p-6 sm:p-8 text-center rounded-xl shadow-xl">
        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 text-left mb-4">
          <p>🪙 <span className="text-white font-semibold">Plan:</span> {plan}</p>
          <p>🔋 <span className="text-white font-semibold">Daily Limit:</span> {planLimits[plan]} FSN</p>
          <p>⏱️ <span className="text-white font-semibold">Cycle:</span> 12 hours</p>
          <p>📤 <span className="text-white font-semibold">Claim Type:</span> Manual</p>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2">🪙 FSN Daily Mining</h2>
        <div className="text-4xl font-extrabold text-white mb-2">
          {isNaN(mined) ? 0 : Math.floor(mined)} FSN
        </div>
        <p className="text-sm text-gray-400 mb-2">Daily Limit: <span className="text-white font-semibold">{planLimits[plan]} FSN</span></p>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(mined / planLimits[plan]) * 100}%` }} />
        </div>
        <p className="text-sm text-gray-500 mb-4">{claimReady ? '✅ Ready to claim!' : `⏱️ Time remaining: ${formatTime(remainingTime)}`}</p>

        {claimReady && showUnlock && (
          <button
            onClick={handleUnlock}
            className="w-full py-2 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse transition"
          >
            Unlock Rewards
          </button>
        )}

        {claimReady && !showUnlock && (
          <button
            onClick={handleClaim}
            className="w-full py-2 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse transition"
          >
            Claim Reward
          </button>
        )}

        {!claimReady && (
          <button
            disabled
            className="w-full py-2 rounded-xl font-bold bg-gray-700 text-gray-400 cursor-not-allowed transition"
          >
            Mining in Progress
          </button>
        )}

        <div className="mt-6">
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </motion.div>
    </div>
  );
};

export default MiningCard;
