import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Clock, 
  AlertCircle,
  Eye,
  Users,
  BadgeCheck
} from 'lucide-react';

const KycVerificationTab = () => {
  const { t } = useTranslation();
  const [allKycUsers, setAllKycUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Helper function to check if a date is today
  // const isToday = (date: Date) => {
  //   const today = new Date();
  //   return date.getDate() === today.getDate() &&
  //          date.getMonth() === today.getMonth() &&
  //          date.getFullYear() === today.getFullYear();
  // };

  useEffect(() => {
    const fetchKycData = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'users'));
        const kycUsers: any[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Only include users who have submitted KYC (have kycStatus field)
          if (data.kycStatus && data.kycStatus !== 'Not activated' && data.kycStatus !== 'Not Actived') {
            kycUsers.push({ 
              id: docSnap.id, 
              ...data,
              // Add timestamp if not exists (for backward compatibility)
              kycStatusUpdatedAt: data.kycStatusUpdatedAt || data.createdAt || null
            });
          }
        });
        
        console.log('Fetched KYC users:', kycUsers);
        console.log('KYC statuses found:', kycUsers.map(u => ({ id: u.id, status: u.kycStatus, name: u.fullName })));
        
        setAllKycUsers(kycUsers);
      } catch (error) {
        console.error('Error fetching KYC data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKycData();
  }, []);

  const handleKycAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const userRef = doc(db, 'users', userId);
      const newStatus = action === 'approve' ? 'Verified' : 'Not activated';
      const now = new Date();
      
      await updateDoc(userRef, { 
        kycStatus: newStatus,
        kycStatusUpdatedAt: now,
        kycActionTaken: action,
        kycActionDate: now
      });
      
      // Update local state
      setAllKycUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, kycStatus: newStatus, kycStatusUpdatedAt: now }
          : user
      ));
      
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating KYC status:', error);
    }
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Function to refresh KYC data
  const refreshKycData = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const kycUsers: any[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Only include users who have submitted KYC (have kycStatus field)
        if (data.kycStatus && data.kycStatus !== 'Not activated' && data.kycStatus !== 'Not Actived') {
          kycUsers.push({ 
            id: docSnap.id, 
            ...data,
            // Add timestamp if not exists (for backward compatibility)
            kycStatusUpdatedAt: data.kycStatusUpdatedAt || data.createdAt || null
          });
        }
      });
      
      setAllKycUsers(kycUsers);
    } catch (error) {
      console.error('Error refreshing KYC data:', error);
    } finally {
      setLoading(false);
    }
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
            user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived'
          );
        default:
          return allKycUsers;
      }
    })();
    
    console.log(`Filtered users for tab '${activeTab}':`, filtered);
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
      user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived'
    ).length;
    
    const counts = { all: allKycUsers.length, pending, approved, rejected };
    console.log('KYC counts:', counts);
    return counts;
  };

  const counts = getCounts();
  const filteredUsers = getFilteredUsers();

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
          onClick={refreshKycData}
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
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.loading', 'Loading KYC data...')}</p>
            </div>
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
                                                 <div className="mt-2">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
                               ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                               : user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived'
                                 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                 : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                           }`}>
                             {user.kycStatus}
                           </span>
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
                              onClick={() => handleKycAction(user.id, 'approve')}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {t('admin.kyc.approve', 'Approve')}
                            </button>
                            
                            <button
                              onClick={() => handleKycAction(user.id, 'reject')}
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
                                             <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                         user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
                           ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                           : user.kycStatus === 'Not activated' || user.kycStatus === 'Not Actived'
                             ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                             : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                       }`}>
                         {user.kycStatus}
                       </span>
                      
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
                            onClick={() => handleKycAction(user.id, 'approve')}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t('admin.kyc.approve', 'Approve')}
                          </button>
                          
                          <button
                            onClick={() => handleKycAction(user.id, 'reject')}
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

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.kyc.userDetails', 'User Details')}</h2>
                    <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.verificationInfo', 'Verification Information')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.fullName', 'Full Name')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white text-sm sm:text-base">{selectedUser.fullName || t('admin.kyc.notProvided', 'Not provided')}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.email', 'Email')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white text-sm sm:text-base">{selectedUser.email || t('admin.kyc.notProvided', 'Not provided')}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.userId', 'User ID')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white font-mono text-xs sm:text-sm break-all">{selectedUser.id}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.registrationDate', 'Registration Date')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white text-sm sm:text-base">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt.toDate()).toLocaleDateString() : t('admin.kyc.unknown', 'Unknown')}
                    </span>
                  </div>
                </div>
              </div>

              {/* KYC Documents Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('admin.kyc.documents', 'KYC Documents')}
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {selectedUser.kycDocuments ? (
                    Object.entries(selectedUser.kycDocuments).map(([docType, url]: [string, any]) => (
                      <div key={docType} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-white font-medium capitalize text-sm sm:text-base">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                            <p className="text-gray-400 text-xs sm:text-sm">{t('admin.kyc.documentUploaded', 'Document uploaded')}</p>
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg text-sm hover:from-blue-600 hover:to-cyan-600 transition-colors text-center"
                          >
                            {t('admin.kyc.viewDocument', 'View Document')}
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.noDocuments', 'No documents uploaded')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleKycAction(selectedUser.id, 'approve')}
                  className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('admin.kyc.approve', 'Approve')}
                </button>
                
                <button
                  onClick={() => handleKycAction(selectedUser.id, 'reject')}
                  className="w-full sm:flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('admin.kyc.reject', 'Reject')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default KycVerificationTab;
