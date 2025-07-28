// 📁 src/pages/Wallet.tsx

import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet as WalletIcon, Coins, Lock, Gift, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Wallet = () => {
  const { t } = useTranslation();
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
    { name: t('availableBalance'), value: balance, color: '#FFD700' },
    { name: t('lockedInStaking'), value: lockedInStaking, color: '#FF8C00' },
    { name: t('referralRewards'), value: referralRewards, color: '#8B5CF6' },
  ].filter(item => item.value > 0); // Only show non-zero values

  const chartColors = ['#FFD700', '#FF8C00', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('loadingWallet')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Professional Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/5 to-yellow-500/5"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative px-4 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <WalletIcon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                💰 {t('walletOverview')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                Manage your FSN tokens, track your balance, and view transaction history
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Main Content Grid - Professional Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Balance Cards & Chart (8 columns on xl) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Total Balance Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('totalBalance')}</h2>
                    <p className="text-gray-400">Your complete FSN portfolio</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-yellow-400 mb-2">
                    {totalBalance.toLocaleString()}
                  </div>
                  <div className="text-lg text-gray-400 font-medium">FSN Tokens</div>
                </div>
              </div>
            </motion.div>

            {/* Balance Breakdown Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Available Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('availableBalance')}</h3>
                    <p className="text-xs text-gray-400">Ready to use</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {balance.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400 font-semibold">FSN</div>
                </div>
        </div>

              {/* Locked in Staking */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('lockedInStaking')}</h3>
                    <p className="text-xs text-gray-400">In staking pools</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {lockedInStaking.toLocaleString()}
                  </div>
                  <div className="text-xs text-orange-400 font-semibold">FSN</div>
                </div>
        </div>

              {/* Referral Rewards */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('referralRewards')}</h3>
                    <p className="text-xs text-gray-400">From referrals</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {referralRewards.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-400 font-semibold">FSN</div>
                </div>
              </div>
            </motion.div>

            {/* Balance Distribution Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('balanceDistribution')}</h2>
                    <p className="text-gray-400">Visual breakdown of your portfolio</p>
                  </div>
        </div>
      </div>

              <div className="p-6">
        {totalBalance === 0 || chartData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-8 h-8 text-gray-400" />
                    </div>
          <p className="text-gray-400 italic">{t('noBalanceData')}</p>
                  </div>
        ) : (
                                    <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex-1 flex justify-center">
                      <PieChart width={300} height={250}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
                          label={({ value }) => value > 0 ? `${value.toLocaleString()}` : ''}
                          labelLine={false}
            >
                          {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            color: '#000000',
                            fontSize: '12px'
                          }}
                          labelStyle={{
                            color: '#000000',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        />
          </PieChart>
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: chartColors[index] }}
                          ></div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{item.name}</div>
                            <div className="text-gray-400 text-xs">{item.value.toLocaleString()} FSN</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-sm">
                              {totalBalance > 0 ? ((item.value / totalBalance) * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Transaction History (4 columns on xl) */}
          <div className="xl:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6 sticky top-8"
            >
              {/* Transaction History Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{t('transactionHistory')}</h3>
                      <p className="text-sm text-gray-400">Recent activity</p>
                    </div>
                  </div>
      </div>

                <div className="p-6">
        {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-6 h-6 text-gray-400" />
                      </div>
          <p className="text-gray-400 italic">{t('noTransactions')}</p>
                    </div>
        ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {transactions.slice(0, 10).map((tx: any, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            {tx.description?.includes('+') ? (
                              <ArrowUpRight className="w-4 h-4 text-white" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{tx.description}</p>
                            <p className="text-gray-400 text-xs">
                              {new Date(tx.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
            </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Portfolio Stats</h3>
                    <p className="text-sm text-gray-400">Quick overview</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Available</span>
                    <span className="text-green-400 font-semibold">{balance.toLocaleString()} FSN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Staked</span>
                    <span className="text-orange-400 font-semibold">{lockedInStaking.toLocaleString()} FSN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Referrals</span>
                    <span className="text-purple-400 font-semibold">{referralRewards.toLocaleString()} FSN</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-yellow-400 font-bold text-lg">{totalBalance.toLocaleString()} FSN</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
