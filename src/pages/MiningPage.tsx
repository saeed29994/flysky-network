import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import MiningCard from '../components/MiningCard';
import { useTranslation } from 'react-i18next';
import { useUserPlan } from '../contexts/UserPlanContext';

const MiningPage = () => {
  const { t } = useTranslation();
  const { currentPlan, loading: planLoading } = useUserPlan();

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const currentBalance = data?.balance || 0;
          setBalance(currentBalance);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleClaim = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const newBalance = balance + amount;

      await updateDoc(userRef, {
        balance: newBalance,
        lastMiningTime: serverTimestamp() // Update lastMiningTime to current time
      });

      setBalance(newBalance);
      console.log(`Claimed: ${amount} FSN. New Balance: ${newBalance} FSN`);
    } catch (error) {
      console.error('Error claiming mining rewards:', error);
    }
  };

  // Show loading while plan is being fetched
  if (planLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('loading.miningData')}</p>
        </div>
      </div>
    );
  }

  // Ensure we have a valid plan, fallback to economy if needed
  const userPlan = currentPlan || 'economy';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <MiningCard 
        plan={userPlan as 'economy' | 'business' | 'first' | 'first-6' | 'first-lifetime'} 
        onClaim={handleClaim} 
        balance={balance} 
      />
    </div>
  );
};

export default MiningPage;
