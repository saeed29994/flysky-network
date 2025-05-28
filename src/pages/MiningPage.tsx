import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import MiningCard from '../components/MiningCard';

const MiningPage = () => {
  const [userPlan, setUserPlan] = useState<'economy' | 'business' | 'first-6' | 'first-lifetime'>('economy');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const plan = data?.membership?.planName || data?.plan || 'economy';
        setUserPlan(plan);

        const currentBalance = data?.balance || 0;
        setBalance(currentBalance);
      }
    };

    fetchUserData();
  }, []);

  const handleClaim = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const newBalance = balance + amount;

    await updateDoc(userRef, {
      balance: newBalance,
    });

    setBalance(newBalance);
    console.log(`Claimed: ${amount} FSN. New Balance: ${newBalance} FSN`);
  };

  return (
    <div className="min-h-screen bg-[#0B1622] pt-4 pb-24">
      <div className="text-center text-white mb-4">
        <h1 className="text-xl font-bold">My Balance: {balance} FSN</h1>
      </div>
      <MiningCard plan={userPlan} onClaim={handleClaim} />
    </div>
  );
};

export default MiningPage;
