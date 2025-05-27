
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const MiningCard = ({ plan, onClaim }) => {
  const [mined, setMined] = useState(0);
  const [claimReady, setClaimReady] = useState(false);
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

  const handleClaim = async (e) => {
    e.preventDefault(); // ✅ منع الانتقال الفوري للرابط
    const user = auth.currentUser;
    if (!user || !claimReady) return;

    // افتح نافذة الإعلان أولًا
    window.open("//upmonetag.com/2XXXXXX.js", "_blank");

    // ⏳ انتظر 15 ثانية قبل بدء منطق تحصيل المكافأة
    setTimeout(async () => {
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
    }, 15000); // 15 ثانية انتظار
  };

  return (
    <div className="mining-card">
      <h2>Your Plan: {plan}</h2>
      <p>Mined Today: {mined}</p>

      {/* ✅ زر Claim Reward عبارة عن رابط حقيقي */}
      <a
        href="//upmonetag.com/2XXXXXX.js"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClaim}
        className="w-full py-2 text-center rounded bg-yellow-400 text-black font-semibold block"
      >
        Claim Reward
      </a>
    </div>
  );
};

export default MiningCard;
