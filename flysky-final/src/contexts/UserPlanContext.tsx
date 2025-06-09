import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ethers } from 'ethers';
import contractAbi from '../contracts/FlySkySafeSubscription.json';

const CONTRACT_ADDRESS = '0xbb23b4ed3d8521795ecfa4b75142448f4069bbe3';

interface UserPlanContextProps {
  currentPlan: string | null;
  subscriptionEnd: number | null;
  loading: boolean;
}

const UserPlanContext = createContext<UserPlanContextProps>({
  currentPlan: null,
  subscriptionEnd: null,
  loading: true,
});

export const useUserPlan = () => useContext(UserPlanContext);

export const UserPlanProvider = ({ children }: { children: ReactNode }) => {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();

        if (data) {
          // ✅ جرب جلب البيانات من العقد الذكي
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

          // ✅ Fallback: جلب البيانات من Firestore مباشرة
          if (data.membership?.planName) {
            setCurrentPlan(data.membership.planName);
          } else {
            setCurrentPlan('economy');
          }

          if (data.membership?.subscriptionEnd) {
            setSubscriptionEnd(data.membership.subscriptionEnd);
          } else {
            setSubscriptionEnd(null);
          }
        } else {
          setCurrentPlan('economy');
        }
      } catch (err) {
        console.error('Failed to fetch membership data:', err);
        setCurrentPlan('economy');
        setSubscriptionEnd(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, []);

  return (
    <UserPlanContext.Provider value={{ currentPlan, subscriptionEnd, loading }}>
      {children}
    </UserPlanContext.Provider>
  );
};
