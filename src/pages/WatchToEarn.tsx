import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from './DashboardLayout';
import { useTranslation } from 'react-i18next';

const REQUIRED_ADS = 5;
const REWARD_FOR_ALL = 200;

const adLinks = [
  'https://otieu.com/4/9386723',
  'https://otieu.com/4/9387035',
  'https://otieu.com/4/9387124',
  'https://otieu.com/4/9387126',
  'https://otieu.com/4/9387127',
];

const WatchToEarn = () => {
  const { t } = useTranslation();
  const [adsWatched, setAdsWatched] = useState(0);
  const [balance, setBalance] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [adTimer, setAdTimer] = useState(20);
  const [timerFinished, setTimerFinished] = useState(false);
  const [adStarted, setAdStarted] = useState(false);

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

        let watchedToday = typeof data?.watchedAdsToday === 'number' ? data.watchedAdsToday : 0;
        if (hoursDiff >= 24) {
          watchedToday = 0;
          await updateDoc(userRef, { watchedAdsToday: 0, adIndex: 0 });
        }

        setAdsWatched(watchedToday);
        setBalance(data?.balance || 0);

        if (watchedToday === 0 && hoursDiff < 24) {
          const secondsLeft = 24 * 3600 - Math.floor((today.getTime() - lastWatched.getTime()) / 1000);
          setCountdown(secondsLeft);
        } else {
          setCountdown(0);
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (adStarted && adTimer > 0) {
      const interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (adStarted && adTimer === 0) {
      setTimerFinished(true);
    }
  }, [adStarted, adTimer]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleWatchAd = () => {
    setShowModal(true);
    setAdTimer(20);
    setTimerFinished(false);
    setAdStarted(false);
  };

  const handleConfirmAdWatched = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const currentIndex = userSnap.data()?.adIndex || 0;
    const currentWatched = userSnap.data()?.watchedAdsToday || 0;
    const nextIndex = (currentIndex + 1) % adLinks.length;
    const newWatched = currentWatched + 1;

    await updateDoc(userRef, {
      adIndex: nextIndex,
      watchedAdsToday: newWatched,
      adsLastWatched: serverTimestamp(),
    });

    setAdsWatched(newWatched);
    toast.success(t("watchToEarn.adWatched"));
    closeModal();
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
    setCountdown(24 * 3600);

    toast.success(t("watchToEarn.rewardClaimed", { amount: REWARD_FOR_ALL }));
  };

  const closeModal = () => {
    setShowModal(false);
    setAdTimer(20);
    setTimerFinished(false);
    setAdStarted(false);
  };

  const progressPercent = (adsWatched / REQUIRED_ADS) * 100;
  const canClaim = adsWatched >= REQUIRED_ADS;

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col items-center justify-start p-4 text-white max-w-xl mx-auto pt-4">
        <div className="w-full mb-6">
          <img
            src="/watch-to-eaen.png"
            alt="FSN Coin Rewards Banner"
            className="w-full h-auto rounded-lg shadow-lg object-cover"
          />
        </div>

        <Toaster />

        <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
          🎥 {t("watchToEarn.title")}
        </h1>

        <p className="mb-4 text-center text-gray-300">
          {t("watchToEarn.description", { count: REQUIRED_ADS, reward: REWARD_FOR_ALL })}
        </p>

        <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-yellow-400 h-4 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <p className="mb-2 text-center">
          {t("watchToEarn.watched")}: <span className="font-semibold">{adsWatched}/{REQUIRED_ADS}</span>
        </p>
        <p className="mb-4 text-center">
          {t("watchToEarn.balance")}: <span className="font-semibold">{balance} FSN</span>
        </p>

        {countdown > 0 ? (
          <p className="text-center text-red-400 font-semibold mb-4">
            {t("watchToEarn.waitMessage", { time: formatTime(countdown) })}
          </p>
        ) : !canClaim ? (
          <button
            onClick={handleWatchAd}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded font-bold transition w-full"
          >
            {t("watchToEarn.watchAd")}
          </button>
        ) : (
          <button
            onClick={handleClaimReward}
            className="bg-green-500 hover:bg-green-400 text-black px-6 py-2 rounded font-bold transition w-full"
          >
            {t("watchToEarn.claimRewards")}
          </button>
        )}

        <div className="mt-6 text-sm text-center text-gray-400">
          {t("watchToEarn.note")}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 w-11/12 max-w-md shadow-lg text-white relative">
            <h2 className="text-xl font-bold mb-4 text-center">{t("watchToEarn.adModalTitle")}</h2>
            <p className="text-center text-yellow-400 mb-2">
              ⏳ {t("watchToEarn.timer")} {adTimer} {t("watchToEarn.seconds")}
            </p>

            {!timerFinished ? (
              <button
                onClick={() => {
                  window.open(adLinks[adsWatched % adLinks.length], "_blank");
                  setAdStarted(true);
                }}
                className="w-full bg-yellow-500 text-black font-bold py-2 rounded-lg mt-4"
              >
                {t("watchToEarn.openAd")}
              </button>
            ) : (
              <button
                onClick={handleConfirmAdWatched}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2 rounded-lg mt-4"
              >
                ✅ {t("watchToEarn.confirmAdWatched")}
              </button>
            )}

            <p className="text-center text-sm text-gray-400 mt-2">
              📢 {t("watchToEarn.stayOnPage")}
            </p>

            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WatchToEarn;
