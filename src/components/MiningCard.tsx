
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const MiningCard = ({ plan, onClaim }) => {
  const [mined, setMined] = useState(0);
  const [claimReady, setClaimReady] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setMined(snap.data().dailyMined || 0);
      setClaimReady(snap.data().claimReady || false);
      setIsMaxed(snap.data().isMaxed || false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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
      setIsMaxed(false);

      fetchUserData();
    } catch (error) {
      console.error('Error claiming mining reward:', error);
    }
  };

  const handleWatchAd = () => {
    // Open Monetag Popunder
    window.open("//upmonetag.com/2XXXXXX.js", "_blank");
    // Hide Watch Ad button, show Claim Reward after 15 seconds
    setShowClaim(false);
    setTimeout(() => {
      setShowClaim(true);
    }, 15000);
  };

  return (
    <div className="mining-card">
      <h2>Your Plan: {plan}</h2>
      <p>Mined Today: {mined}</p>

      {/* ✅ زر مشاهدة الإعلان يظهر فقط عندما claimReady جاهز */}
      {claimReady && !showClaim && (
        <a
          href="//upmonetag.com/2XXXXXX.js"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            handleWatchAd();
          }}
          className="w-full py-2 text-center rounded bg-blue-500 text-white font-semibold block"
        >
          Unlock Reward
        </a>
      )}

      {/* ✅ زر Claim Reward يظهر بعد 15 ثانية من مشاهدة الإعلان */}
      {claimReady && showClaim && (
        <button
          className="w-full py-2 text-center rounded bg-yellow-400 text-black font-semibold"
          disabled={!claimReady}
          onClick={handleClaim}
        >
          Claim Reward
        </button>
      )}

      {/* ✅ إذا claimReady غير جاهز ➜ إخفاء الأزرار */}
      {!claimReady && (
        <p className="text-gray-500 text-center mt-2">Reward available every 12 hours</p>
      )}
    </div>
  );
};

export default MiningCard;
