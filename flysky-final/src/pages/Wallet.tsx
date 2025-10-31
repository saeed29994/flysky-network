// 📁 src/pages/Wallet.tsx

import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [lockedInStaking, setLockedInStaking] = useState(0);
  const [referralRewards, setReferralRewards] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const totalBalance = balance + lockedInStaking + referralRewards;

  useEffect(() => {
    const fetchWalletData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance || 0);
        setReferralRewards(data.referralReward || 0);
        setTransactions(data.transactions || []);
      }

      // جلب الرصيد المجمد من عمليات الستايكنج
      try {
        const stakingSnap = await getDocs(collection(db, 'users', user.uid, 'staking'));
        const stakingList = stakingSnap.docs.map(doc => doc.data());
        const lockedSum = stakingList
          .filter((s: any) => s.status === 'active')
          .reduce((sum, s: any) => sum + (s.amount || 0), 0);
        setLockedInStaking(lockedSum);
      } catch (err) {
        console.error("❌ Error fetching staking data:", err);
      }

      setLoading(false);
    };

    fetchWalletData();
  }, []);

  const chartData = [
    { name: 'Available', value: balance },
    { name: 'Locked in Staking', value: lockedInStaking },
  ];

  const chartColors = ['#FFD700', '#FF8C00'];

  if (loading) {
    return <div className="text-white text-center py-12">Loading wallet data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-yellow-400 mb-8">💼 Wallet Overview</h1>

      <div className="w-full max-w-xl grid gap-6">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Total Balance</h2>
          <p className="text-2xl font-bold">{totalBalance.toLocaleString()} FSN</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Available Balance</h2>
          <p className="text-2xl font-bold">{balance.toLocaleString()} FSN</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Locked in Staking</h2>
          <p className="text-2xl font-bold">{lockedInStaking.toLocaleString()} FSN</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Referral Rewards (Approved Only)</h2>
          <p className="text-2xl font-bold">{referralRewards.toLocaleString()} FSN</p>
        </div>
      </div>

      <div className="my-10">
        <h2 className="text-xl font-semibold mb-4">💹 Balance Distribution</h2>
        {totalBalance === 0 ? (
          <p className="text-gray-400 italic">No balance data to display.</p>
        ) : (
          <PieChart width={300} height={300}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">📜 Transaction History</h2>
      <div className="w-full max-w-xl bg-gray-900 p-4 rounded-xl shadow">
        {transactions.length === 0 ? (
          <p className="text-gray-400 italic">You have no recorded transactions yet.</p>
        ) : (
          transactions.map((tx: any, index) => (
            <div key={index} className="border-b border-gray-700 py-2">
              <p>{tx.description}</p>
              <p className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wallet;
