import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../firebase';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FaUsers, FaCoins, FaChevronLeft, FaChevronRight,
  FaCheck, FaTrash, FaHistory
} from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import BalanceButton from '../../components/balancebutton';
import ReferralHistoryButton from '../../components/referralhistorybutton';
import  CustomSelect  from '../../components/ui/CustomSelect';
import CustomSearch from '../../components/ui/CustomSearch';

interface User {
  id: string;
  fullName: string;
  email: string;
  balance: number;
  referralCount: number;
  kycStatus: string;
  plan: string;
  referralList?: any[];
}

const BalanceAndReferrals = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterKyc, setFilterKyc] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'fullName' | 'balance' | 'referralCount'>('fullName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dialog states
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const itemsPerPage = 10;

  const planOptions = [
    { value: "", label: "All Plans" },
    { value: "economy", label: "Economy" },
    { value: "business", label: "Business" },
    { value: "first-6", label: "First Class (6M)" },
    { value: "first-lifetime", label: "First Class (Lifetime)" },
  ];

  const kycOptions = [
    { value: "", label: "All KYC Status" },
    { value: "Verified", label: "Verified" },
    { value: "Approved", label: "Approved" },
    { value: "Pending", label: "Pending" },
    { value: "Rejected", label: "Rejected" },
  ];

  const sortOptions = [
    { value: "fullName-asc", label: "Name (A-Z)" },
    { value: "fullName-desc", label: "Name (Z-A)" },
    { value: "balance-desc", label: "Highest Balance" },
    { value: "balance-asc", label: "Lowest Balance" },
    { value: "referralCount-desc", label: "Most Referrals" },
    { value: "referralCount-asc", label: "Least Referrals" },
  ];


  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const userData: User[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          fullName: data.fullName || '',
          email: data.email || '',
          balance: data.balance || 0,
          referralCount: (data.referralList || []).length,
          kycStatus: data.kycStatus || 'Pending',
          plan: data.membership?.planName || data.plan || 'economy'
        };
      });
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = !filterPlan || user.plan === filterPlan;
      const matchesKyc = !filterKyc || user.kycStatus === filterKyc;
      return matchesSearch && matchesPlan && matchesKyc;
    });

    // Dynamic sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'referralCount':
          aValue = a.referralCount;
          bValue = b.referralCount;
          break;
        default:
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
      }
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [users, searchQuery, filterPlan, filterKyc, sortField, sortDirection]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPlan, filterKyc]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBalanceUpdate = async (userId: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), { balance: newBalance });
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, balance: newBalance } : user
      ));
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance');
    }
  };

  const handleReferralUpdate = () => {
    fetchUsers(); // Refresh data after referral changes
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !balanceAdjustment || parseFloat(balanceAdjustment) <= 0) return;

    const amount = parseFloat(balanceAdjustment);
    const oldBalance = selectedUser.balance;
    const newBalance = adjustmentType === 'add'
      ? selectedUser.balance + amount
      : Math.max(0, selectedUser.balance - amount);

    // Update balance
    await handleBalanceUpdate(selectedUser.id, newBalance);

    // Log the action
    await logAction({
      type: 'balance_adjustment',
      userId: selectedUser.id,
      userName: selectedUser.fullName,
      userEmail: selectedUser.email,
      action: adjustmentType === 'add' ? 'add_balance' : 'subtract_balance',
      oldValue: oldBalance,
      newValue: newBalance,
      amount: amount,
      reason: adjustmentReason || 'Admin adjustment',
      adminId: auth.currentUser?.uid || 'unknown',
      adminEmail: auth.currentUser?.email || 'unknown'
    });

    // console.log('Balance adjustment completed and logged');
    setIsBalanceDialogOpen(false);
    setSelectedUser(null);
    setBalanceAdjustment('');
    setAdjustmentReason('');
  };

  const handleDeleteReferral = async (userId: string, referralEmail: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDocs(collection(db, 'users'));
      const userDoc = userSnap.docs.find(doc => doc.id === userId);
      if (!userDoc) return;

      const userData = userDoc.data();
      const referralList = userData.referralList || [];
      const updatedList = referralList.filter((ref: any) => ref.email !== referralEmail);

      await updateDoc(userRef, { referralList: updatedList });

      // Log the deletion
      await logAction({
        type: 'referral_deletion',
        userId: userId,
        userName: userData.fullName || 'Unknown',
        userEmail: userData.email || 'Unknown',
        action: 'delete_referral',
        referralEmail: referralEmail,
        reason: 'Admin deletion',
        adminId: auth.currentUser?.uid || 'unknown',
        adminEmail: auth.currentUser?.email || 'unknown'
      });

      fetchUsers(); // Refresh the data
    } catch (error) {
      console.error('Error deleting referral:', error);
      alert('Failed to delete referral');
    }
  };

  const logAction = async (logData: any) => {
    try {
      // console.log('Logging action:', logData);
      await addDoc(collection(db, 'balanceReferralLogs'), {
        ...logData,
        timestamp: Date.now(),
        date: new Date().toISOString()
      });
      // console.log('Log added with ID:', docRef.id);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const fetchLogs = async (userId: string) => {
    try {
      // console.log('Fetching logs for userId:', userId);
      const logsSnap = await getDocs(collection(db, 'balanceReferralLogs'));
      // console.log('Total logs in collection:', logsSnap.docs.length);

      const userLogs = logsSnap.docs
        .map(doc => {
          const data = doc.data();
          // console.log('Log data:', data);
          return { id: doc.id, ...data };
        })
        .filter((log: any) => {
          // console.log('Checking log userId:', log.userId, 'against:', userId);
          return log.userId === userId;
        })
        .sort((a: any, b: any) => b.timestamp - a.timestamp);

      // console.log('Filtered logs for user:', userId, userLogs);
      setLogs(userLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    }
  };

  const handleViewLogs = async (user: User) => {
    setSelectedUser(user);
    await fetchLogs(user.id);
    setIsLogsDialogOpen(true);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <FaCoins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Referrals and Balances</h1>
              <p className="text-gray-400 text-sm sm:text-base">Manage user balances and view referral history</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-grow w-full md:w-auto">
              <CustomSearch
                placeholder="Search by name, email, or user ID..."
                onSearch={(value) => setSearchQuery(value)}
                onCancel={() => setSearchQuery('')}
              />
            </div>
            <div className="w-full md:w-48">
              <CustomSelect
                value={filterPlan}
                onChange={setFilterPlan}
                options={planOptions}
                placeholder="All Plans"
              />
            </div>
            <div className="w-full md:w-48">
              <CustomSelect
                value={filterKyc}
                onChange={setFilterKyc}
                options={kycOptions}
                placeholder="All KYC Status"
              />
            </div>
            <div className="w-full md:w-48">
              <CustomSelect
                value={`${sortField}-${sortDirection}`}
                onChange={(value) => {
                  const [field, direction] = value.split('-') as ['fullName' | 'balance' | 'referralCount', 'asc' | 'desc'];
                  setSortField(field);
                  setSortDirection(direction);
                }}
                options={sortOptions}
                placeholder="Sort By"
              />
            </div>
            <div className="w-full md:w-auto">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterPlan('');
                    setFilterKyc('');
                    setSortField('fullName');
                    setSortDirection('asc');
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-auto px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 hover:text-white rounded-xl transition-all duration-200 border border-gray-500/30 hover:border-gray-500/50"
                >
                  Clear Filters
                </button>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">User</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Plan</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">KYC</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Balance</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Referrals</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Logs</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={7}>
                      <div className="flex flex-col items-center gap-2">
                        <FaUsers className="w-8 h-8 text-gray-600" />
                        <p>No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{user.fullName}</span>
                          <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          user.kycStatus === 'Verified' || user.kycStatus === 'Approved'
                            ? 'bg-green-500/20 text-green-400'
                            : user.kycStatus === 'Pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <BalanceButton
                          userId={user.id}
                          currentBalance={user.balance}
                          onBalanceUpdate={handleBalanceUpdate}
                        />
                      </td>
                      <td className="py-4 px-4 text-white font-medium">{user.referralCount}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleViewLogs(user)}
                          className="text-blue-400 hover:text-blue-300 transition-all duration-200 flex items-center justify-center"
                          title="View Activity Logs"
                        >
                          <FaHistory className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <ReferralHistoryButton
                          userId={user.id}
                          userName={user.fullName}
                          onReferralUpdate={handleReferralUpdate}
                        />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white disabled:text-gray-500 transition-colors"
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
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white'
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
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white disabled:text-gray-500 transition-colors"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Balance Adjustment Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-gray-200 [&>button]:hover:bg-white/10 [&>button]:rounded-lg [&>button]:p-1 [&>button]:transition-all [&>button]:duration-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white pr-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <FaCoins className="w-4 h-4 sm:w-5 sm:w-5 text-white" />
              </div>
              Adjust Balance
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Add or subtract FSN tokens from the user's balance. This action will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">User Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">Name</label>
                      <p className="text-white font-medium text-sm sm:text-base">{selectedUser.fullName}</p>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">Current Balance</label>
                      <p className="text-yellow-400 font-bold text-sm sm:text-base">{selectedUser.balance.toLocaleString()} FSN</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm sm:text-base font-medium text-white block">Adjustment Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustmentType('add')}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      adjustmentType === 'add'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    Add FSN
                  </button>
                  <button
                    onClick={() => setAdjustmentType('subtract')}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      adjustmentType === 'subtract'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    Subtract FSN
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm sm:text-base font-medium text-white block">Amount</label>
                <input
                  type="number"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm sm:text-base font-medium text-white block">Reason</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Enter reason for adjustment..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-3 pt-4 sm:pt-6">
            <button
              onClick={handleBalanceAdjustment}
              disabled={!balanceAdjustment || parseFloat(balanceAdjustment) <= 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              <FaCheck className="w-4 h-4" />
              Adjust Balance
            </button>
            <button
              onClick={() => {
                setIsBalanceDialogOpen(false);
                setSelectedUser(null);
                setBalanceAdjustment('');
                setAdjustmentReason('');
              }}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral History Dialog */}
      <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-gray-200 [&>button]:hover:bg-white/10 [&>button]:rounded-lg [&>button]:p-1 [&>button]:transition-all [&>button]:duration-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white pr-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <FaUsers className="w-4 h-4 sm:w-5 sm:w-5 text-white" />
              </div>
              Referral History
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              View and manage the referral history for this user. You can see the status of each referral and delete them if needed.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">User Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">Name</label>
                      <p className="text-white font-medium text-sm sm:text-base">{selectedUser.fullName}</p>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">Email</label>
                      <p className="text-gray-300 text-sm sm:text-base truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Referral List</h3>
                {selectedUser.referralList && selectedUser.referralList.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.referralList.map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            referral.status === 'Verified' ? 'bg-green-400' :
                            referral.status === 'Pending' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <div>
                            <p className="text-white font-medium">{referral.email}</p>
                            <p className="text-gray-400 text-sm capitalize">{referral.status}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReferral(selectedUser.id, referral.email)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                        >
                          <FaTrash className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No referrals found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 sm:pt-6">
            <button
              onClick={() => {
                setIsReferralDialogOpen(false);
                setSelectedUser(null);
              }}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-6xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-gray-200 [&>button]:hover:bg-white/10 [&>button]:rounded-lg [&>button]:p-1 [&>button]:transition-all [&>button]:duration-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white pr-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <FaHistory className="w-4 h-4 sm:w-5 sm:w-5 text-white" />
              </div>
              Activity Logs
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              View the complete activity history for this user including balance adjustments and referral changes.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">User Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">Name</label>
                      <p className="text-white font-medium text-sm sm:text-base">{selectedUser.fullName}</p>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 block mb-2">Email</label>
                      <p className="text-gray-300 text-sm sm:text-base truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Activity History</h3>
                {logs.length > 0 ? (
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={log.id || index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              log.type === 'balance_adjustment' ? 'bg-yellow-400' :
                              log.type === 'referral_deletion' ? 'bg-red-400' : 'bg-blue-400'
                            }`}></div>
                            <div>
                              <p className="text-white font-medium capitalize">
                                {log.type === 'balance_adjustment' ? 'Balance Adjustment' :
                                 log.type === 'referral_deletion' ? 'Referral Deletion' : log.type}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.action === 'add_balance' ? 'bg-green-500/20 text-green-400' :
                            log.action === 'subtract_balance' ? 'bg-red-500/20 text-red-400' :
                            log.action === 'delete_referral' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {log.action === 'add_balance' ? 'Added' :
                             log.action === 'subtract_balance' ? 'Subtracted' :
                             log.action === 'delete_referral' ? 'Deleted' : log.action}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {log.type === 'balance_adjustment' && (
                            <>
                              <div>
                                <p className="text-gray-400">Amount Changed</p>
                                <p className={`font-medium ${log.action === 'add_balance' ? 'text-green-400' : 'text-red-400'}`}>
                                  {log.action === 'add_balance' ? '+' : '-'}{log.amount?.toLocaleString()} FSN
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Balance Change</p>
                                <p className="text-white font-medium">
                                  {log.oldValue?.toLocaleString()} → {log.newValue?.toLocaleString()} FSN
                                </p>
                              </div>
                            </>
                          )}

                          {log.type === 'referral_deletion' && (
                            <div>
                              <p className="text-gray-400">Referral Email</p>
                              <p className="text-white font-medium">{log.referralEmail}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-gray-400">Admin</p>
                            <p className="text-white font-medium">{log.adminEmail}</p>
                          </div>

                          <div>
                            <p className="text-gray-400">Reason</p>
                            <p className="text-white font-medium">{log.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaHistory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No activity logs found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 sm:pt-6">
            <button
              onClick={() => {
                setIsLogsDialogOpen(false);
                setSelectedUser(null);
                setLogs([]);
              }}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BalanceAndReferrals;
