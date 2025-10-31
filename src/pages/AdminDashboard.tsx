// 📁 AdminDashboard.tsx

import { useState, useEffect, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { formatTimestamp } from '../utils/formatTimestamp';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaIdCard, FaCreditCard, FaChartLine, FaEdit, FaTrash, FaCheck, FaTimes,
  FaCrown, FaStar, FaGem, FaCoins, FaUserCheck, FaEye, FaDownload,
  FaGift, FaImage, FaChartBar, FaExclamationTriangle, FaHome, FaEnvelope, FaMoneyBillWave, FaClipboard,
} from 'react-icons/fa';
import LanguageSwitcher from '../components/LanguageSwitcher';
import PanelClipboard from '../components/admin/PanelClipboard';
import CustomSelect from '../components/ui/CustomSelect';

// Import dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

// Import admin components
import MembershipsTab from '../components/admin/MembershipsTab';
import TransactionsTab from '../components/admin/TransactionsTab';
import RewardsTab from '../components/admin/RewardsTab';
import ContentTab from '../components/admin/ContentTab';
import NotificationsTab from '../components/admin/NotificationsTab';
import KycVerificationTab from '../components/admin/KycVerificationTab';
import UsersManagementTab from '../components/admin/UsersManagementTab';
import DataDeletionManagementTab from '../components/admin/DataDeletionManagementTab';
import MessagePage from '../components/admin/MessagePage';
import BalanceAndReferrals from '../components/admin/BalanceAndReferrals';

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Real-time listener for unread messages
  useEffect(() => {
    const messagesRef = collection(db, 'contactMessages');
    const q = query(messagesRef, where('status', '==', 'unread'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessagesCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const tabs = useMemo(() => [
    { key: 'dashboard', name: t('admin.tabs.dashboard'), shortName: t('admin.tabs.short.dashboard'), icon: FaChartLine },
    { key: 'users', name: t('admin.tabs.users'), shortName: t('admin.tabs.short.users'), icon: FaUsers },
    { key: 'kyc', name: t('admin.tabs.kyc'), shortName: t('admin.tabs.short.kyc'), icon: FaIdCard },
    { key: 'messages', name: t('admin.tabs.messages', 'Messages'), shortName: t('admin.tabs.short.messages', 'Msgs'), icon: FaEnvelope, badge: unreadMessagesCount },
    { key: 'payments', name: t('admin.tabs.payments'), shortName: t('admin.tabs.short.payments'), icon: FaCreditCard },
    { key: 'memberships', name: t('admin.tabs.memberships'), shortName: t('admin.tabs.short.memberships'), icon: FaCrown },
    { key: 'transactions', name: t('admin.tabs.transactions'), shortName: t('admin.tabs.short.transactions'), icon: FaCreditCard },
    { key: 'rewards', name: t('rewardmang.RewardsManagement'), shortName: t('admin.tabs.short.rewards'), icon: FaGift },
    { key: 'content', name: t('admin.tabs.content'), shortName: t('admin.tabs.short.content'), icon: FaImage },
    { key: 'notifications', name: t('admin.tabs.notifications'), shortName: t('admin.tabs.short.notifications'), icon: FaChartBar },
    { key: 'dataDeletion', name: t('rewardmang.DataDeletion'), shortName: 'Deletion', icon: FaTrash },
    { key: 'referralsAndBalances', name: t('admin.tabs.referralsAndBalances', 'Referrals and Balances'), shortName: t('admin.tabs.short.referralsAndBalances', 'Ref & Bal'), icon: FaMoneyBillWave },
  ], [t, unreadMessagesCount]);

  const [users, setUsers] = useState<User[]>([]);
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
  // const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);

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
    await deleteDoc(doc(db, 'users', userId));
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    closeDeleteDialog();
  };

  const handleUpdatePlan = async (userId: string) => {
    if (!newPlan) {
      alert(t('admin.users.pleaseSelectPlan'));
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
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setNewPlan('');
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setNewPlan('');
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingUser(null);
  };

  // const handleKycVerification = async (userId: string) => {
  //   const userRef = doc(db, 'users', userId);
  //   await updateDoc(userRef, { kycStatus: 'Verified' });
  //   setUsers((prev) =>
  //     prev.map((u) => (u.id === userId ? { ...u, kycStatus: 'Verified' } : u))
  //   );
  // };

  // const filteredKycUsers = users.filter(
  //   (user) =>
  //     user.fullName.toLowerCase().includes(kycSearchQuery.toLowerCase()) ||
  //     user.email.toLowerCase().includes(kycSearchQuery.toLowerCase()) ||
  //     user.id.toLowerCase().includes(kycSearchQuery.toLowerCase())
  // );

  // Calculate statistics
  const totalUsers = users.length;
  const verifiedKycUsers = users.filter(u => u.kycStatus === 'Verified' || u.kycStatus === 'Approved').length;
  const pendingKycUsers = users.filter(u => u.kycStatus === 'Pending').length;
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
        className="bg-white/10 backdrop-blur-sm border-b border-white/20 relative z-[100000] pointer-events-none"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{t('admin.dashboard.title', 'Admin Dashboard')}</h1>
                <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.subtitle', 'Manage users, KYC, and payments')}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''} pointer-events-auto`}>
              <button
                onClick={() => setIsClipboardOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
                title="Open Clipboard"
              >
                <FaClipboard className="w-4 h-4" />
                <span className="hidden lg:inline">Clipboard</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                <FaHome className="w-4 h-4" />
                <span className="hidden lg:inline">{t('admin.goToDashboard', 'Go to Dashboard')}</span>
                <span className="lg:hidden">{t('admin.goToDashboardShort', 'Dashboard')}</span>
              </button>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaChartLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">{t('admin.dashboard.title', 'Admin Dashboard')}</h1>
                  <p className="text-gray-400 text-xs">{t('admin.dashboard.subtitle', 'Manage users, KYC, and payments')}</p>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
            <div className="flex justify-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsClipboardOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
                title="Open Clipboard"
              >
                <FaClipboard className="w-4 h-4" />
                Clipboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                <FaHome className="w-4 h-4" />
                {t('admin.goToDashboard', 'Go to Dashboard')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          {/* Mobile Tab Selector */}
          <div className="md:hidden mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-white/20 shadow-xl">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(index)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all duration-300 min-w-0 relative ${selectedTab === index
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'text-gray-500 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    <span className="text-center leading-tight text-[10px]">{tab.shortName}</span>
                    {tab.key === 'messages' && (tab.badge || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                        {(tab.badge || 0) > 99 ? '99+' : (tab.badge || 0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Tab List */}
          <div className="hidden md:block">
            <Tab.List className="grid grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 rounded-2xl bg-white/10 backdrop-blur-sm p-2 lg:p-3 border border-white/20 shadow-xl">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'flex items-center gap-2 rounded-xl py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium leading-5 transition-all duration-300 min-w-0 relative',
                      selected
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="truncate">{tab.name}</span>
                  {tab.key === 'messages' && (tab.badge || 0) > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-1">
                      {(tab.badge || 0) > 99 ? '99+' : (tab.badge || 0)}
                    </span>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels className="mt-4 md:mt-6 lg:mt-8">
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
                        <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.totalUsers')}</p>
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
                        <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.verifiedKYC')}</p>
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
                        <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.premiumPlans')}</p>
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
                        <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.totalBalance')}</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{totalBalance.toLocaleString()} FSN</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Statistics */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                    <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    {t('admin.dashboard.detailedStatistics')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.businessPlans')}</p>
                      <p className="text-base sm:text-lg font-bold text-white">{businessPlans}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.firstClassPlans')}</p>
                      <p className="text-base sm:text-lg font-bold text-white">{firstClassPlans}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-gray-400 text-xs sm:text-sm">{t('admin.dashboard.pendingKYC')}</p>
                      <p className="text-base sm:text-lg font-bold text-white">{pendingKycUsers}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Users Management Tab */}
            <Tab.Panel>
              <UsersManagementTab />
            </Tab.Panel>

            {/* KYC Verification Tab */}
            <Tab.Panel>
              <KycVerificationTab />
            </Tab.Panel>

            {/* Messages Tab */}
            <Tab.Panel>
              <MessagePage />
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
                      <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.payments.title')}</h2>
                      <p className="text-gray-400 text-xs sm:text-sm">{t('admin.payments.description')}</p>
                    </div>
                  </div>

                  {manualPayments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <FaCreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm sm:text-base">{t('admin.payments.noPayments')}</p>
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
                                <p className="text-white font-medium text-sm">{t('admin.payments.table.user')}: {p.uid}</p>
                                <p className="text-gray-400 text-xs">{t('admin.payments.table.currency')}: {p.currency}</p>
                                <p className="text-gray-400 text-xs">{t('admin.payments.table.fromAddress')}: {p.fromAddress.substring(0, 12)}...</p>
                                <p className="text-gray-400 text-xs">{t('admin.payments.table.date')}: {formatTimestamp(p.timestamp)}</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'approved'
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
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <FaCheck className="w-3 h-3" />
                                    {t('admin.payments.actions.approve')}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await updateDoc(doc(db, 'manualPayments', p.id), { status: 'rejected' });
                                      fetchManualPayments();
                                    }}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                    {t('admin.payments.actions.reject')}
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
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.user')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.currency')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.txLink')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.fromAddress')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.status')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.proof')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.payments.table.date')}</th>
                                <th className="py-4 px-4 text-left text-gray-300 font-medium">{t('admin.common.actions')}</th>
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
                                      {t('admin.payments.actions.view')}
                                    </a>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 text-sm break-all max-w-[120px]">{p.fromAddress}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'approved'
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
                                      {t('admin.payments.actions.download')}
                                    </a>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 text-sm">{formatTimestamp(p.timestamp)}</td>
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
                                        {t('admin.payments.actions.approve')}
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await updateDoc(doc(db, 'manualPayments', p.id), { status: 'rejected' });
                                          fetchManualPayments();
                                        }}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                        {t('admin.payments.actions.reject')}
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

            {/* Data Deletion Tab */}
            <Tab.Panel>
              <DataDeletionManagementTab />
            </Tab.Panel>

            {/* Referrals and Balances Tab */}
            <Tab.Panel>
              <BalanceAndReferrals />
            </Tab.Panel>

          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-gray-200 [&>button]:hover:bg-white/10 [&>button]:rounded-lg [&>button]:p-1 [&>button]:transition-all [&>button]:duration-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white pr-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <FaEdit className="w-4 h-4 sm:w-5 sm:w-5 text-white" />
              </div>
              {t('admin.users.updatePlan')}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Update the membership plan for this user. This will change their access level and features.
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 sm:space-y-6">
              {/* User Information Card */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                  {t('admin.users.userInformation')}
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.name')}
                      </label>
                      <p className="text-white font-medium text-sm sm:text-base">{editingUser.fullName}</p>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.email')}
                      </label>
                      <p className="text-gray-300 text-sm sm:text-base truncate">{editingUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.plan')}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 bg-gradient-to-r ${getPlanColor(editingUser.plan)} rounded-lg flex items-center justify-center`}>
                          {getPlanIcon(editingUser.plan)}
                        </div>
                        <span className="text-white capitalize text-sm sm:text-base">{editingUser.plan}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.balance')}
                      </label>
                      <p className="text-yellow-400 font-bold text-sm sm:text-base">{editingUser.balance.toLocaleString()} FSN</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div className="space-y-3">
                <label className="text-sm sm:text-base font-medium text-white block">
                  {t('admin.users.selectNewPlan')}
                </label>
                <CustomSelect
                  value={newPlan}
                  onChange={setNewPlan}
                  options={[
                    { value: 'economy', label: 'Economy' },
                    { value: 'business', label: 'Business' },
                    { value: 'first-6', label: 'First-6' },
                    { value: 'first-lifetime', label: 'First-Lifetime' }
                  ]}
                  placeholder={t('admin.users.selectPlan')}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-3 pt-4 sm:pt-6">
            <button
              onClick={() => editingUser && handleUpdatePlan(editingUser.id)}
              disabled={!newPlan}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              <FaCheck className="w-4 h-4" />
              {t('admin.users.updatePlan')}
            </button>
            <button
              onClick={closeEditDialog}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              {t('admin.common.cancel')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-gray-200 [&>button]:hover:bg-white/10 [&>button]:rounded-lg [&>button]:p-1 [&>button]:transition-all [&>button]:duration-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white pr-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FaTrash className="w-4 h-4 sm:w-5 sm:w-5 text-white" />
              </div>
              {t('admin.users.deleteUser')}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              This action cannot be undone. This will permanently delete the user account and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          
          {deletingUser && (
            <div className="space-y-4 sm:space-y-6">
              {/* Warning Message */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaExclamationTriangle className="w-3 h-3 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-red-400">
                      {t('admin.users.deleteWarning')}
                    </h3>
                    <p className="text-red-300 text-sm sm:text-base">
                      {t('admin.users.deleteWarningDescription')}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information Card */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                  {t('admin.users.userToDelete')}
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.name')}
                      </label>
                      <p className="text-white font-medium text-sm sm:text-base">{deletingUser.fullName}</p>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.email')}
                      </label>
                      <p className="text-gray-300 text-sm sm:text-base truncate">{deletingUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.plan')}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 bg-gradient-to-r ${getPlanColor(deletingUser.plan)} rounded-lg flex items-center justify-center`}>
                          {getPlanIcon(deletingUser.plan)}
                        </div>
                        <span className="text-white capitalize text-sm sm:text-base">{deletingUser.plan}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">
                        {t('admin.users.table.balance')}
                      </label>
                      <p className="text-yellow-400 font-bold text-sm sm:text-base">{deletingUser.balance.toLocaleString()} FSN</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-3 pt-4 sm:pt-6">
            <button
              onClick={() => deletingUser && handleDeleteUser(deletingUser.id)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <FaTrash className="w-4 h-4" />
              {t('admin.users.confirmDelete')}
            </button>
            <button
              onClick={closeDeleteDialog}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              {t('admin.common.cancel')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clipboard Panel */}
      <PanelClipboard
        isOpen={isClipboardOpen}
        onClose={() => setIsClipboardOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
