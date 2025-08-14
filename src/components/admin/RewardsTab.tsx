// 📁 src/components/admin/RewardsTab.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaPlus, FaLock, FaUsers, FaPlay, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { 
  fetchRewardsFromFirebase, 
  clearRewardsCache,
  type FirebaseRewards,
} from '../../utils/rewardsService';
import { db } from '../../firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<null | 'staking' | 'referrals' | 'watchAds'>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<any>({});

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

  // Modal helpers
  const openCreateModal = (section: 'staking' | 'referrals' | 'watchAds') => {
    setActiveSection(section);
    setEditingItem(null);
    if (section === 'staking') {
      setFormValues({ duration: 1, reward: 5 });
    } else if (section === 'referrals') {
      setFormValues({ name: 'Tier 1', min: 1, max: 10, reward: 100 });
    } else {
      // Enforce single record for watchAds: if exists, open edit instead of creating a new one
      if (rewards.watchAds.length > 0) {
        const first = rewards.watchAds[0];
        setEditingItem(first);
        setFormValues({ dailyLimit: first.adsCount, collectBonus: first.reward });
      } else {
        setFormValues({ dailyLimit: 5, collectBonus: 200 });
      }
    }
    setIsModalOpen(true);
  };

  const openEditModal = (section: 'staking' | 'referrals' | 'watchAds', item: any) => {
    setActiveSection(section);
    setEditingItem(item);
    if (section === 'staking') {
      setFormValues({ duration: item.duration, reward: item.reward });
    } else if (section === 'referrals') {
      setFormValues({ name: item.name || `Tier ${item.tier}`, min: item.referralRange?.min || 0, max: item.referralRange?.max || 0, reward: item.reward });
    } else {
      setFormValues({ dailyLimit: item.adsCount, collectBonus: item.reward });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveSection(null);
    setEditingItem(null);
    setFormValues({});
  };

  const handleDelete = async (section: 'staking' | 'referrals' | 'watchAds', id: string) => {
    try {
      if (section === 'watchAds') {
        // Single-config document deletion
        await deleteDoc(doc(db, 'rewards', 'watchAds'));
      } else {
        await deleteDoc(doc(db, 'rewards', section, 'items', id));
      }
      clearRewardsCache();
      await fetchRewards();
    } catch (e) {
      console.error('Error deleting reward:', e);
    }
  };

  const handleSubmit = async () => {
    if (!activeSection) return;
    try {
      let data: any = {};
      if (activeSection === 'staking') {
        data = { duration: Number(formValues.duration) || 0, durationUnit: 'months', reward: Number(formValues.reward) || 0 };
      } else if (activeSection === 'referrals') {
        const tierMatch = /([0-9]+)/.exec(String(formValues.name || ''));
        const tier = tierMatch ? Number(tierMatch[1]) : 1;
        data = { name: formValues.name, tier, referralRange: { min: Number(formValues.min) || 0, max: Number(formValues.max) || 0 }, referrals: 0, reward: Number(formValues.reward) || 0 };
      } else {
        // watchAds single-record config saved at `rewards/watchAds`
        const cfg = { dailyLimit: Number(formValues.dailyLimit) || 0, collectBonus: Number(formValues.collectBonus) || 0 };
        await setDoc(doc(db, 'rewards', 'watchAds'), cfg, { merge: true });
        clearRewardsCache();
        await fetchRewards();
        closeModal();
        return;
      }

      // For staking and referrals we still use subcollections
      if (activeSection === 'staking' || activeSection === 'referrals') {
        const colRef = collection(db, 'rewards', activeSection, 'items');
        if (editingItem?.id) {
          await updateDoc(doc(db, 'rewards', activeSection, 'items', editingItem.id), data);
        } else {
          await addDoc(colRef, data);
        }
      }

      clearRewardsCache();
      await fetchRewards();
      closeModal();
    } catch (e) {
      console.error('Error saving reward:', e);
    }
  };

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
      {sectionId !== 'watchAds' && (
        <button className={`bg-gradient-to-r ${rewardSections.find(s => s.id === sectionId)?.color} text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto`}>
          <FaPlus className="w-4 h-4" />
          {sectionId === 'staking' && t('admin.rewards.staking.addDuration')}
          {sectionId === 'referrals' && t('admin.rewards.referrals.addTier')}
        </button>
      )}
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
              <th className="px-4 py-3">% APY</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.staking.map((reward) => (
              <tr key={reward.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">
                  {reward.duration} {t(`admin.rewards.staking.units.${reward.durationUnit}`)}
                </td>
                <td className="px-4 py-3 font-medium">{reward.reward}%</td>
                
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                     <button onClick={() => openEditModal('staking', reward)} className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                     <button onClick={() => handleDelete('staking', reward.id)} className="p-1 text-red-400 hover:text-red-300 transition-colors">
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Range</th>
              <th className="px-4 py-3">Bonus</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.referrals.map((reward) => (
              <tr key={reward.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{reward.name || `Tier ${reward.tier}`}</td>
                <td className="px-4 py-3">
                  {reward.referralRange.min} - {reward.referralRange.max}
                </td>
                <td className="px-4 py-3 font-medium">{reward.reward} FSN</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal('referrals', reward)} className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('referrals', reward.id)} className="p-1 text-red-400 hover:text-red-300 transition-colors">
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
              <th className="px-4 py-3">Daily Limit</th>
              <th className="px-4 py-3">Collect Bonus</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {[rewards.watchAds[0]].filter(Boolean).map((reward) => (
              <tr key={(reward as any).id || 'watchAds'} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{(reward as any).adsCount}</td>
                <td className="px-4 py-3 font-medium">{(reward as any).reward} FSN</td>
                
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal('watchAds', reward as any)} className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    {/* Delete disabled for watchAds */}
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
        <button onClick={() => openCreateModal('staking')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
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
        <button onClick={() => openCreateModal('referrals')} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
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
        {/* Creation disabled for watchAds: view and edit only */}
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

      {/* Modal */}
      {isModalOpen && activeSection && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">
              {editingItem ? 'Edit' : 'Create'} {activeSection === 'staking' ? 'Staking' : activeSection === 'referrals' ? 'Referral' : 'Watch Ads'}
            </h3>

            {/* Form Fields */}
            <div className="space-y-4">
              {activeSection === 'staking' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Months</label>
                    <input type="number" value={formValues.duration}
                      onChange={(e) => setFormValues({ ...formValues, duration: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">% APY</label>
                    <input type="number" value={formValues.reward}
                      onChange={(e) => setFormValues({ ...formValues, reward: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                </>
              )}

              {activeSection === 'referrals' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input type="text" value={formValues.name}
                      onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Range Min</label>
                      <input type="number" value={formValues.min}
                        onChange={(e) => setFormValues({ ...formValues, min: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Range Max</label>
                      <input type="number" value={formValues.max}
                        onChange={(e) => setFormValues({ ...formValues, max: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Bonus (FSN)</label>
                    <input type="number" value={formValues.reward}
                      onChange={(e) => setFormValues({ ...formValues, reward: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                </>
              )}

              {activeSection === 'watchAds' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Daily Limit</label>
                    <input type="number" value={formValues.dailyLimit}
                      onChange={(e) => setFormValues({ ...formValues, dailyLimit: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Collect Bonus (FSN)</label>
                    <input type="number" value={formValues.collectBonus}
                      onChange={(e) => setFormValues({ ...formValues, collectBonus: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                </>
              )}

              {/* Status control removed for staking and watchAds */}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsTab; 