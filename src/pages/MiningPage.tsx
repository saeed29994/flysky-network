import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import MiningCard from '../components/MiningCard';
import { useTranslation } from 'react-i18next';
import { PlanType } from '../types/plans';


interface UserMiningData {
  balance: number;
  miningEarnings: number;
  membership?: {
    planName: string;
    subscriptionEnd: number;
  };
  lastMiningTime?: Date;
  dailyMined?: number;
}


const MiningPage = () => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserMiningData>({
    balance: 0,
    miningEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError('User data not found');
          setLoading(false);
          return;
        }

        const data = userSnap.data() as UserMiningData;
        setUserData({
          balance: data.balance ?? 0,
          miningEarnings: data.miningEarnings ?? 0,
          membership: data.membership,
          lastMiningTime: data.lastMiningTime,
          dailyMined: data.dailyMined
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch mining data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleClaim = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Get current user data and transaction history
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};
      const currentTransactionHistory = userData.transactionHistory || [];
      
      const newBalance = userData.balance + amount;
      const newMiningEarnings = userData.miningEarnings + amount;

      const updateData = {
        balance: newBalance,
        lastMiningTime: serverTimestamp(),
        dailyMined: 0,
        miningEarnings: newMiningEarnings,
        // Add transaction to history
        transactionHistory: [...currentTransactionHistory, {
          description: `Mining reward claimed (+${amount.toLocaleString()} FSN)`,
          timestamp: Date.now(),
          type: 'mining',
          amount: amount
        }]
      };

      await updateDoc(userRef, updateData);

      setUserData(prev => ({
        ...prev,
        balance: newBalance,
        miningEarnings: newMiningEarnings,
        dailyMined: 0,
        lastMiningTime: new Date()
      }));

    } catch (error) {
      console.error('Error claiming mining rewards:', error);
      setError('Failed to claim mining rewards');
    }
  };

  const getActivePlan = (): PlanType => {
    if (
      userData.membership?.planName
    ) {
      return userData.membership.planName as PlanType;
    }
    
    return ('economy') as PlanType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('loading.miningData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center p-4 bg-red-500/20 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const activePlan = getActivePlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
     
      {/* Mining Card Section - Main Card First */}
      <MiningCard
        plan={activePlan as PlanType}
        onClaim={handleClaim}
        balance={userData.balance}
      />
    </div>
  );
};

export default MiningPage;
