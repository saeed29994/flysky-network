// 📁 src/components/admin/UsersManagementTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaUsers, FaEdit, FaTrash, FaCheck, FaTimes,
  FaCrown, FaStar, FaGem, FaCoins, FaUserCheck,
  FaBan, FaWallet, FaEye, FaCalendarAlt,
  FaClock, FaGlobe, FaUserFriends, FaIdCard, FaMoneyBillWave, FaGift, FaLock,
  FaChevronLeft, FaChevronRight, FaChartLine , FaCopy,
} from 'react-icons/fa';
import {
  fetchUsersFromFirebase,
  clearUsersCache,
  type FirebaseUser
} from '../../utils/userService';
import { formatDate } from '../../utils/formatDate';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where, limit, getDoc, addDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import CustomSelect from '../ui/CustomSelect';
import CustomSearch from '../ui/CustomSearch';

const UsersManagementTab = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<FirebaseUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stakingModalOpen, setStakingModalOpen] = useState(false);
  const [selectedStakingUser, setSelectedStakingUser] = useState<FirebaseUser | null>(null);
  const [stakingData, setStakingData] = useState<any[]>([]);
  const [stakingLoading, setStakingLoading] = useState(false);
  const [deleteConfirmationChecked, setDeleteConfirmationChecked] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
      // console.warn('Could not resolve referrer name for', refCodeOrUid, e);
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
      // console.log('🔍 Fetching users...');
      const usersData = await fetchUsersFromFirebase();
      // console.log('📊 Users data received:', usersData.length, 'users');
      setUsers(usersData);
      // console.log('✅ Users state updated, count:', usersData.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setLoading(false);
      // console.log('🏁 Loading finished');
    }
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPlan]);

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

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    // console.log('Opening user details modal for:', user);
    setSelectedUser(user);
    setShowUserDetailModal(true);
    // console.log('Modal state set to:', true);
  };

  // Handle view staking details
  const handleViewStakingDetails = async (user: FirebaseUser) => {
    setSelectedStakingUser(user);
    setStakingModalOpen(true);
    setStakingLoading(true);

    try {
      const stakingSnap = await getDocs(collection(db, 'users', user.id, 'staking'));
      const stakingList = stakingSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStakingData(stakingList);
    } catch (error) {
      console.error('Error fetching staking data:', error);
      setStakingData([]);
    } finally {
      setStakingLoading(false);
    }
  };

  // Handle copy email to clipboard
  const handleCopyEmail = async (email: string) => {
    try {
      // Always use the fallback method for better compatibility
      const textArea = document.createElement('textarea');
      textArea.value = email;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success(`Email copied: ${email}`, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy email to clipboard', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Handle block/unblock user
  const handleBlockUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const userRef = doc(db, 'users', selectedUser.id);
      const newBlockStatus = !selectedUser.block;

      const updateData: any = {
        block: newBlockStatus,
      };

      // Add block reason when blocking user
      if (newBlockStatus && blockReason.trim()) {
        updateData.blockReason = blockReason.trim();
        updateData.blockedAt = new Date().toISOString();
        updateData.blockedBy = 'admin'; // You might want to get actual admin ID
      } else if (!newBlockStatus) {
        // Clear block reason when unblocking
        updateData.blockReason = null;
        updateData.blockedAt = null;
        updateData.blockedBy = null;
      }

      await updateDoc(userRef, updateData);

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, block: newBlockStatus, blockReason: newBlockStatus ? blockReason.trim() : null }
          : u
      ));

      clearUsersCache();
      setIsBlockDialogOpen(false);
      setSelectedUser(null);
      setBlockReason('');

      toast.success(
        newBlockStatus
          ? t('admin.users.blockSuccess', 'User blocked successfully')
          : t('admin.users.unblockSuccess', 'User unblocked successfully')
      );
    } catch (error) {
      console.error('Error updating user block status:', error);
      toast.error(t('admin.users.blockError', 'Failed to update user block status'));
    } finally {
      setActionLoading(false);
    }
  };

  // Render user detail modal
  const renderUserDetailModal = () => {
    // console.log('Rendering modal, showUserDetailModal:', showUserDetailModal, 'selectedUser:', selectedUser);
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
                    
                    {/* Staking Earnings */}
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.stakingEarnings')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaCoins className="text-amber-400" />
                        {(selectedUser.stakingEarnings || 0).toLocaleString()} FSN
                      </div>
                    </div>
                    
                    {/* Active Stakes */}
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.activeStakes')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaLock className="text-blue-400" />
                        {selectedUser.activeStakes || 0} stakes
                      </div>
                    </div>
                    
                    {/* Total Staked Amount */}
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-gray-400 mb-1">{t('admin.users.totalStaked')}</div>
                      <div className="text-xl font-bold flex items-center gap-2">
                        <FaLock className="text-orange-400" />
                        {(selectedUser.totalStaked || 0).toLocaleString()} FSN
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CustomSearch
            placeholder={t('admin.users.searchPlaceholder')}
            onSearch={(value) => setSearchQuery(value)}
            onCancel={() => setSearchQuery('')}
          />

          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: t('admin.users.filters.allStatus') },
              { value: 'active', label: t('admin.users.status.active') },
              { value: 'suspended', label: t('admin.users.status.suspended') }
            ]}
            placeholder={t('admin.users.filters.allStatus')}
          />

          <CustomSelect
            value={filterPlan}
            onChange={setFilterPlan}
            options={[
              { value: 'all', label: t('admin.users.filters.allPlans') },
              { value: 'economy', label: t('admin.users.plans.economy') },
              { value: 'business', label: t('admin.users.plans.business') },
              { value: 'first6', label: t('admin.users.plans.first6') },
              { value: 'firstLifetime', label: t('admin.users.plans.firstLifetime') }
            ]}
            placeholder={t('admin.users.filters.allPlans')}
          />

          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterPlan('all');
              setSortBy('createdAt');
              setSortOrder('desc');
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-500/30 hover:border-gray-500/50 text-sm font-medium"
          >
            Clear Filters
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
                    <th className="px-4 py-3">Copy</th>
                    <th className="px-4 py-3">Block</th>
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
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        {t('admin.users.noUsers')}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                              {user.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCopyEmail(user.email)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                            title="Copy Email"
                          >
                            <FaCopy className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsBlockDialogOpen(true);
                              }}
                              disabled={user.block}
                              className={`p-1 transition-colors ${
                                user.block
                                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                                  : 'text-red-400 hover:text-red-300'
                              }`}
                              title="Block User"
                            >
                              <FaBan className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsBlockDialogOpen(true);
                              }}
                              disabled={!user.block}
                              className={`p-1 transition-colors ${
                                !user.block
                                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                                  : 'text-green-400 hover:text-green-300'
                              }`}
                              title="Unblock User"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
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
                              onClick={() => handleViewStakingDetails(user)}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="View Staking Details"
                            >
                              <FaChartLine className="w-4 h-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedUsers.length)} of {sortedUsers.length} users
            </div>
            <div className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {renderUserDetailModal()}

      {/* Staking Details Modal */}
      <Dialog open={stakingModalOpen} onOpenChange={setStakingModalOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 text-white max-w-4xl w-[95vw] h-[95vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FaChartLine className="text-green-400" />
              Staking Details - {selectedStakingUser?.fullName}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Complete staking information for this user
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            {stakingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2">Loading staking data...</span>
              </div>
            ) : stakingData.length === 0 ? (
              <div className="text-center py-8">
                <FaChartLine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No staking records found for this user.</p>
              </div>
            ) : (
              <div className="space-y-4 pr-2">
                {stakingData.map((stake) => (
                  <div key={stake.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm">Amount</div>
                        <div className="text-white font-semibold">{stake.amount?.toLocaleString()} FSN</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Expected Return</div>
                        <div className="text-green-400 font-semibold">{stake.expectedReturn?.toLocaleString()} FSN</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Status</div>
                        <div className={`font-semibold ${
                          stake.status === 'active' ? 'text-green-400' :
                          stake.status === 'completed' ? 'text-blue-400' : 'text-red-400'
                        }`}>
                          {stake.status}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Duration</div>
                        <div className="text-white font-semibold">{stake.duration} months</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Start Date</div>
                        <div className="text-white text-sm">
                          {stake.startDate ? new Date(stake.startDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">End Date</div>
                        <div className="text-white text-sm">
                          {stake.endDate ? new Date(stake.endDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Claimed</div>
                        <div className={`font-semibold ${stake.claimed ? 'text-green-400' : 'text-red-400'}`}>
                          {stake.claimed ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Earnings</div>
                        <div className="text-yellow-400 font-semibold">
                          {stake.claimed && stake.status === 'completed'
                            ? (stake.expectedReturn - stake.amount).toLocaleString()
                            : stake.status === 'active'
                              ? (stake.expectedReturn - stake.amount).toLocaleString()
                              : '0'
                          } FSN
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2"
              onClick={() => setStakingModalOpen(false)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Block/Unblock User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-lg w-[95vw] sm:w-full text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.block ? (
                <>
                  <FaCheck className="text-green-400" />
                  Unblock User
                </>
              ) : (
                <>
                  <FaBan className="text-red-400" />
                  Block User
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedUser?.block
                ? 'This will unblock the user and allow them to access the application again.'
                : 'This will block the user and prevent them from accessing the application.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <FaUserCheck className="text-blue-400" />
                  User Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaUserCheck className="text-gray-400" />
                    <span className="text-gray-400 text-sm">Name:</span>
                    <span className="text-white font-medium">{selectedUser.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Email:</span>
                    <span className="text-white">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Current Status:</span>
                    <span className={`font-medium ${selectedUser.block ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedUser.block ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {!selectedUser.block && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white block">Block Reason (Required)</label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Please provide a reason for blocking this user..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px] resize-none"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    This reason will be shown to the user when they try to access the application.
                  </p>
                </div>
              )}

              <div className={`bg-${selectedUser.block ? 'green' : 'red'}-500/10 border border-${selectedUser.block ? 'green' : 'red'}-500/20 rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 bg-${selectedUser.block ? 'green' : 'red'}-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {selectedUser.block ? <FaCheck className="w-3 h-3 text-white" /> : <FaBan className="w-3 h-3 text-white" />}
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-base font-semibold text-${selectedUser.block ? 'green' : 'red'}-400`}>
                      {selectedUser.block ? 'Unblock User' : 'Block User'}
                    </h3>
                    <p className={`text-${selectedUser.block ? 'green' : 'red'}-300 text-sm`}>
                      {selectedUser.block
                        ? 'The user will regain access to the application and all features.'
                        : 'The user will be unable to log in and access any application features.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 pt-4">
            <button
              onClick={handleBlockUser}
              disabled={actionLoading || !selectedUser || (!selectedUser.block && !blockReason.trim())}
              className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                selectedUser?.block
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-500'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  {selectedUser?.block ? <FaCheck className="w-4 h-4" /> : <FaBan className="w-4 h-4" />}
                  {selectedUser?.block ? 'Unblock User' : 'Block User'}
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsBlockDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={actionLoading}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg border border-white/20 font-medium"
            >
              {t('admin.common.cancel')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-2xl w-[95vw] sm:w-full text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaTrash className="text-red-400" />
              {t('admin.users.deleteUser')}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {t('admin.users.deleteWarningDescription')}
            </DialogDescription>
          </DialogHeader>

          {deletingUser && (
            <div className="space-y-4">
              {/* Warning Section */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaTrash className="w-3 h-3 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-red-400">
                      {t('admin.users.deleteWarning')}
                    </h3>
                    <p className="text-red-300 text-sm">
                      {t('admin.users.deleteWarningDescription')}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <FaIdCard className="text-blue-400" />
                  {t('admin.users.userToDelete')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FaUserCheck className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{t('admin.users.table.name')}:</span>
                      <span className="text-white font-medium">{deletingUser.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaIdCard className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{t('admin.users.table.email')}:</span>
                      <span className="text-white">{deletingUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCrown className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{t('admin.users.table.plan')}:</span>
                      <span className="text-white capitalize">{deletingUser.plan}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FaWallet className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{t('admin.users.table.balance')}:</span>
                      <span className="text-yellow-400 font-bold">{deletingUser.balance.toLocaleString()} FSN</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUserFriends className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{t('admin.users.referrals')}:</span>
                      <span className="text-white">{deletingUser.referrals}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{t('admin.users.table.joined')}:</span>
                      <span className="text-white text-sm">{formatDate(deletingUser.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What will be deleted */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-yellow-400 font-semibold mb-2">{t('admin.users.deleteWhatWillBeDeleted')}</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• {t('admin.users.deleteItems.account')}</li>
                  <li>• {t('admin.users.deleteItems.transactions')}</li>
                  <li>• {t('admin.users.deleteItems.mining')}</li>
                  <li>• {t('admin.users.deleteItems.staking')}</li>
                  <li>• {t('admin.users.deleteItems.referrals')}</li>
                  <li>• {t('admin.users.deleteItems.kyc')}</li>
                  <li>• {t('admin.users.deleteItems.settings')}</li>
                </ul>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                <input
                  type="checkbox"
                  id="delete-confirmation"
                  checked={deleteConfirmationChecked}
                  onChange={(e) => setDeleteConfirmationChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <label htmlFor="delete-confirmation" className="text-sm text-gray-300 cursor-pointer">
                 I understand that this action is irreversible and I want to permanently delete this user along with all of their data.
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 pt-4">
            <button
              onClick={async () => {
                if (!deletingUser || !deleteConfirmationChecked) return;

                try {
                  setActionLoading(true);

                  // Log the deletion action
                  const deletionLog = {
                    userId: deletingUser.id,
                    userEmail: deletingUser.email,
                    userName: deletingUser.fullName,
                    balance: deletingUser.balance,
                    plan: deletingUser.plan,
                    referrals: deletingUser.referrals,
                    kycStatus: deletingUser.kycStatus,
                    accountStatus: deletingUser.accountStatus,
                    totalRewardsClaimed: deletingUser.totalRewardsClaimed,
                    totalDeposits: deletingUser.totalDeposits,
                    totalWithdrawals: deletingUser.totalWithdrawals,
                    createdAt: deletingUser.createdAt,
                    deletedBy: 'admin', // You might want to get actual admin ID
                    deletedAt: new Date(),
                    reason: 'Admin deletion from dashboard'
                  };

                  // Save deletion log
                  await addDoc(collection(db, 'userDeletionLogs'), deletionLog);

                  // Delete the user
                  await deleteDoc(doc(db, 'users', deletingUser.id));

                  // Clear cache and refresh data
                  clearUsersCache();
                  await fetchUsers();

                  // Reset states
                  setIsDeleteDialogOpen(false);
                  setDeletingUser(null);
                  setDeleteConfirmationChecked(false);

                  // Show success message (you might want to add a toast system)
                  // Show success message
                  // console.log(`✅ User ${deletingUser.fullName} deleted successfully`);
                  toast.success(`✅ User deleted successfully ${deletingUser.fullName} بنجاح`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });

                } catch (error: any) {
                  console.error('Error deleting user:', error);

                  let errorMessage = 'An error occurred while deleting the user';
                  if (error.code === 'permission-denied') {
                    errorMessage = 'You do not have permission to delete users.';
                  } else if (error.code === 'not-found') {
                    errorMessage = 'User not found';
                  }

                  toast.error(`❌ error: ${errorMessage}`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });
                  console.error('Delete user error:', error);
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={!deleteConfirmationChecked || actionLoading || !deletingUser}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحذف...
                </>
              ) : (
                <>
                  <FaTrash className="w-4 h-4" />
                  {t('admin.users.confirmDelete')}
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingUser(null);
                setDeleteConfirmationChecked(false);
              }}
              disabled={actionLoading}
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg border border-white/20 font-medium"
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

