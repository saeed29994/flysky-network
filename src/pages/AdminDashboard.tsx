// 📁 AdminDashboard.tsx

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
// import { useTranslation } from 'react-i18next';
import {
  FaUsers, FaIdCard, FaCreditCard, FaChartLine, FaSearch, FaEdit, FaTrash, FaCheck, FaTimes,
  FaCrown, FaStar, FaGem, FaCoins, FaUserCheck, FaEye, FaDownload,
  FaGift, FaImage, FaChartBar
} from 'react-icons/fa';

// Import admin components
import MembershipsTab from '../components/admin/MembershipsTab';
import TransactionsTab from '../components/admin/TransactionsTab';
import RewardsTab from '../components/admin/RewardsTab';
import ContentTab from '../components/admin/ContentTab';
import NotificationsTab from '../components/admin/NotificationsTab';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface User {
  id: string;
  fullName: string;
  email: string;
  kycStatus: string;
  plan: string;
  balance: number;
  stakingStatus: string;
}

interface ManualPayment {
  id: string;
  uid: string;
  currency: string;
  proofUrl: string;
  fileName: string;
  txLink: string;
  fromAddress: string;
  timestamp: any;
  status: string;
}

const AdminDashboard = () => {
  // const { t } = useTranslation();
  const [tabs] = useState([
    { name: 'Dashboard', icon: FaChartLine },
    { name: 'Users Management', icon: FaUsers },
    { name: 'KYC Verification', icon: FaIdCard },
    { name: 'Manual Payments', icon: FaCreditCard },
    { name: 'Memberships', icon: FaCrown },
    { name: 'Transactions', icon: FaCreditCard },
    { name: 'Rewards', icon: FaGift },
    { name: 'Content', icon: FaImage },
    { name: 'Notifications', icon: FaChartBar },
  ]);

  const [users, setUsers] = useState<User[]>([]);
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const data: User[] = snapshot.docs.map((doc) => {
      const userData = doc.data();
      const plan = userData.membership?.planName || 'economy';
      const stakingHistory = userData.stakingHistory || [];

      let totalStaked = 0;
      let totalExpected = 0;
      let activeEntries = 0;

      stakingHistory.forEach((s: any) => {
        totalStaked += s.amount || 0;
        totalExpected += s.expectedReturn || 0;
        if (s.status === 'active') activeEntries++;
      });

      const stakingDescription =
        stakingHistory.length > 0
          ? `${stakingHistory.length} entries (${activeEntries} active) - Staked: ${totalStaked} FSN, Expected: ${totalExpected} FSN`
          : '0 FSN';

      return {
        id: doc.id,
        fullName: userData.fullName || '',
        email: userData.email || '',
        kycStatus: userData.kycStatus || 'Pending',
        plan: plan,
        balance: userData.balance || 0,
        stakingStatus: stakingDescription,
      };
    });
    setUsers(data);
    setLoading(false);
  };

  const fetchManualPayments = async () => {
    const snapshot = await getDocs(collection(db, 'manualPayments'));
    const payments: ManualPayment[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as ManualPayment),
      id: doc.id,
    }));
    setManualPayments(payments);
  };

  useEffect(() => {
    fetchUsers();
    fetchManualPayments();
    const interval = setInterval(() => {
      fetchUsers();
      fetchManualPayments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteDoc(doc(db, 'users', userId));
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleUpdatePlan = async (userId: string) => {
    if (!newPlan) {
      alert('Please select a new plan!');
      return;
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'membership.plan': newPlan,
      'membership.planName': newPlan,
      plan: newPlan,
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
    );
    setEditingUserId(null);
    setNewPlan('');
  };

  const handleKycVerification = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { kycStatus: 'Verified' });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, kycStatus: 'Verified' } : u))
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKycUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(kycSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(kycSearchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(kycSearchQuery.toLowerCase())
  );

  // Calculate statistics
  const totalUsers = users.length;
  const verifiedKycUsers = users.filter(u => u.kycStatus === 'Verified').length;
  const businessPlans = users.filter(u => u.plan === 'business').length;
  const firstClassPlans = users.filter(u => u.plan.startsWith('first')).length;
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'first-lifetime': return <FaCrown className="w-4 h-4" />;
      case 'first-6': return <FaStar className="w-4 h-4" />;
      case 'business': return <FaGem className="w-4 h-4" />;
      default: return <FaCoins className="w-4 h-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'first-lifetime': return 'from-yellow-500 to-orange-500';
      case 'first-6': return 'from-blue-500 to-cyan-500';
      case 'business': return 'from-purple-500 to-pink-500';
      default: return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Manage users, KYC, and payments</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          {/* Mobile Tab Selector */}
          <div className="lg:hidden mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-xl">
              <div className="grid grid-cols-3 gap-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(index)}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                      selectedTab === index
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-center leading-tight">{tab.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Tab List */}
          <div className="hidden lg:block">
            <Tab.List className="flex space-x-2 rounded-2xl bg-white/10 backdrop-blur-sm p-2 border border-white/20 shadow-xl">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'flex items-center gap-2 w-full rounded-xl py-3 px-4 text-sm font-medium leading-5 transition-all duration-300',
                      selected
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels className="mt-6 lg:mt-8">
            {/* Dashboard Tab */}
            <Tab.Panel>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FaUsers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm">Total Users</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{totalUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <FaUserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm">Verified KYC</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{verifiedKycUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <FaGem className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm">Premium Plans</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{businessPlans + firstClassPlans}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <FaCoins className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm">Total Balance</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{totalBalance.toLocaleString()} FSN</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Statistics */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                    <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    Detailed Statistics
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">Business Plans</p>
                      <p className="text-base sm:text-lg font-bold text-white">{businessPlans}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">First Class Plans</p>
                      <p className="text-base sm:text-lg font-bold text-white">{firstClassPlans}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">Pending KYC</p>
                      <p className="text-base sm:text-lg font-bold text-white">{totalUsers - verifiedKycUsers}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Users Management Tab */}
            <Tab.Panel>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Users Management</h2>
                      <p className="text-gray-400 text-xs sm:text-sm">Manage user accounts and plans</p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-4 sm:mb-6">
                    <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or user ID"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                    />
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="ml-3 text-gray-400 text-sm sm:text-base">Loading users...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-4">
                        {filteredUsers.map((user, index) => (
                          <motion.div 
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 bg-gradient-to-r ${getPlanColor(user.plan)} rounded-lg flex items-center justify-center`}>
                                    {getPlanIcon(user.plan)}
                                  </div>
                                  <span className="text-white font-medium text-sm capitalize">{user.plan}</span>
                                </div>
                                <span className="text-yellow-400 font-bold text-sm">{user.balance.toLocaleString()} FSN</span>
                              </div>
                              
                              <div>
                                <p className="text-white font-medium text-sm">{user.fullName}</p>
                                <p className="text-gray-400 text-xs">{user.email}</p>
                                <p className="text-gray-400 text-xs mt-1">ID: {user.id.substring(0, 8)}...</p>
                              </div>

                              <div className="text-gray-300 text-xs">
                                <p className="truncate">{user.stakingStatus}</p>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() =>
                                    editingUserId === user.id
                                      ? setEditingUserId(null)
                                      : setEditingUserId(user.id)
                                  }
                                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                                >
                                  <FaEdit className="w-3 h-3" />
                                  {editingUserId === user.id ? 'Cancel' : 'Edit'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                                >
                                  <FaTrash className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <div className="bg-white/5 rounded-xl overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white/10 border-b border-white/10">
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">User ID</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Name</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Email</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Plan</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Balance</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Staking</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.map((user, index) => (
                                <motion.tr 
                                  key={user.id} 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-4 px-4 text-xs text-gray-400 break-all">{user.id}</td>
                                  <td className="py-4 px-4 text-white font-medium">{user.fullName}</td>
                                  <td className="py-4 px-4 text-gray-300">{user.email}</td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 bg-gradient-to-r ${getPlanColor(user.plan)} rounded-lg flex items-center justify-center`}>
                                        {getPlanIcon(user.plan)}
                                      </div>
                                      <span className="text-white capitalize">{user.plan}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-white font-medium">{user.balance.toLocaleString()} FSN</td>
                                  <td className="py-4 px-4 text-gray-300 text-sm max-w-[200px] truncate">{user.stakingStatus}</td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          editingUserId === user.id
                                            ? setEditingUserId(null)
                                            : setEditingUserId(user.id)
                                        }
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <FaEdit className="w-3 h-3" />
                                        {editingUserId === user.id ? 'Cancel' : 'Edit'}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <FaTrash className="w-3 h-3" />
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Plan Modal */}
                  {editingUserId && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FaEdit className="w-4 h-4 text-yellow-400" />
                        Update User Plan
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <select
                          value={newPlan}
                          onChange={(e) => setNewPlan(e.target.value)}
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
                        >
                          <option value="">Select Plan</option>
                          <option value="economy">Economy</option>
                          <option value="business">Business</option>
                          <option value="first-6">First-6</option>
                          <option value="first-lifetime">First-Lifetime</option>
                        </select>
                        <button
                          onClick={() => handleUpdatePlan(editingUserId!)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <FaCheck className="w-4 h-4" />
                          Update Plan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </Tab.Panel>

            {/* KYC Verification Tab */}
            <Tab.Panel>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FaIdCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">KYC Verification</h2>
                      <p className="text-gray-400 text-xs sm:text-sm">Verify user identity documents</p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-4 sm:mb-6">
                    <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or user ID"
                      value={kycSearchQuery}
                      onChange={(e) => setKycSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                    />
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="ml-3 text-gray-400 text-sm sm:text-base">Loading users...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-4">
                        {filteredKycUsers.map((user, index) => (
                          <motion.div 
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="space-y-3">
                              <div>
                                <p className="text-white font-medium text-sm">{user.fullName}</p>
                                <p className="text-gray-400 text-xs">{user.email}</p>
                                <p className="text-gray-400 text-xs mt-1">ID: {user.id.substring(0, 8)}...</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.kycStatus === 'Verified' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {user.kycStatus}
                                </span>

                                {user.kycStatus !== 'Verified' ? (
                                  <button
                                    onClick={() => handleKycVerification(user.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs"
                                  >
                                    <FaCheck className="w-3 h-3" />
                                    Verify KYC
                                  </button>
                                ) : (
                                  <span className="text-green-400 font-semibold flex items-center gap-2 text-xs">
                                    <FaUserCheck className="w-3 h-3" />
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <div className="bg-white/5 rounded-xl overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white/10 border-b border-white/10">
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">User ID</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Name</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Email</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">KYC Status</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredKycUsers.map((user, index) => (
                                <motion.tr 
                                  key={user.id} 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-4 px-4 text-xs text-gray-400 break-all">{user.id}</td>
                                  <td className="py-4 px-4 text-white font-medium">{user.fullName}</td>
                                  <td className="py-4 px-4 text-gray-300">{user.email}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      user.kycStatus === 'Verified' 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}>
                                      {user.kycStatus}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    {user.kycStatus !== 'Verified' ? (
                                      <button
                                        onClick={() => handleKycVerification(user.id)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                      >
                                        <FaCheck className="w-4 h-4" />
                                        Verify KYC
                                      </button>
                                    ) : (
                                      <span className="text-green-400 font-semibold flex items-center gap-2">
                                        <FaUserCheck className="w-4 h-4" />
                                        Verified
                                      </span>
                                    )}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Manual Payments Tab */}
            <Tab.Panel>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="space-y-6"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <FaCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Manual Payments</h2>
                      <p className="text-gray-400 text-xs sm:text-sm">Review and approve payment requests</p>
                    </div>
                  </div>

                  {manualPayments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <FaCreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm sm:text-base">No manual payments found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-4">
                        {manualPayments.map((p, index) => (
                          <motion.div 
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="space-y-3">
                              <div>
                                <p className="text-white font-medium text-sm">User: {p.uid}</p>
                                <p className="text-gray-400 text-xs">Currency: {p.currency}</p>
                                <p className="text-gray-400 text-xs">From: {p.fromAddress.substring(0, 12)}...</p>
                                <p className="text-gray-400 text-xs">Date: {p.timestamp?.toDate().toLocaleDateString()}</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  p.status === 'approved' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : p.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {p.status}
                                </span>

                                <div className="flex gap-2">
                                  <a 
                                    href={p.txLink} 
                                    target="_blank" 
                                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                                  >
                                    <FaEye className="w-3 h-3" />
                                    TX
                                  </a>
                                  <a 
                                    href={p.proofUrl} 
                                    target="_blank" 
                                    className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1"
                                  >
                                    <FaDownload className="w-3 h-3" />
                                    Proof
                                  </a>
                                </div>
                              </div>

                              {p.status === 'pending' && (
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={async () => {
                                      await updateDoc(doc(db, 'manualPayments', p.id), { status: 'approved' });
                                      fetchManualPayments();
                                    }}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                                  >
                                    <FaCheck className="w-3 h-3" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await updateDoc(doc(db, 'manualPayments', p.id), { status: 'rejected' });
                                      fetchManualPayments();
                                    }}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <div className="bg-white/5 rounded-xl overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white/10 border-b border-white/10">
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">User ID</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Currency</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">TX Link</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">From Address</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Status</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Proof</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Date</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {manualPayments.map((p, index) => (
                                <motion.tr 
                                  key={p.id} 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-4 px-4 text-white font-medium">{p.uid}</td>
                                  <td className="py-4 px-4 text-gray-300">{p.currency}</td>
                                  <td className="py-4 px-4">
                                    <a 
                                      href={p.txLink} 
                                      target="_blank" 
                                      className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                    >
                                      <FaEye className="w-3 h-3" />
                                      View
                                    </a>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 text-sm break-all max-w-[120px]">{p.fromAddress}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      p.status === 'approved' 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : p.status === 'rejected'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <a 
                                      href={p.proofUrl} 
                                      target="_blank" 
                                      className="text-green-400 hover:text-green-300 underline flex items-center gap-1"
                                    >
                                      <FaDownload className="w-3 h-3" />
                                      Image
                                    </a>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 text-sm">{p.timestamp?.toDate().toLocaleString()}</td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={async () => {
                                          await updateDoc(doc(db, 'manualPayments', p.id), { status: 'approved' });
                                          fetchManualPayments();
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <FaCheck className="w-3 h-3" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await updateDoc(doc(db, 'manualPayments', p.id), { status: 'rejected' });
                                          fetchManualPayments();
                                        }}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                        Reject
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Memberships Tab */}
            <Tab.Panel>
              <MembershipsTab />
            </Tab.Panel>

            {/* Transactions Tab */}
            <Tab.Panel>
              <TransactionsTab />
            </Tab.Panel>

            {/* Rewards Tab */}
            <Tab.Panel>
              <RewardsTab />
            </Tab.Panel>

            {/* Content Tab */}
            <Tab.Panel>
              <ContentTab />
            </Tab.Panel>

            {/* Notifications Tab */}
            <Tab.Panel>
              <NotificationsTab />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminDashboard;
