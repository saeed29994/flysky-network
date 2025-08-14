// 📁 src/components/admin/UsersManagementTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaUsers, FaSearch, FaEdit, FaTrash, FaCheck, FaTimes,
  FaCrown, FaStar, FaGem, FaCoins, FaUserCheck,
  FaBan, FaWallet, FaEye, FaCalendarAlt,
  FaClock, FaGlobe, FaUserFriends, FaIdCard, FaMoneyBillWave, FaGift
} from 'react-icons/fa';
import { 
  fetchUsersFromFirebase, 
  clearUsersCache,
  type FirebaseUser
} from '../../utils/userService';
import { formatDate } from '../../utils/formatDate';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where, limit, getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const UsersManagementTab = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<FirebaseUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cache for referrer names by referral code
  const [referrerNames, setReferrerNames] = useState<Record<string, string>>({});

  // Resolve and cache referrer names so we can display a friendly name instead of a code
  const resolveReferrerName = async (refCodeOrUid: string) => {
    if (!refCodeOrUid || referrerNames[refCodeOrUid]) return;
    try {
      // Try finding user by referralCode
      const q = query(collection(db, 'users'), where('referralCode', '==', refCodeOrUid), limit(1));
      const snap = await getDocs(q);
      let name: string | null = null;
      if (!snap.empty) {
        const data = snap.docs[0].data() as any;
        name = data.fullName || data.email || null;
      } else {
        // Fallback: treat referredBy as a UID
        const userDocSnap = await getDoc(doc(db, 'users', refCodeOrUid));
        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as any;
          name = data.fullName || data.email || null;
        }
      }
      if (name) {
        setReferrerNames(prev => ({ ...prev, [refCodeOrUid]: name as string }));
      }
    } catch (e) {
      console.warn('Could not resolve referrer name for', refCodeOrUid, e);
    }
  };

  useEffect(() => {
    if (selectedUser?.referredBy) {
      resolveReferrerName(selectedUser.referredBy);
    }
  }, [selectedUser?.referredBy]);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users...');
      const usersData = await fetchUsersFromFirebase();
      console.log('📊 Users data received:', usersData);
      setUsers(usersData);
      console.log('✅ Users state updated, count:', usersData.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Loading finished');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    clearUsersCache();
    await fetchUsers();
    setRefreshing(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Normalize plan keys coming from Firestore to our translation keys
  const normalizePlanKey = (plan?: string): string => {
    if (!plan) return '';
    const p = String(plan).toLowerCase().replace(/\s+/g, '');
    if (p.includes('first') && (p.includes('lifetime') || p.includes('life'))) return 'firstLifetime';
    if (p.includes('first') && (p.includes('6') || p.includes('six'))) return 'first6';
    if (p.includes('business')) return 'business';
    if (p.includes('economy')) return 'economy';
    return plan;
  };

  // Filter users based on search query, status and plan
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchQuery === '' || 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && user.accountStatus === 'active') ||
      (filterStatus === 'suspended' && user.accountStatus === 'suspended');
      
    const planValue = normalizePlanKey(user.membership?.planName || user.plan);
    const matchesPlan = 
      filterPlan === 'all' || 
      normalizePlanKey(filterPlan) === planValue;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'fullName':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'balance':
        comparison = a.balance - b.balance;
        break;
      case 'plan': {
        const planA = normalizePlanKey(a.membership?.planName || a.plan);
        const planB = normalizePlanKey(b.membership?.planName || b.plan);
        comparison = planA.localeCompare(planB);
        break;
      }
      case 'referrals':
        comparison = a.referrals - b.referrals;
        break;
      case 'createdAt':
      default:
        // Handle null/undefined timestamps
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        
        const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        comparison = dateA.getTime() - dateB.getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Get plan icon based on plan name
  const getPlanIcon = (plan: string) => {
    switch (normalizePlanKey(plan)) {
      case 'business':
        return <FaGem className="text-purple-400" />;
      case 'firstLifetime':
        return <FaCrown className="text-yellow-400" />;
      case 'first6':
        return <FaStar className="text-blue-400" />;
      default:
        return <FaCoins className="text-gray-400" />;
    }
  };

  // Map any stored plan variant to one of our select option values
  const mapPlanForSelect = (plan?: string): string => {
    if (!plan) return '';
    const p = String(plan).toLowerCase();
    if (p.includes('first') && (p.includes('lifetime') || p.includes('life'))) return 'first-lifetime';
    if (p.includes('first') && (p.includes('6') || p.includes('six'))) return 'first-6';
    if (p.includes('business')) return 'business';
    if (p.includes('economy')) return 'economy';
    // Handle exact dashed values too
    if (p === 'first-6') return 'first-6';
    if (p === 'first-lifetime') return 'first-lifetime';
    return 'economy';
  };

  // Get KYC status badge
  const getKycStatusBadge = (status: string) => {
    let color = '';
    let icon = null;
    
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'approved':
        color = 'bg-green-500/20 text-green-400 border-green-500/30';
        icon = <FaCheck className="w-3 h-3 mr-1" />;
        break;
      case 'pending':
        color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        icon = <FaClock className="w-3 h-3 mr-1" />;
        break;
      case 'rejected':
        color = 'bg-red-500/20 text-red-400 border-red-500/30';
        icon = <FaTimes className="w-3 h-3 mr-1" />;
        break;
      default:
        color = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        icon = <FaIdCard className="w-3 h-3 mr-1" />;
    }
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${color} border`}>
        {icon}
        {status || t('admin.users.status.notActivated')}
      </div>
    );
  };

  // Get account status badge
  const getAccountStatusBadge = (status: string) => {
    const color = status === 'active' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-red-500/20 text-red-400 border-red-500/30';
    
    const icon = status === 'active' 
      ? <FaCheck className="w-3 h-3 mr-1" /> 
      : <FaBan className="w-3 h-3 mr-1" />;
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${color} border`}>
        {icon}
        {status === 'active' ? t('admin.users.status.active') : t('admin.users.status.suspended')}
      </div>
    );
  };

  // Handle view user details
  const handleViewUserDetails = (user: FirebaseUser) => {
    console.log('Opening user details modal for:', user);
    setSelectedUser(user);
    setShowUserDetailModal(true);
    console.log('Modal state set to:', true);
  };

  // Render user detail modal
  const renderUserDetailModal = () => {
    console.log('Rendering modal, showUserDetailModal:', showUserDetailModal, 'selectedUser:', selectedUser);
    if (!selectedUser) return null;
    
    return (
      <Dialog open={showUserDetailModal} onOpenChange={setShowUserDetailModal}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 text-white max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FaUserCheck className="text-blue-400" />
              {t('admin.users.userInformation')}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {t('admin.users.detailedInformation')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Tabs defaultValue="basic" className="w-full" onValueChange={(value) => console.log('Tab changed to:', value)}>
              <TabsList className="w-full mb-6 inline-flex items-center justify-between rounded-lg bg-white/10 p-1 border border-white/20">
                <TabsTrigger value="basic" className="w-full">
                  {t('admin.users.tabs.basicInfo')}
                </TabsTrigger>
                <TabsTrigger value="account" className="w-full">
                  {t('admin.users.tabs.accountInfo')}
                </TabsTrigger>
                <TabsTrigger value="financial" className="w-full">
                  {t('admin.users.tabs.financialInfo')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                {/* Basic Information */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <FaIdCard className="text-blue-400" />
                    {t('admin.users.tabs.basicInfo')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        <span className="text-gray-400">{t('admin.users.table.joined')}:</span>
                        <span>{formatDate(selectedUser.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        <span className="text-gray-400">{t('admin.users.table.lastLogin')}:</span>
                        <span>{formatDate(selectedUser.lastLogin)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FaGlobe className="text-gray-400" />
                        <span className="text-gray-400">{t('admin.users.location')}:</span>
                        <span>{selectedUser.country || '-'}{selectedUser.city ? `, ${selectedUser.city}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUserFriends className="text-gray-400" />
                        <span className="text-gray-400">{t('admin.users.referrals')}:</span>
                        <span>{selectedUser.referrals}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaIdCard className="text-gray-400" />
                        <span className="text-gray-400">{t('admin.users.table.kycStatus')}:</span>
                        {getKycStatusBadge(selectedUser.kycStatus)}
                      </div>
                      {selectedUser.lastUserAgent && (
                        <div className="flex items-start gap-2">
                          <FaIdCard className="text-gray-400 mt-1" />
                          <span className="text-gray-400">{t('admin.users.lastDevice')}:</span>
                          <span className="text-xs break-all">{selectedUser.lastUserAgent}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="account" className="space-y-4">
                {/* Account Information */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <FaCrown className="text-yellow-400" />
                    {t('admin.users.membership')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          {getPlanIcon(selectedUser.membership?.planName || selectedUser.plan)}
                          {(() => {
                            const key = normalizePlanKey(selectedUser.membership?.planName || selectedUser.plan);
                            const label = t(`admin.users.plans.${key}`);
                            return <span>{label || (selectedUser.membership?.planName || selectedUser.plan)}</span>;
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        <span className="text-gray-400">{t('admin.users.planStartDate')}:</span>
                        <span>{formatDate(selectedUser.membership?.purchaseDate || selectedUser.planStartDate)}</span>
                      </div>

                      {(selectedUser as any).membership?.subscriptionEnd && (
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          <span className="text-gray-400">{t('admin.users.planEndDate')}:</span>
                          <span>{formatDate((selectedUser as any).membership?.subscriptionEnd)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {selectedUser.membership?.paymentMethod && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t('admin.users.paymentMethod')}:</span>
                          <span>{t(`admin.users.paymentMethods.${selectedUser.membership.paymentMethod}`) || selectedUser.membership.paymentMethod}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{t('admin.users.referralCode')}:</span>
                        <span>{selectedUser.referralCode}</span>
                      </div>
                      {selectedUser.referredBy && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t('admin.users.referredBy')}:</span>
                          <span>{referrerNames[selectedUser.referredBy] || selectedUser.referredBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="financial" className="space-y-4">
                {/* Financial Information */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-400" />
                    {t('admin.users.financialInformation')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.table.balance')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaCoins className="text-yellow-400" />
                        {selectedUser.balance.toLocaleString()} FSN
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.totalRewardsClaimed')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaGift className="text-purple-400" />
                        {selectedUser.totalRewardsClaimed.toLocaleString()} FSN
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.totalDeposits')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaWallet className="text-green-400" />
                        {selectedUser.totalDeposits.toLocaleString()} FSN
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.totalWithdrawals')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaWallet className="text-red-400" />
                        {selectedUser.totalWithdrawals.toLocaleString()} FSN
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button 
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2"
              onClick={() => setShowUserDetailModal(false)}
            >
              {t('admin.common.close')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.users.title')}</h2>
            <p className="text-gray-400 text-xs sm:text-sm">{t('admin.users.description')}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('admin.users.filters.allStatus')}</option>
            <option value="active">{t('admin.users.status.active')}</option>
            <option value="suspended">{t('admin.users.status.suspended')}</option>
          </select>
          
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('admin.users.filters.allPlans')}</option>
            <option value="economy">{t('admin.users.plans.economy')}</option>
            <option value="business">{t('admin.users.plans.business')}</option>
            <option value="first6">{t('admin.users.plans.first6')}</option>
            <option value="firstLifetime">{t('admin.users.plans.firstLifetime')}</option>
          </select>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            <FaUsers className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('admin.common.refreshing') : t('admin.common.refresh')}
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">{t('admin.users.loading')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-white/5">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(sortedUsers.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded border-white/30 bg-white/10"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => {
                        if (sortBy === 'fullName') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('fullName');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      {t('admin.users.table.user')}
                    </th>
                    <th className="px-4 py-3">{t('admin.users.table.plan')}</th>
                    <th 
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => {
                        if (sortBy === 'balance') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('balance');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      {t('admin.users.table.balance')}
                    </th>
                    <th className="px-4 py-3">{t('admin.users.table.status')}</th>
                    <th 
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => {
                        if (sortBy === 'createdAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('createdAt');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      {t('admin.users.table.joined')}
                    </th>
                    <th className="px-4 py-3">{t('admin.users.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        {t('admin.users.noUsers')}
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-white/30 bg-white/10"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                              {user.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {getPlanIcon(user.membership?.planName || user.plan)}
                            {(() => {
                              const key = normalizePlanKey(user.membership?.planName || user.plan);
                              const label = t(`admin.users.plans.${key}`);
                              return <span className="ml-1">{label || (user.membership?.planName || user.plan)}</span>;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{user.balance.toLocaleString()} FSN</td>
                        <td className="px-4 py-3">
                          {getAccountStatusBadge(user.accountStatus)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewUserDetails(user)}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title={t('admin.users.actions.viewDetails')}
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                const currentPlan = user.membership?.planName || user.plan;
                                setNewPlan(mapPlanForSelect(currentPlan));
                                setIsEditDialogOpen(true);
                              }}
                              className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {renderUserDetailModal()}

      {/* Edit User Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-lg w-[95vw] sm:w-full text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaEdit className="text-yellow-400" />
              {t('admin.users.updatePlan')}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {t('admin.users.selectNewPlan')}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">{t('admin.users.table.user')}</div>
                <div className="font-medium">{editingUser.fullName} <span className="text-gray-400">({editingUser.email})</span></div>
              </div>
              <div>
                <label className="block text-sm mb-2">{t('admin.users.selectNewPlan')}</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">{t('admin.users.selectPlan')}</option>
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first-6">First-6</option>
                  <option value="first-lifetime">First-Lifetime</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 pt-4">
            <button
              onClick={async () => {
                if (!editingUser || !newPlan) return;
                try {
                  setActionLoading(true);
                  const userRef = doc(db, 'users', editingUser.id);
                  await updateDoc(userRef, {
                    'membership.plan': newPlan,
                    'membership.planName': newPlan,
                    plan: newPlan,
                  });
                  // Also try to update nested membership object if it exists as a whole
                  // without removing other fields
                  // Note: updateDoc above already sets the two paths; the code below
                  // simply ensures local state mirrors both locations
                  // Update local state
                  setUsers(prev => prev.map(u => u.id === editingUser.id 
                    ? { 
                        ...u, 
                        plan: newPlan,
                        membership: u.membership ? { ...u.membership, planName: newPlan } : u.membership
                      }
                    : u
                  ));
                  clearUsersCache();
                  setIsEditDialogOpen(false);
                  setEditingUser(null);
                  setNewPlan('');
                } catch (e) {
                  console.error('Error updating plan:', e);
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={!newPlan || actionLoading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <FaCheck className="w-4 h-4" />
                {t('admin.users.updatePlan')}
              </span>
            </button>
            <button
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
                setNewPlan('');
              }}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
            >
              {t('admin.common.cancel')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-lg w-[95vw] sm:w-full text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaTrash className="text-red-400" />
              {t('admin.users.deleteUser')}
            </DialogTitle>
          </DialogHeader>
          {deletingUser && (
            <div className="space-y-2">
              <div className="text-sm text-gray-300">{deletingUser.fullName}</div>
              <div className="text-xs text-gray-400">{deletingUser.email}</div>
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 pt-4">
            <button
              onClick={async () => {
                if (!deletingUser) return;
                try {
                  setActionLoading(true);
                  await deleteDoc(doc(db, 'users', deletingUser.id));
                  setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
                  clearUsersCache();
                  setIsDeleteDialogOpen(false);
                  setDeletingUser(null);
                } catch (e) {
                  console.error('Error deleting user:', e);
                } finally {
                  setActionLoading(false);
                }
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              {t('admin.users.confirmDelete')}
            </button>
            <button
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingUser(null);
              }}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
            >
              {t('admin.common.cancel')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UsersManagementTab;

