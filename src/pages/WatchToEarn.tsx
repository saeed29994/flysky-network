import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from './DashboardLayout';

const REQUIRED_ADS = 5;
const REWARD_FOR_ALL = 200;

const adLinks = [
  'https://otieu.com/4/9386723',
  'https://otieu.com/4/9386723',
  'https://otieu.com/4/9387124',
  'https://otieu.com/4/9387126',
  'https://otieu.com/4/9387127',
];

const WatchToEarn = () => {
  const [adsWatched, setAdsWatched] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const lastWatched = data?.adsLastWatched?.toDate?.() || new Date(0);
        const today = new Date();
        const hoursDiff = (today.getTime() - lastWatched.getTime()) / (1000 * 60 * 60);

        let watchedToday = data?.watchedAdsToday || 0;
        if (hoursDiff >= 24) {
          watchedToday = 0;
          await updateDoc(userRef, { watchedAdsToday: 0, adIndex: 0 });
        }

        setAdsWatched(watchedToday);
        setBalance(data?.balance || 0);
      }
    };

    fetchUserData();
  }, []);

  const handleWatchAd = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let currentIndex = userSnap.data()?.adIndex || 0;
    const adLink = adLinks[currentIndex];
    window.open(adLink, '_blank');

    const nextIndex = (currentIndex + 1) % adLinks.length;
    const newWatched = adsWatched + 1;

    await updateDoc(userRef, {
      adIndex: nextIndex,
      watchedAdsToday: newWatched,
      adsLastWatched: serverTimestamp(),
    });

    setAdsWatched(newWatched);
    toast.success(`Ad watched successfully!`);
  };

  const handleClaimReward = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const newBalance = balance + REWARD_FOR_ALL;

    await updateDoc(userRef, {
      balance: newBalance,
      watchedAdsToday: 0,
      adIndex: 0,
      adsLastWatched: serverTimestamp(),
    });

    setBalance(newBalance);
    setAdsWatched(0);
    toast.success(`You earned ${REWARD_FOR_ALL} FSN!`);
  };

  const progressPercent = (adsWatched / REQUIRED_ADS) * 100;
  const canClaim = adsWatched >= REQUIRED_ADS;

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white max-w-xl mx-auto">
        {/* ✅ بانر الصورة */}
        <div className="w-full mb-6">
          <img
            src="/watch-to-eaen.png"
            alt="FSN Coin Rewards Banner"
            className="w-full h-auto rounded-lg shadow-lg object-cover"
          />
        </div>

        <Toaster />

        <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">🎥 Watch to Earn</h1>
        <p className="mb-4 text-center text-gray-300">
          Earn rewards by watching short ads! Watch <strong>{REQUIRED_ADS}</strong> ads to unlock <strong>{REWARD_FOR_ALL} FSN</strong> bonus.
        </p>

        <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-yellow-400 h-4 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <p className="mb-2 text-center">
          Watched: <span className="font-semibold">{adsWatched}/{REQUIRED_ADS}</span>
        </p>
        <p className="mb-4 text-center">
          Balance: <span className="font-semibold">{balance} FSN</span>
        </p>

        {!canClaim ? (
          <button
            onClick={handleWatchAd}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded font-bold transition w-full"
          >
            Watch Ad
          </button>
        ) : (
          <button
            onClick={handleClaimReward}
            className="bg-green-500 hover:bg-green-400 text-black px-6 py-2 rounded font-bold transition w-full"
          >
            Claim Rewards
          </button>
        )}

        <div className="mt-6 text-sm text-center text-gray-400">
          Note: You must watch 5 ads each day to claim your reward. Enjoy and earn!
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WatchToEarn;
