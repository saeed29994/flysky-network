import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { ethers } from 'ethers';
import contractAbi from '../contracts/FlySkySafeSubscription.json';

const CONTRACT_ADDRESS = '0xbb23b4ed3d8521795ecfa4b75142448f4069bbe3';

interface UserPlanContextProps {
  currentPlan: string | null;
  subscriptionEnd: number | null;
  loading: boolean;
  balance: number;
  referrals: number;
  referralReward: number;
  dailyMined: number;
  stakingEarnings: number;
  totalEarnings: number;
  userData: Record<string, any> | null;
  lockedInStaking: number;
}

const UserPlanContext = createContext<UserPlanContextProps>({
  currentPlan: null,
  subscriptionEnd: null,
  loading: true,
  balance: 0,
  referrals: 0,
  referralReward: 0,
  dailyMined: 0,
  stakingEarnings: 0,
  totalEarnings: 0,
  userData: null,
  lockedInStaking: 0,
});

export const useUserPlan = () => useContext(UserPlanContext);

export const UserPlanProvider = ({ children }: { children: ReactNode }) => {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [referralReward, setReferralReward] = useState(0);
  const [dailyMined, setDailyMined] = useState(0);
  const [stakingEarnings, setStakingEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [lockedInStaking, setLockedInStaking] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    // Listen for real-time updates to user data
    const unsubscribe = onSnapshot(userRef, async (userSnap) => {
      try {
        const data = userSnap.data();
        setUserData(data || null);
        
        if (!data) {
          setCurrentPlan('economy');
          setSubscriptionEnd(null);
          setBalance(0);
          setReferrals(0);
          setReferralReward(0);
          setDailyMined(0);
          setStakingEarnings(0);
          setTotalEarnings(0);
          setLockedInStaking(0);
          setLoading(false);
          return;
        }

        // Set user data
        setBalance(data.balance || 0);
        setReferrals(data.referrals || 0);
        setReferralReward(data.referralReward || 0);
        setDailyMined(data.dailyMined || 0);
        setStakingEarnings(data.stakingEarnings || 0);
        
        // Calculate total earnings
        const miningEarnings = data.miningEarnings || 0;
        const referralEarnings = data.referralReward || 0;
        const stakingEarnings = data.stakingEarnings || 0;
        setTotalEarnings(miningEarnings + referralEarnings + stakingEarnings);

        // Get locked staking amount - this matches how the Wallet page does it
        try {
          const stakingSnap = await getDocs(collection(db, 'users', user.uid, 'staking'));
          const stakingList = stakingSnap.docs.map(doc => doc.data());
          const lockedSum = stakingList
            .filter((s: any) => s.status === 'active')
            .reduce((sum, s: any) => sum + (s.amount || 0), 0);
          setLockedInStaking(lockedSum);
        } catch (err) {
          console.error("Error fetching staking data:", err);
        }

        // ✅ Try to get data from smart contract first
        if (window.ethereum && data.membership?.walletAddress) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);
            const sub = await contract.subscriptions(data.membership.walletAddress);

            const now = Math.floor(Date.now() / 1000);
            if (Number(sub.end) > now) {
              const planIndex = Number(sub.plan);
              const planName =
                planIndex === 2
                  ? 'first-lifetime'
                  : planIndex === 1
                  ? 'first-6'
                  : 'business';

              setCurrentPlan(planName);
              setSubscriptionEnd(Number(sub.end));
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('⚠️ Smart contract fetch failed. Fallback to Firestore.');
          }
        }

        // ✅ Fallback: Get data from Firestore directly
        const now = Math.floor(Date.now() / 1000);
        const subscriptionEndTime = data.membership?.subscriptionEnd;
        
        // Check if subscription is still valid
        if (data.membership?.planName && subscriptionEndTime && subscriptionEndTime > now) {
          setCurrentPlan(data.membership.planName);
          setSubscriptionEnd(subscriptionEndTime);
        } else {
          // Subscription expired or doesn't exist, set to economy
          setCurrentPlan('economy');
          setSubscriptionEnd(null);
        }
        
      } catch (err) {
        console.error('Failed to fetch membership data:', err);
        setCurrentPlan('economy');
        setSubscriptionEnd(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserPlanContext.Provider value={{ 
      currentPlan, 
      subscriptionEnd, 
      loading,
      balance,
      referrals,
      referralReward,
      dailyMined,
      stakingEarnings,
      totalEarnings,
      userData,
      lockedInStaking
    }}>
      {children}
    </UserPlanContext.Provider>
  );
};
