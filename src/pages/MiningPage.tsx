import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import MiningCard from '../components/MiningCard';

const MiningPage: React.FC = () => {
  const [userPlan, setUserPlan] = useState<string>('economy');
  const [balance, setBalance] = useState<number>(0);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      setUserPlan(data.plan || 'economy');
      setBalance(data.balance || 0);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleClaim = (claimedAmount: number) => {
    setBalance((prev) => prev + claimedAmount);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">FSN Mining Dashboard</h1>
      <p className="mb-6">Balance: {balance} FSN</p>
      <MiningCard plan={userPlan} onClaim={handleClaim} />
    </div>
  );
};

export default MiningPage;
