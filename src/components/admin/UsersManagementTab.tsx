// 📁 src/components/admin/UsersManagementTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaUsers, FaSearch, FaEdit, FaTrash, FaCheck, FaTimes, FaEye, FaDownload,
  FaCrown, FaStar, FaGem, FaCoins, FaUserCheck, FaUserTimes, FaFilter,
  FaSort, FaBan, FaUnlock, FaKey, FaChartLine, FaWallet, FaHistory
} from 'react-icons/fa';

interface User {
  id: string;
  fullName: string;
  email: string;
  kycStatus: string;
  plan: string;
  balance: number;
  stakingStatus: string;
  isActive: boolean;
  createdAt: any;
  lastLogin: any;
  referralCode: string;
  referredBy: string;
}

const UsersManagementTab = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: 'user1',
        fullName: 'John Doe',
        email: 'john@example.com',
        kycStatus: 'Verified',
        plan: 'business',
        balance: 1500,
        stakingStatus: 'Active - 500 FSN staked',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-12-20'),
        referralCode: 'JOHN123',
        referredBy: 'ADMIN001'
      },
      {
        id: 'user2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        kycStatus: 'Pending',
        plan: 'first-6',
        balance: 800,
        stakingStatus: 'Inactive',
        isActive: true,
        createdAt: new Date('2024-02-20'),
        lastLogin: new Date('2024-12-19'),
        referralCode: 'JANE456',
        referredBy: 'JOHN123'
      },
      {
        id: 'user3',
        fullName: 'Mike Johnson',
        email: 'mike@example.com',
        kycStatus: 'Verified',
        plan: 'first-lifetime',
        balance: 2500,
        stakingStatus: 'Active - 1000 FSN staked',
        isActive: false,
        createdAt: new Date('2024-03-10'),
        lastLogin: new Date('2024-12-18'),
        referralCode: 'MIKE789',
        referredBy: 'JANE456'
      }
    ];
    setUsers(mockUsers);
    setLoading(false);
  }, []);

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortBy as keyof User];
    let bValue = b[sortBy as keyof User];
    
    if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
      aValue = new Date(aValue as any).getTime();
      bValue = new Date(bValue as any).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }
    
    switch (action) {
      case 'activate':
        setUsers(prev => prev.map(user => 
          selectedUsers.includes(user.id) ? { ...user, isActive: true } : user
        ));
        break;
      case 'deactivate':
        setUsers(prev => prev.map(user => 
          selectedUsers.includes(user.id) ? { ...user, isActive: false } : user
        ));
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
          setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        }
        break;
    }
    setSelectedUsers([]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <FaUsers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Users Management</h2>
            <p className="text-gray-400 text-sm">Manage user accounts, plans, and permissions</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaUsers className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-white font-bold text-lg">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaUserCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-white font-bold text-lg">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaGem className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Premium Plans</p>
                <p className="text-white font-bold text-lg">{users.filter(u => u.plan !== 'economy').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaWallet className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-white font-bold text-lg">{users.reduce((sum, u) => sum + u.balance, 0).toLocaleString()} FSN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
          >
            <option value="all">All Plans</option>
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first-6">First-6</option>
            <option value="first-lifetime">First-Lifetime</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="fullName-asc">Name A-Z</option>
            <option value="fullName-desc">Name Z-A</option>
            <option value="balance-desc">Balance High-Low</option>
            <option value="balance-asc">Balance Low-High</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{selectedUsers.length} users selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FaUnlock className="w-3 h-3" />
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FaBan className="w-3 h-3" />
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FaTrash className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/10 border-b border-white/10">
                  <th className="py-4 px-4 text-left">
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
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">User</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Plan</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Balance</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">KYC Status</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Status</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Joined</th>
                  <th className="py-4 px-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded border-white/30 bg-white/10"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{user.fullName}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <p className="text-gray-500 text-xs">ID: {user.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 bg-gradient-to-r ${getPlanColor(user.plan)} rounded-lg flex items-center justify-center`}>
                          {getPlanIcon(user.plan)}
                        </div>
                        <span className="text-white capitalize">{user.plan}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{user.balance.toLocaleString()} FSN</p>
                    </td>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-300 text-sm">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm"
                        >
                          <FaEdit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setUsers(prev => prev.map(u => 
                              u.id === user.id ? { ...u, isActive: !u.isActive } : u
                            ));
                          }}
                          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                            user.isActive 
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {user.isActive ? <FaBan className="w-3 h-3" /> : <FaUnlock className="w-3 h-3" />}
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              setUsers(prev => prev.filter(u => u.id !== user.id));
                            }
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm"
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
        )}
      </div>

      {/* Edit Plan Modal */}
      {editingUserId && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaEdit className="w-4 h-4 text-blue-400" />
            Update User Plan
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Plan</option>
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first-6">First-6</option>
              <option value="first-lifetime">First-Lifetime</option>
            </select>
            <button
              onClick={() => {
                if (newPlan) {
                  setUsers(prev => prev.map(u => 
                    u.id === editingUserId ? { ...u, plan: newPlan } : u
                  ));
                  setEditingUserId(null);
                  setNewPlan('');
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FaCheck className="w-4 h-4" />
              Update Plan
            </button>
            <button
              onClick={() => {
                setEditingUserId(null);
                setNewPlan('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FaTimes className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UsersManagementTab;
