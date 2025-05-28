// ⚠️ داخل الملف: MiningCard.tsx

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
  plan: 'economy' | 'business' | 'first-6' | 'first-lifetime';
  onClaim: (amount: number) => void;
}

const planLimits: Record<string, number> = {
  economy: 600,
  business: 3000,
  'first-6': 6000,
  'first-lifetime': 6000,
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
  const [showUnlock, setShowUnlock] = useState(false); // 👈 إضافة حالة الزر

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
        setMined(data.dailyMined || 0);
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
      const currentMined = Math.min(planLimits[plan], elapsed * miningRate);
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

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user || !claimReady) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const currentBalance = snap.data()?.balance || 0;
    const today = new Date().toISOString().split('T')[0];
    const historyRef = doc(db, `users/${user.uid}/miningHistory`, today);

    await updateDoc(userRef, {
      balance: currentBalance + mined,
      dailyMined: 0,
      miningStartTime: serverTimestamp(),
    });

    await setDoc(historyRef, {
      amount: Math.floor(mined),
      date: today,
      updatedAt: serverTimestamp(),
    });

    onClaim(Math.floor(mined));
    setMined(0);
    setClaimReady(false);
    setIsMaxed(false);
    sentNotification = false;
    setShowUnlock(false); // 👈 إعادة تعيين الزر بعد التحصيل

    fetchUserData();
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

  // زر Unlock Rewards: يعرض الإعلان ويظهر زر Claim بعدها
  const handleUnlockRewards = () => {
    // 👇 إدراج سكربت الإعلان في الصفحة
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.dataset.cfasync = 'false';
    script.innerHTML = `(()=>{var K='ChmaorrCfozdgenziMrattShzzyrtarnedpoomrzPteonSitfreidnzgtzcseljibcOezzerlebpalraucgeizfznfoocrzEwaocdhnziaWptpnleytzngoectzzdclriehaCtdenTeepxptaNzoldmetzhRzeegvEoxmpezraztdolbizhXCGtIs=rzicfozn>ceamtazr(fdio/c<u>m"eennto)nz:gyzaclaplslizdl"o=ceallySttso r"akgneazl_bd:attuaozbsae"t=Ictresm zegmeatrIftie<mzzLrMeTmHorveenIntiezmezdcolNeeanrozldcezcdoadeehUzReIdCooNmtpnoenreanptzzebnionndzzybatlop';(()=>{})()})();`;
    document.body.appendChild(script);

    const script2 = document.createElement('script');
    script2.src = '//fenoofaussut.net/ntfc.php?p=9386736';
    script2.dataset.cfasync = 'false';
    script2.async = true;
    script2.onerror = () => (window as any)._uxlyx && (window as any)._uxlyx();
    script2.onload = () => (window as any)._czeveqde && (window as any)._czeveqde();
    document.body.appendChild(script2);

    // 👇 بعد عرض الإعلان، نخفي زر Unlock Rewards ونُظهر زر Claim
    setTimeout(() => setShowUnlock(false), 1000);
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

        {/* ✅ معلومات التعدين */}
        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 text-left mb-4">
          <p>🪙 <span className="text-white font-semibold">Plan:</span> {plan}</p>
          <p>🔋 <span className="text-white font-semibold">Daily Limit:</span> {planLimits[plan]} FSN</p>
          <p>⏱️ <span className="text-white font-semibold">Cycle:</span> 12 hours</p>
          <p>📤 <span className="text-white font-semibold">Claim Type:</span> Manual</p>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2">🪙 FSN Daily Mining</h2>
        <div className="text-4xl font-extrabold text-white mb-2">{Math.floor(mined)} FSN</div>
        <p className="text-sm text-gray-400 mb-2">Daily Limit: <span className="text-white font-semibold">{planLimits[plan]} FSN</span></p>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(mined / planLimits[plan]) * 100}%` }} />
        </div>
        <p className="text-sm text-gray-500 mb-4">{claimReady ? '✅ Ready to claim!' : `⏱️ Time remaining: ${formatTime(remainingTime)}`}</p>

        {/* 🔓 زر Unlock Rewards */}
        {claimReady && !showUnlock && (
          <button
            onClick={() => setShowUnlock(true)}
            className="w-full py-2 mb-2 rounded-xl font-bold transition bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse"
          >
            Unlock Rewards
          </button>
        )}

        {/* 💰 زر Claim Reward */}
        {(!claimReady || showUnlock) && (
          <button
            onClick={claimReady ? handleClaim : undefined}
            disabled={!claimReady}
            className={`w-full py-2 rounded-xl font-bold transition-all duration-300 ${
              claimReady ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {claimReady ? 'Claim Reward' : 'Mining in Progress'}
          </button>
        )}

        {/* عند الضغط على Unlock Rewards */}
        {showUnlock && claimReady && (
          <div className="mt-4">
            <button
              onClick={handleUnlockRewards}
              className="w-full py-2 rounded-xl font-bold bg-green-600 hover:bg-green-500 text-white transition animate-pulse"
            >
              Show Ads & Unlock Rewards
            </button>
          </div>
        )}

        <div className="mt-6">
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </motion.div>
    </div>
  );
};

export default MiningCard;
