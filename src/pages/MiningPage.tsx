import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import MiningCard from '../components/MiningCard';

const MiningPage = () => {
  const [userPlan, setUserPlan] = useState<'economy' | 'business' | 'first-6' | 'first-lifetime'>('economy');

  useEffect(() => {
    const fetchPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const plan = data?.membership?.planName || data?.plan || 'economy';
        setUserPlan(plan);
      }
    };

    fetchPlan();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1622] pt-4 pb-24">
      <MiningCard plan={userPlan} onClaim={() => {}} />
    </div>
  );
};

export default MiningPage;
