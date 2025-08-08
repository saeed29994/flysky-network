// 📁 src/components/admin/RewardsTab.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaGift, FaSearch, FaEye, FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaUser, FaCoins, FaStar, FaTrophy, FaMedal, FaCrown, FaGem
} from 'react-icons/fa';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement' | 'referral' | 'bonus' | 'special';
  amount: number;
  currency: string;
  isActive: boolean;
  maxClaims: number;
  currentClaims: number;
  startDate: string;
  endDate: string;
  requirements: string[];
  icon: string;
  color: string;
}

const RewardsTab = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Placeholder data with translated content
  const rewards: Reward[] = [
    {
      id: 'RWD001',
      name: t('admin.rewards.sampleRewards.dailyLogin.name'),
      description: t('admin.rewards.sampleRewards.dailyLogin.description'),
      type: 'daily',
      amount: 50,
      currency: 'FSN',
      isActive: true,
      maxClaims: 1000,
      currentClaims: 847,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      requirements: [t('admin.rewards.requirements.loginDaily'), t('admin.rewards.requirements.completeProfile')],
      icon: 'FaGift',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'RWD002',
      name: t('admin.rewards.sampleRewards.weeklyMining.name'),
      description: t('admin.rewards.sampleRewards.weeklyMining.description'),
      type: 'weekly',
      amount: 200,
      currency: 'FSN',
      isActive: true,
      maxClaims: 500,
      currentClaims: 234,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      requirements: [t('admin.rewards.requirements.mineConsecutiveDays'), t('admin.rewards.requirements.minimumMined')],
      icon: 'FaCoins',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'RWD003',
      name: t('admin.rewards.sampleRewards.referralChampion.name'),
      description: t('admin.rewards.sampleRewards.referralChampion.description'),
      type: 'referral',
      amount: 1000,
      currency: 'FSN',
      isActive: true,
      maxClaims: 100,
      currentClaims: 67,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      requirements: [t('admin.rewards.requirements.referActiveUsers'), t('admin.rewards.requirements.usersCompleteKYC')],
      icon: 'FaUser',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'RWD004',
      name: t('admin.rewards.sampleRewards.firstClassAchievement.name'),
      description: t('admin.rewards.sampleRewards.firstClassAchievement.description'),
      type: 'achievement',
      amount: 5000,
      currency: 'FSN',
      isActive: true,
      maxClaims: 50,
      currentClaims: 23,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      requirements: [t('admin.rewards.requirements.upgradeToFirstClass'), t('admin.rewards.requirements.maintainForDays')],
      icon: 'FaCrown',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'RWD005',
      name: t('admin.rewards.sampleRewards.monthlyStaking.name'),
      description: t('admin.rewards.sampleRewards.monthlyStaking.description'),
      type: 'monthly',
      amount: 300,
      currency: 'FSN',
      isActive: false,
      maxClaims: 200,
      currentClaims: 89,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      requirements: [t('admin.rewards.requirements.stakeMinimum'), t('admin.rewards.requirements.holdForDays')],
      icon: 'FaGem',
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'RWD006',
      name: t('admin.rewards.sampleRewards.specialEvent.name'),
      description: t('admin.rewards.sampleRewards.specialEvent.description'),
      type: 'special',
      amount: 1500,
      currency: 'FSN',
      isActive: true,
      maxClaims: 75,
      currentClaims: 75,
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      requirements: [t('admin.rewards.requirements.participateInEvent'), t('admin.rewards.requirements.completeAllChallenges')],
      icon: 'FaTrophy',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  // Filter rewards
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = 
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || reward.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && reward.isActive) ||
      (statusFilter === 'inactive' && !reward.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Statistics
  const totalRewards = rewards.length;
  const activeRewards = rewards.filter(r => r.isActive).length;
  const totalValue = rewards.reduce((sum, r) => sum + (r.amount * r.currentClaims), 0);
  const totalClaims = rewards.reduce((sum, r) => sum + r.currentClaims, 0);

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'FaGift': return <FaGift className="w-5 h-5" />;
      case 'FaCoins': return <FaCoins className="w-5 h-5" />;
      case 'FaUser': return <FaUser className="w-5 h-5" />;
      case 'FaCrown': return <FaCrown className="w-5 h-5" />;
      case 'FaGem': return <FaGem className="w-5 h-5" />;
      case 'FaTrophy': return <FaTrophy className="w-5 h-5" />;
      case 'FaStar': return <FaStar className="w-5 h-5" />;
      case 'FaMedal': return <FaMedal className="w-5 h-5" />;
      default: return <FaGift className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'text-green-400 bg-green-400/10';
      case 'weekly': return 'text-blue-400 bg-blue-400/10';
      case 'monthly': return 'text-purple-400 bg-purple-400/10';
      case 'achievement': return 'text-yellow-400 bg-yellow-400/10';
      case 'referral': return 'text-pink-400 bg-pink-400/10';
      case 'bonus': return 'text-indigo-400 bg-indigo-400/10';
      case 'special': return 'text-orange-400 bg-orange-400/10';
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
            <FaGift className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.rewards.stats.totalRewards')}</p>
              <p className="text-white font-bold text-lg">{totalRewards}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCheck className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.rewards.stats.activeRewards')}</p>
              <p className="text-white font-bold text-lg">{activeRewards}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCoins className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.rewards.stats.totalValue')}</p>
              <p className="text-white font-bold text-lg">{totalValue.toLocaleString()} FSN</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaUser className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">{t('admin.rewards.stats.totalClaims')}</p>
              <p className="text-white font-bold text-lg">{totalClaims.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Reward Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          <FaPlus className="w-4 h-4" />
          {t('admin.rewards.createReward')}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.rewards.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('admin.rewards.filters.allTypes')}</option>
            <option value="daily">{t('admin.rewards.filters.daily')}</option>
            <option value="weekly">{t('admin.rewards.filters.weekly')}</option>
            <option value="monthly">{t('admin.rewards.filters.monthly')}</option>
            <option value="achievement">{t('admin.rewards.filters.achievement')}</option>
            <option value="referral">{t('admin.rewards.filters.referral')}</option>
            <option value="bonus">{t('admin.rewards.filters.bonus')}</option>
            <option value="special">{t('admin.rewards.filters.special')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('admin.rewards.filters.allStatus')}</option>
            <option value="active">{t('admin.rewards.filters.active')}</option>
            <option value="inactive">{t('admin.rewards.filters.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRewards.map((reward, index) => (
          <motion.div 
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl relative ${
              !reward.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${reward.color} rounded-xl flex items-center justify-center`}>
                  {getRewardIcon(reward.icon)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{reward.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(reward.type)}`}>
                    {t(`admin.rewards.rewardTypes.${reward.type}`)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {reward.amount.toLocaleString()} {reward.currency}
                </p>
                <p className={`text-sm ${reward.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {reward.isActive ? t('admin.rewards.status.active') : t('admin.rewards.status.inactive')}
                </p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4">{reward.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{t('admin.rewards.details.claims')}</p>
                <p className="text-white font-bold">{reward.currentClaims}/{reward.maxClaims}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{t('admin.rewards.details.period')}</p>
                <p className="text-white font-bold text-sm">{reward.startDate} - {reward.endDate}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-gray-400 text-xs font-medium">{t('admin.rewards.details.requirements')}:</p>
              {reward.requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <FaCheck className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-xs">{req}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedReward(reward);
                  setShowDetailsModal(true);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEye className="w-3 h-3" />
                {t('admin.rewards.actions.view')}
              </button>
              <button
                onClick={() => {
                  setSelectedReward(reward);
                  setShowDetailsModal(true);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEdit className="w-3 h-3" />
                {t('admin.rewards.actions.edit')}
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reward Details Modal */}
      {showDetailsModal && selectedReward && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaEye className="w-4 h-4 text-blue-400" />
              {t('admin.rewards.details.title')}: {selectedReward.name}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.rewards.details.basicInformation')}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">{t('admin.rewards.details.id')}:</span> <span className="text-white">{selectedReward.id}</span></p>
                  <p><span className="text-gray-400">{t('admin.rewards.details.type')}:</span> <span className="text-white capitalize">{t(`admin.rewards.rewardTypes.${selectedReward.type}`)}</span></p>
                  <p><span className="text-gray-400">{t('admin.rewards.details.amount')}:</span> <span className="text-white">{selectedReward.amount.toLocaleString()} {selectedReward.currency}</span></p>
                  <p><span className="text-gray-400">{t('admin.rewards.details.status')}:</span> <span className={`${selectedReward.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedReward.isActive ? t('admin.rewards.status.active') : t('admin.rewards.status.inactive')}
                  </span></p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.rewards.form.description')}</h4>
                <p className="text-gray-300 text-sm">{selectedReward.description}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.rewards.details.statistics')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">{t('admin.rewards.details.claims')}</p>
                    <p className="text-white font-bold">{selectedReward.currentClaims}/{selectedReward.maxClaims}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t('admin.rewards.details.period')}</p>
                    <p className="text-white font-bold text-xs">{selectedReward.startDate} - {selectedReward.endDate}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.rewards.details.requirements')}</h4>
                <div className="space-y-1">
                  {selectedReward.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FaCheck className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                {t('admin.rewards.actions.close')}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Reward Modal */}
      {showCreateModal && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaPlus className="w-4 h-4 text-green-400" />
              {t('admin.rewards.createModal.title')}
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('admin.rewards.createModal.namePlaceholder')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder={t('admin.rewards.createModal.descriptionPlaceholder')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <select className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('admin.rewards.createModal.selectType')}</option>
                                  <option value="daily">{t('admin.rewards.filters.daily')}</option>
                  <option value="weekly">{t('admin.rewards.filters.weekly')}</option>
                  <option value="monthly">{t('admin.rewards.filters.monthly')}</option>
                  <option value="achievement">{t('admin.rewards.filters.achievement')}</option>
                  <option value="referral">{t('admin.rewards.filters.referral')}</option>
                  <option value="bonus">{t('admin.rewards.filters.bonus')}</option>
                  <option value="special">{t('admin.rewards.filters.special')}</option>
              </select>
              
              <input
                type="number"
                placeholder={t('admin.rewards.createModal.amountPlaceholder')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="number"
                placeholder={t('admin.rewards.createModal.maxClaimsPlaceholder')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-2">
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <FaCheck className="w-4 h-4" />
                  {t('admin.rewards.actions.create')}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  {t('admin.rewards.actions.cancel')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RewardsTab; 