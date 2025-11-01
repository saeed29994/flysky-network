import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, writeBatch, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  XCircle,
  User,
  Mail,
  Clock,
  Eye,
  Users,
  BadgeCheck,
  History,
  Search,
  Trash2
} from 'lucide-react';
import  CustomSelect  from '../ui/CustomSelect';
import CustomSearch from '../ui/CustomSearch';
import KycVerificationTabModal from './KycVerificationTabModal';

const KycVerificationTab = () => {
  const { t } = useTranslation();
  const [allKycUsers, setAllKycUsers] = useState<any[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<any[]>([]);
  const [userDetails, setUserDetails] = useState<{ [key: string]: { name: string, email: string } }>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userToReject, setUserToReject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'log'>('all');
  const [approvingUsers, setApprovingUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'approved' | 'referrer'>('approved');
  const [isSearching, setIsSearching] = useState(false);

  // Helper function to determine if a user should be included in KYC list
  const shouldIncludeUser = (data: any): boolean => {
    // Must have a KYC status
    if (!data.kycStatus) return false;
    
    // Always include pending users
    if (data.kycStatus === 'Pending') return true;
    
    // Include verified/approved users
    if (data.kycStatus === 'Verified' || data.kycStatus === 'Approved') return true;
    
    // Include rejected users if they have rejection details
    if (data.kycStatus === 'Not activated' || data.kycStatus === 'Not Actived' || data.kycStatus === 'Rejected') {
      return !!(data.kycRejectionReason || data.kycActionTaken);
    }
    
    // Include other users if they have KYC documents or have been processed
    return !!(data.kycDocuments || data.kycActionTaken || data.kycRejectionReason);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users for KYC list and for details mapping
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const kycUsers: any[] = [];
      const details: { [key: string]: { name: string, email: string } } = {};
      
      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        details[docSnap.id] = { 
          name: data.fullName || 'Unknown User',
          email: data.email || 'No Email'
        };
        
        if (shouldIncludeUser(data)) {
          kycUsers.push({ 
            id: docSnap.id, 
            ...data,
            kycStatusUpdatedAt: data.kycStatusUpdatedAt || data.createdAt || null
          });
        }
      });
      
      setAllKycUsers(kycUsers);
      setUserDetails(details);

      // Fetch approval logs
      const logsSnapshot = await getDocs(collection(db, 'kycApprovalLogs'));
      const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApprovalLogs(logs);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleKycLog = async (user: any) => {
    if (!user || !user.referredBy) {
      return; // No referrer, no log needed
    }

    try {
      console.log('Creating KYC approval log for user:', user.id, 'with referrer:', user.referredBy);

      let referrerName = 'Unknown';
      let referrerEmail = 'No email';
      let actualReferrerId = user.referredBy; // Default to the referral code

      // First, try to find the actual user who owns this referral code
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', user.referredBy));
      const querySnapshot = await getDocs(q);

      console.log('Query for referral code returned', querySnapshot.size, 'results');

      if (!querySnapshot.empty) {
        // Found the user with this referral code
        const referrerDoc = querySnapshot.docs[0];
        const referrerData = referrerDoc.data() as any;
        console.log('Found referrer user:', referrerDoc.id, 'data:', referrerData);

        referrerName = referrerData.fullName || 'Unknown';
        referrerEmail = referrerData.email || 'No email';
        actualReferrerId = referrerDoc.id; // Use the actual user ID
      } else {
        // Fallback: try to get the user directly by ID (in case referredBy is already a user ID)
        console.log('No user found with referral code, trying direct user lookup...');
        const referrerDoc = await getDoc(doc(db, 'users', user.referredBy));

        if (referrerDoc.exists()) {
          const referrerData = referrerDoc.data();
          console.log('Found referrer by direct ID:', referrerData);
          referrerName = referrerData?.fullName || 'Unknown';
          referrerEmail = referrerData?.email || 'No email';
          actualReferrerId = user.referredBy;
        } else {
          console.log('No referrer found at all');
        }
      }

      console.log('Final referrer data - Name:', referrerName, 'Email:', referrerEmail, 'ID:', actualReferrerId);

      await addDoc(collection(db, 'kycApprovalLogs'), {
        approvedUserId: user.id,
        approvedUserName: user.fullName || 'Unknown User',
        approvedUserEmail: user.email || 'No email',
        referrerId: actualReferrerId,
        referrerName: referrerName,
        referrerEmail: referrerEmail,
        rewardAmount: 100, // Default reward amount
        status: 'completed',
        claimed: false,
        claimTimestamp: null,
        timestamp: new Date(),
      });

      console.log('KYC approval log created successfully');
      // Refresh logs after adding a new one
      fetchData();
    } catch (error) {
      console.error('Error creating KYC approval log:', error);
    }
  };

  const handleKycAction = async (user: any, action: 'approve' | 'reject') => {
    try {
      const userRef = doc(db, 'users', user.id);
      const newStatus = action === 'approve' ? 'Verified' : 'Not activated';
      const now = new Date();

      if (action === 'reject') {
        setUserToReject(user);
        setShowRejectionModal(true);
        return;
      }

      // Add user to approving set
      setApprovingUsers(prev => new Set(prev).add(user.id));

      await updateDoc(userRef, {
        kycStatus: newStatus,
        kycStatusUpdatedAt: now,
        kycActionTaken: action,
        kycActionDate: now
      });

      // Log the approval
      if (action === 'approve') {
        await handleKycLog(user);
      }

      // Update local state
      setAllKycUsers(prev => prev.map(u =>
        u.id === user.id
          ? { ...u, kycStatus: newStatus, kycStatusUpdatedAt: now }
          : u
      ));

      // Remove user from approving set
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });

      toast.success(t('admin.kyc.approvedSuccess', 'KYC approved successfully'));
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating KYC status:', error);
      // Remove user from approving set on error
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
      toast.error(t('admin.kyc.approveFailed', 'Failed to approve KYC'));
    }
  };

  const handleKycRejection = async () => {
    if (!userToReject || !rejectionReason.trim()) {
      alert(t('admin.kyc.rejectionReasonRequired', 'Please provide a rejection reason'));
      return;
    }

    try {
      const userRef = doc(db, 'users', userToReject.id);
      const now = new Date();

      await updateDoc(userRef, {
        kycStatus: 'Not activated',
        kycStatusUpdatedAt: now,
        kycActionTaken: 'reject',
        kycActionDate: now,
        kycRejectionReason: rejectionReason.trim(),
        kycRejectionDate: now
      });

      // Update local state
      setAllKycUsers(prev => prev.map(user =>
        user.id === userToReject.id
          ? {
              ...user,
              kycStatus: 'Not activated',
              kycStatusUpdatedAt: now,
              kycRejectionReason: rejectionReason.trim(),
              kycRejectionDate: now
            }
          : user
      ));

      // Close modals and reset state
      setShowRejectionModal(false);
      setShowModal(false);
      setSelectedUser(null);
      setUserToReject(null);
      setRejectionReason('');
      toast.success(t('admin.kyc.rejectedSuccess', 'KYC rejected successfully'));
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error(t('admin.kyc.rejectFailed', 'Failed to reject KYC'));
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm(t('ApprovalLog.confirmDeleteLog', 'Are you sure you want to delete this approval log?'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'kycApprovalLogs', logId));
      setApprovalLogs(prev => prev.filter(log => log.id !== logId));
      toast.success(t('ApprovalLog.logDeleted', 'Approval log deleted successfully'));
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error(t('ApprovalLog.deleteLogFailed', 'Failed to delete approval log'));
    }
  };

  const handleDeleteAllLogs = async () => {
    if (!confirm(t('ApprovalLog.confirmDeleteAllLogs', 'Are you sure you want to delete ALL approval logs? This action cannot be undone.'))) {
      return;
    }

    try {
      const batch = writeBatch(db);
      approvalLogs.forEach(log => {
        batch.delete(doc(db, 'kycApprovalLogs', log.id));
      });
      await batch.commit();
      setApprovalLogs([]);
      toast.success(t('ApprovalLog.allLogsDeleted', 'All approval logs deleted successfully'));
    } catch (error) {
      console.error('Error deleting all logs:', error);
      toast.error(t('ApprovalLog.deleteAllLogsFailed', 'Failed to delete all approval logs'));
    }
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const openRejectionModal = (user: any) => {
    setUserToReject(user);
    setShowRejectionModal(true);
  };

  // Filter users based on active tab
  const getFilteredUsers = () => {
    const filtered = (() => {
      switch (activeTab) {
        case 'pending':
          return allKycUsers.filter(user => 
            user.kycStatus === 'Pending'
          );
        case 'approved':
          return allKycUsers.filter(user => 
            user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
          );
        case 'rejected':
          return allKycUsers.filter(user => 
            user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived' || user.kycStatus === 'Rejected'
          );
        case 'log':
            return []; // Logs are handled separately
        default:
          return allKycUsers;
      }
    })();
    
    return filtered;
  };

  // Get counts for each category
  const getCounts = () => {
    const pending = allKycUsers.filter(user =>
      user.kycStatus === 'Pending'
    ).length;
    const approved = allKycUsers.filter(user =>
      user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
    ).length;
    const rejected = allKycUsers.filter(user =>
      user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived' || user.kycStatus === 'Rejected'
    ).length;

    const counts = { all: allKycUsers.length, pending, approved, rejected, logs: approvalLogs.length };
    return counts;
  };

  // Filter logs based on search term
  const getFilteredLogs = () => {
    if (!searchTerm.trim()) return approvalLogs;
    return approvalLogs.filter(log =>
      log.approvedUserEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.approvedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userDetails[log.referrerId]?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userDetails[log.referrerId]?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Refresh logs function - clears search and reloads logs
  const handleRefreshLogs = async () => {
    setSearchTerm('');
    setIsSearching(false);
    setSearchType('approved');

    try {
      // Fetch approval logs
      const logsSnapshot = await getDocs(collection(db, 'kycApprovalLogs'));
      const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApprovalLogs(logs);
    } catch (error) {
      console.error('Error refreshing logs:', error);
    }
  };

  const counts = getCounts();
  const filteredUsers = getFilteredUsers();
  const filteredLogs = useMemo(() => {
    if (isSearching && searchTerm.trim()) {
      return approvalLogs.filter(log => {
        const searchLower = searchTerm.toLowerCase();

        if (searchType === 'approved') {
          return log.approvedUserName?.toLowerCase().includes(searchLower) ||
                 log.approvedUserEmail?.toLowerCase().includes(searchLower);
        } else if (searchType === 'referrer') {
          return userDetails[log.referrerId]?.name?.toLowerCase().includes(searchLower) ||
                 userDetails[log.referrerId]?.email?.toLowerCase().includes(searchLower) ||
                 log.referrerName?.toLowerCase().includes(searchLower) ||
                 log.referrerEmail?.toLowerCase().includes(searchLower);
        }
        return false;
      });
    } else {
      return getFilteredLogs();
    }
  }, [isSearching, searchTerm, searchType, approvalLogs, userDetails]);

  // Add refresh button to stats cards
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="space-y-6"
    >
      {/* Stats Cards with Refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{t('admin.kyc.title', 'KYC Verification')}</h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
        >
          <div className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full ${loading ? 'animate-spin' : ''}`}></div>
          {loading ? t('admin.kyc.refreshing', 'Refreshing...') : t('admin.kyc.refresh', 'Refresh')}
        </button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{counts.all}</h3>
              <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.totalKYC', 'Total KYC')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{counts.pending}</h3>
              <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.pendingRequests', 'Pending')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{counts.approved}</h3>
              <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.approved', 'Approved')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{counts.rejected}</h3>
              <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.rejected', 'Rejected')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Requests with Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-white/10">
          <div className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-white border-b-2 border-yellow-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('admin.kyc.all', 'All')} ({counts.all})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'text-white border-b-2 border-yellow-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('admin.kyc.pending', 'Pending')} ({counts.pending})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'text-white border-b-2 border-yellow-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('admin.kyc.approved', 'Approved')} ({counts.approved})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'text-white border-b-2 border-yellow-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('admin.kyc.rejected', 'Rejected')} ({counts.rejected})
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'log'
                  ? 'text-white border-b-2 border-yellow-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('ApprovalLog.title', 'Approval Log')} ({filteredLogs.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.loading', 'Loading KYC data...')}</p>
            </div>
          ) : activeTab === 'log' ? (
            <>
              <div className="mb-4">
                {/* Mobile Layout */}
                <div className="lg:hidden space-y-4">
                  {/* Search Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('ApprovalLog.searchTerm', 'Search Term')}
                      </label>
                      <CustomSearch
                        placeholder={t('ApprovalLog.approvedUser', 'Approved User')}
                        onSearch={(value) => setSearchTerm(value)}
                        onCancel={() => setSearchTerm('')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('ApprovalLog.searchType', 'Search In')}
                      </label>
                      <CustomSelect
                        value={searchType}
                        onChange={(value: string) => setSearchType(value as 'approved' | 'referrer')}
                        options={[
                          { value: 'approved', label: t('ApprovalLog.approvedUser', 'Approved User') },
                          { value: 'referrer', label: t('ApprovalLog.referrer', 'Referrer') }
                        ]}
                        placeholder={t('ApprovalLog.selectSearchType', 'Select search type')}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefreshLogs}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        {t('ApprovalLog.refresh', 'Refresh')}
                      </button>
                    </div>
                  </div>

                  {/* Delete All Button */}
                  {filteredLogs.length > 0 && (
                    <button
                      onClick={handleDeleteAllLogs}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('ApprovalLog.deleteAll', 'Delete All')}
                    </button>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:flex lg:gap-4 items-end">
                  {/* Search Term - 45% width */}
                  <div className="flex-[0_0_45%]">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('ApprovalLog.searchTerm', 'Search Term')}
                    </label>
                    <CustomSearch
                      placeholder={t('ApprovalLog.approvedUser', 'Approved User')}
                      onSearch={(value) => setSearchTerm(value)}
                      onCancel={() => setSearchTerm('')}
                    />
                  </div>

                  {/* Search Type - 20% width */}
                  <div className="flex-[0_0_20%]">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('ApprovalLog.searchType', 'Search In')}
                    </label>
                    <CustomSelect
                      value={searchType}
                      onChange={(value: string) => setSearchType(value as 'approved' | 'referrer')}
                      options={[
                        { value: 'approved', label: t('ApprovalLog.approvedUser', 'Approved User') },
                        { value: 'referrer', label: t('ApprovalLog.referrer', 'Referrer') }
                      ]}
                      placeholder={t('ApprovalLog.selectSearchType', 'Select search type')}
                    />
                  </div>

                  {/* Buttons - Remaining space */}
                  <div className="flex gap-2 justify-end flex-1">
                    <button
                      onClick={handleRefreshLogs}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {t('ApprovalLog.refresh', 'Refresh')}
                    </button>
                    {filteredLogs.length > 0 && (
                      <button
                        onClick={handleDeleteAllLogs}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('ApprovalLog.deleteAll', 'Delete All')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {filteredLogs.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  {t('ApprovalLog.noLogs', 'No Approval Logs')}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  {t('ApprovalLog.noLogsDesc', 'No KYC approvals for referred users have been logged yet.')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-300 uppercase bg-white/5">
                    <tr>
                      <th scope="col" className="px-6 py-3">{t('ApprovalLog.tableApprovedUser', 'Approved User')}</th>
                      <th scope="col" className="px-6 py-3">{t('ApprovalLog.tableReferrer', 'Referrer')}</th>
                      <th scope="col" className="px-6 py-3">{t('ApprovalLog.reward', 'Reward')}</th>
                      <th scope="col" className="px-6 py-3">{t('ApprovalLog.date', 'Date')}</th>
                      <th scope="col" className="px-6 py-3">{t('ApprovalLog.claimStatus', 'Claim Status')}</th>
                      <th scope="col" className="px-6 py-3">{t('ApprovalLog.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-6 py-4 font-medium text-white">
                          <div>{userDetails[log.approvedUserId]?.name || log.approvedUserName}</div>
                          <div className="text-xs text-gray-500">{userDetails[log.approvedUserId]?.email || log.approvedUserEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{userDetails[log.referrerId]?.name || log.referrerName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{userDetails[log.referrerId]?.email || log.referrerEmail}</div>
                        </td>
                        <td className="px-6 py-4">{log.rewardAmount} FSN</td>
                        <td className="px-6 py-4">
                          {log.timestamp?.toDate().toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.claimed
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {log.claimed ? t('ApprovalLog.claimed', 'Claimed') : t('ApprovalLog.notClaimed', 'Not Claimed')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title={t('ApprovalLog.deleteLog', 'Delete Log')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                {activeTab === 'all' && t('admin.kyc.noKYCUsers', 'No KYC Users')}
                {activeTab === 'pending' && t('admin.kyc.noPendingRequests', 'No Pending Requests')}
                {activeTab === 'approved' && t('admin.kyc.noApprovedUsers', 'No Approved Users')}
                {activeTab === 'rejected' && t('admin.kyc.noRejectedUsers', 'No Rejected Users')}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {activeTab === 'all' && t('admin.kyc.noKYCUsersDesc', 'No users have submitted KYC documents yet')}
                {activeTab === 'pending' && t('admin.kyc.allProcessed', 'All KYC requests have been processed')}
                {activeTab === 'approved' && t('admin.kyc.noApprovedUsersDesc', 'No users have been approved yet')}
                {activeTab === 'rejected' && t('admin.kyc.noRejectedUsersDesc', 'No users have been rejected yet')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm">{user.fullName || t('admin.kyc.unknownUser', 'Unknown User')}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Mail className="w-3 h-3" />
                          {user.email || t('admin.kyc.noEmail', 'No email')}
                        </div>
                                                 <div className="mt-2 space-y-2">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
                               ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                               : user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived'
                                 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                 : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                           }`}>
                             {user.kycStatus}
                           </span>
                           
                           {user.kycRejectionReason && (
                             <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                               <div className="font-medium mb-1">{t('admin.kyc.rejectionReason', 'Rejection Reason')}:</div>
                               <div className="text-red-300">{user.kycRejectionReason}</div>
                             </div>
                           )}
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openUserDetails(user)}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin.kyc.viewDetails', 'View Details')}
                      </button>
                      
                                             {(user.kycStatus === 'Pending') && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleKycAction(user, 'approve')}
                              disabled={approvingUsers.has(user.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {approvingUsers.has(user.id) ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {approvingUsers.has(user.id) ? t('admin.kyc.approving', 'Approving...') : t('admin.kyc.approve', 'Approve')}
                            </button>
                            
                            <button
                              onClick={() => openRejectionModal(user)}
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <XCircle className="w-4 h-4" />
                              {t('admin.kyc.reject', 'Reject')}
                            </button>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{user.fullName || t('admin.kyc.unknownUser', 'Unknown User')}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Mail className="w-4 h-4" />
                          {user.email || t('admin.kyc.noEmail', 'No email')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {user.kycStatus}
                        </span>
                        
                        {user.kycRejectionReason && (
                          <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20 max-w-xs">
                            <div className="font-medium mb-1">{t('admin.kyc.rejectionReason', 'Rejection Reason')}:</div>
                            <div className="text-red-300 truncate">{user.kycRejectionReason}</div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => openUserDetails(user)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin.kyc.viewDetails', 'View Details')}
                      </button>
                      
                      {(user.kycStatus === 'Pending') && (
                        <>
                          <button
                            onClick={() => handleKycAction(user, 'approve')}
                            disabled={approvingUsers.has(user.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approvingUsers.has(user.id) ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {approvingUsers.has(user.id) ? t('admin.kyc.approving', 'Approving...') : t('admin.kyc.approve', 'Approve')}
                          </button>
                          
                          <button
                            onClick={() => openRejectionModal(user)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            {t('admin.kyc.reject', 'Reject')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <KycVerificationTabModal
        showModal={showModal}
        selectedUser={selectedUser}
        showRejectionModal={showRejectionModal}
        userToReject={userToReject}
        rejectionReason={rejectionReason}
        approvingUsers={approvingUsers}
        setShowModal={setShowModal}
        setShowRejectionModal={setShowRejectionModal}
        setRejectionReason={setRejectionReason}
        handleKycAction={handleKycAction}
        handleKycRejection={handleKycRejection}
      />
    </motion.div>
  );
};

export default KycVerificationTab;
