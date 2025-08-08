// 📁 src/components/admin/TransactionsTab.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaCreditCard, FaSearch, FaEye, FaCheck, FaTimes,
  FaCalendarAlt, FaUser, FaCoins, FaArrowUp, FaArrowDown, FaGift, FaLock
} from 'react-icons/fa';

interface Transaction {
  id: string;
  userName: string;
  userEmail: string;
  type: 'stake' | 'reward' | 'referral' | 'mining' | 'withdrawal' | 'deposit' | 'bonus';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  currency: string;
}

const TransactionsTab = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Placeholder data
  const transactions: Transaction[] = [
    {
      id: 'TX001',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      type: 'stake',
      amount: 1000,
      description: 'Staked 1000 FSN for 30 days',
      timestamp: '2024-12-20 10:30 AM',
      status: 'completed',
      currency: 'FSN'
    },
    {
      id: 'TX002',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      type: 'reward',
      amount: 150,
      description: 'Mining reward claimed',
      timestamp: '2024-12-20 09:15 AM',
      status: 'completed',
      currency: 'FSN'
    },
    {
      id: 'TX003',
      userName: 'Bob Johnson',
      userEmail: 'bob@example.com',
      type: 'referral',
      amount: 500,
      description: 'Referral bonus earned',
      timestamp: '2024-12-20 08:45 AM',
      status: 'completed',
      currency: 'FSN'
    },
    {
      id: 'TX004',
      userName: 'Alice Brown',
      userEmail: 'alice@example.com',
      type: 'withdrawal',
      amount: 200,
      description: 'Withdrawal to wallet',
      timestamp: '2024-12-20 08:00 AM',
      status: 'pending',
      currency: 'FSN'
    },
    {
      id: 'TX005',
      userName: 'Mike Wilson',
      userEmail: 'mike@example.com',
      type: 'mining',
      amount: 75,
      description: 'Daily mining reward',
      timestamp: '2024-12-19 11:30 PM',
      status: 'completed',
      currency: 'FSN'
    },
    {
      id: 'TX006',
      userName: 'Sarah Davis',
      userEmail: 'sarah@example.com',
      type: 'bonus',
      amount: 100,
      description: 'Welcome bonus',
      timestamp: '2024-12-19 10:20 PM',
      status: 'completed',
      currency: 'FSN'
    }
  ];

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalTransactions = transactions.length;
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completedTransactions = transactions.filter(tx => tx.status === 'completed').length;
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending').length;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'stake': return <FaLock className="w-4 h-4" />;
      case 'reward': return <FaGift className="w-4 h-4" />;
      case 'referral': return <FaUser className="w-4 h-4" />;
      case 'mining': return <FaCoins className="w-4 h-4" />;
      case 'withdrawal': return <FaArrowUp className="w-4 h-4" />;
      case 'deposit': return <FaArrowDown className="w-4 h-4" />;
      case 'bonus': return <FaGift className="w-4 h-4" />;
      default: return <FaCreditCard className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'stake': return 'text-blue-500';
      case 'reward': return 'text-green-500';
      case 'referral': return 'text-purple-500';
      case 'mining': return 'text-yellow-500';
      case 'withdrawal': return 'text-red-500';
      case 'deposit': return 'text-green-500';
      case 'bonus': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCreditCard className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.transaction.stats.totalTransactions', 'Total Transactions')}</p>
              <p className="text-white font-bold text-lg">{totalTransactions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCoins className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.transaction.stats.totalVolume', 'Total Volume')}</p>
              <p className="text-white font-bold text-lg">{totalVolume.toLocaleString()} FSN</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCheck className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.transaction.stats.completed', 'Completed')}</p>
              <p className="text-white font-bold text-lg">{completedTransactions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.transaction.stats.pending', 'Pending')}</p>
              <p className="text-white font-bold text-lg">{pendingTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.transaction.searchPlaceholder', 'Search transactions...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('admin.transaction.filters.all', 'All Status')}</option>
            <option value="completed">{t('admin.transaction.filters.completed', 'Completed')}</option>
            <option value="pending">{t('admin.transaction.filters.pending', 'Pending')}</option>
            <option value="failed">{t('admin.transaction.filters.failed', 'Failed')}</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('admin.transaction.table.transaction', 'Transaction')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('admin.transaction.table.user', 'User')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('admin.transaction.table.amount', 'Amount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('admin.transaction.table.date', 'Date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('admin.transaction.table.status', 'Status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('admin.transaction.table.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTransactions.map((transaction) => (
                <motion.tr 
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{t(`admin.transaction.types.${transaction.type}`, transaction.type)}</p>
                        <p className="text-gray-400 text-xs">{transaction.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-white text-sm font-medium">{transaction.userName}</p>
                      <p className="text-gray-400 text-xs">{transaction.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white font-medium">
                      {transaction.amount.toLocaleString()} {transaction.currency}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-300 text-sm">
                      {transaction.timestamp}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {t(`admin.transaction.status.${transaction.status}`, transaction.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaEye className="w-4 h-4 text-blue-400" />
              {t('admin.transaction.modal.title', 'Transaction Details')}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.transaction.modal.transactionInfo', 'Transaction Information')}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">ID:</span> <span className="text-white">{selectedTransaction.id}</span></p>
                  <p><span className="text-gray-400">Type:</span> <span className="text-white capitalize">{t(`admin.transaction.types.${selectedTransaction.type}`, selectedTransaction.type)}</span></p>
                  <p><span className="text-gray-400">Amount:</span> <span className="text-white">{selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}</span></p>
                  <p><span className="text-gray-400">Status:</span> <span className={`${getStatusColor(selectedTransaction.status)}`}>{t(`admin.transaction.status.${selectedTransaction.status}`, selectedTransaction.status)}</span></p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.transaction.modal.userInfo', 'User Information')}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Name:</span> <span className="text-white">{selectedTransaction.userName}</span></p>
                  <p><span className="text-gray-400">Email:</span> <span className="text-white">{selectedTransaction.userEmail}</span></p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.transaction.modal.description', 'Description')}</h4>
                <p className="text-gray-300 text-sm">{selectedTransaction.description}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.transaction.modal.timestamp', 'Timestamp')}</h4>
                <p className="text-gray-300 text-sm">{selectedTransaction.timestamp}</p>
              </div>
              
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                {t('admin.transaction.modal.close', 'Close')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TransactionsTab; 