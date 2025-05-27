
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface MiningCardProps {
  plan: string;
  onClaim: (amount: number) => void;
}

const MiningCard: React.FC<MiningCardProps> = ({ plan, onClaim }) => {
  const [mined, setMined] = useState(0);
  const [claimReady, setClaimReady] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [timer, setTimer] = useState(0);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      setMined(data.dailyMined || 0);
      setClaimReady(data.claimReady || false);

      if (!data.claimReady && data.miningStartTime?.seconds) {
        const lastClaimTime = data.miningStartTime.seconds * 1000;
        const nextClaimTime = lastClaimTime + 12 * 60 * 60 * 1000;
        const now = Date.now();
        const remaining = nextClaimTime - now;
        if (remaining > 0) setTimer(Math.floor(remaining / 1000));
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (!claimReady) {
      setShowUnlock(true);
    }
  }, [timer, claimReady]);

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user || !claimReady) return;

    try {
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
      setShowUnlock(false);

      fetchUserData();
    } catch (error) {
      console.error('Error claiming mining reward:', error);
    }
  };

  const handleWatchAd = () => {
    window.open("//upmonetag.com/2XXXXXX.js", "_blank");
    setShowUnlock(false);
    setClaimReady(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return \`\${h}h \${m}m \${s}s\`;
  };

  return (
    <div className="mining-card">
      <h2>Your Plan: {plan}</h2>
      <p>Mined Today: {mined}</p>

      {!claimReady && !showUnlock && (
        <button
          disabled
          className="w-full py-2 text-center rounded bg-gray-400 text-white font-semibold"
        >
          Claim available in {formatTime(timer)}
        </button>
      )}

      {showUnlock && (
        <button
          className="w-full py-2 text-center rounded bg-blue-500 text-white font-semibold"
          onClick={handleWatchAd}
        >
          Unlock Rewards
        </button>
      )}

      {claimReady && !showUnlock && (
        <button
          className="w-full py-2 text-center rounded bg-yellow-400 text-black font-semibold"
          onClick={handleClaim}
        >
          Claim Rewards
        </button>
      )}
    </div>
  );
};

export default MiningCard;
