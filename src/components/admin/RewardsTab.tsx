// 📁 src/components/admin/RewardsTab.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaPlus, FaLock, FaUsers, FaPlay, FaEdit, FaTrash, FaEye, FaRedo } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { 
  fetchRewardsFromFirebase, 
  clearRewardsCache,
  type FirebaseRewards,
} from '../../utils/rewardsService';

const RewardsTab: React.FC = () => {
  const { t } = useTranslation();
  
  // State for rewards data
  const [rewards, setRewards] = useState<FirebaseRewards>({
    staking: [],
    referrals: [],
    watchAds: []
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rewardSections = [
    {
      id: 'staking',
      title: t('admin.rewards.staking.title'),
      description: t('admin.rewards.staking.description'),
      icon: FaLock,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-500',
      count: rewards.staking.length
    },
    {
      id: 'referrals',
      title: t('admin.rewards.referrals.title'),
      description: t('admin.rewards.referrals.description'),
      icon: FaUsers,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-500',
      count: rewards.referrals.length
    },
    {
      id: 'watchAds',
      title: t('admin.rewards.watchAds.title'),
      description: t('admin.rewards.watchAds.description'),
      icon: FaPlay,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-500',
      count: rewards.watchAds.length
    }
  ];

  // Fetch rewards data
  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const rewardsData = await fetchRewardsFromFirebase();
      setRewards(rewardsData);
      console.log('Rewards data loaded:', rewardsData);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Clear cache to force fresh data
    clearRewardsCache();
    await fetchRewards();
    setIsRefreshing(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchRewards();
  }, []);

  const renderEmptyState = (sectionId: string) => (
    <div className="text-center py-12">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${rewardSections.find(s => s.id === sectionId)?.bgColor} flex items-center justify-center`}>
        {React.createElement(rewardSections.find(s => s.id === sectionId)?.icon || FaCoins, { 
          className: `w-8 h-8 ${rewardSections.find(s => s.id === sectionId)?.iconColor}` 
        })}
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-2">
        {t('admin.rewards.noData', { section: rewardSections.find(s => s.id === sectionId)?.title })}
      </h3>
      <p className="text-gray-400 mb-6">
        {t('admin.rewards.startAdding', { section: rewardSections.find(s => s.id === sectionId)?.title })}
      </p>
      <button className={`bg-gradient-to-r ${rewardSections.find(s => s.id === sectionId)?.color} text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto`}>
        <FaPlus className="w-4 h-4" />
        {sectionId === 'staking' && t('admin.rewards.staking.addDuration')}
        {sectionId === 'referrals' && t('admin.rewards.referrals.addTier')}
        {sectionId === 'watchAds' && t('admin.rewards.watchAds.addReward')}
      </button>
    </div>
  );

  const renderStakingTable = () => {
    if (rewards.staking.length === 0) {
      return renderEmptyState('staking');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-white/5">
            <tr>
              <th className="px-4 py-3">{t('admin.rewards.staking.duration')}</th>
              <th className="px-4 py-3">{t('admin.rewards.staking.reward')}</th>
              <th className="px-4 py-3">{t('admin.rewards.staking.status')}</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.staking.map((reward) => (
              <tr key={reward.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">
                  {reward.duration} {t(`admin.rewards.staking.units.${reward.durationUnit}`)}
                </td>
                <td className="px-4 py-3 font-medium">{reward.reward} FSN</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reward.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {t(`admin.rewards.status.${reward.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReferralsTable = () => {
    if (rewards.referrals.length === 0) {
      return renderEmptyState('referrals');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-white/5">
            <tr>
              <th className="px-4 py-3">{t('admin.rewards.referrals.tier')}</th>
              <th className="px-4 py-3">{t('admin.rewards.referrals.referralRange')}</th>
              <th className="px-4 py-3">{t('admin.rewards.referrals.referrals')}</th>
              <th className="px-4 py-3">{t('admin.rewards.referrals.reward')}</th>
              <th className="px-4 py-3">{t('admin.rewards.referrals.status')}</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.referrals.map((reward) => (
              <tr key={reward.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">Tier {reward.tier}</td>
                <td className="px-4 py-3">
                  {reward.referralRange.min} - {reward.referralRange.max}
                </td>
                <td className="px-4 py-3">{reward.referrals}</td>
                <td className="px-4 py-3 font-medium">{reward.reward} FSN</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reward.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {t(`admin.rewards.status.${reward.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWatchAdsTable = () => {
    if (rewards.watchAds.length === 0) {
      return renderEmptyState('watchAds');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-white/5">
            <tr>
              <th className="px-4 py-3">{t('admin.rewards.watchAds.adsCount')}</th>
              <th className="px-4 py-3">{t('admin.rewards.watchAds.reward')}</th>
              <th className="px-4 py-3">{t('admin.rewards.watchAds.status')}</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.watchAds.map((reward) => (
              <tr key={reward.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{reward.adsCount} {t('admin.rewards.watchAds.ads')}</td>
                <td className="px-4 py-3 font-medium">{reward.reward} FSN</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reward.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {t(`admin.rewards.status.${reward.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStakingSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('admin.rewards.staking.title')}</h3>
        <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
          <FaPlus className="w-4 h-4" />
          {t('admin.rewards.staking.addDuration')}
        </button>
      </div>
      {renderStakingTable()}
    </div>
  );

  const renderReferralsSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('admin.rewards.referrals.title')}</h3>
        <button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
          <FaPlus className="w-4 h-4" />
          {t('admin.rewards.referrals.addTier')}
        </button>
      </div>
      {renderReferralsTable()}
    </div>
  );

  const renderWatchAdsSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('admin.rewards.watchAds.title')}</h3>
        <button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
          <FaPlus className="w-4 h-4" />
          {t('admin.rewards.watchAds.addReward')}
        </button>
      </div>
      {renderWatchAdsTable()}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('admin.rewards.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('admin.rewards.title')}</h2>
          <p className="text-gray-400">{t('admin.rewards.description')}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
        >
          <FaRedo className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('admin.common.refresh')}
        </button>
      </div>

      {/* Reward Sections */}
      <div className="space-y-6">
        {/* Staking Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-500/20 p-6"
        >
          {renderStakingSection()}
        </motion.div>

        {/* Referrals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6"
        >
          {renderReferralsSection()}
        </motion.div>

        {/* Watch Ads Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6"
        >
          {renderWatchAdsSection()}
        </motion.div>
      </div>
    </div>
  );
};

export default RewardsTab; 