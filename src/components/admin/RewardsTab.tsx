// 📁 src/components/admin/RewardsTab.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaPlus, FaLock, FaUsers, FaPlay, FaEdit, FaTrash, FaRedo, FaGift } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import {
  fetchRewardsFromFirebase,
  clearRewardsCache,
  type FirebaseRewards,
} from '../../utils/rewardsService';
import { db } from '../../firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, setDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { GiftsTab } from './Gifts';
import CustomSelect from '../ui/CustomSelect';

const RewardsTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // State for rewards data (referrals, watchAds via rewardsService; staking handled separately per-plan)
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
  const [activeSection, setActiveSection] = useState<null | 'staking' | 'referrals' | 'watchAds' | 'gifts'>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<any>({});

  // Active tab for rewards section
  const [activeTab, setActiveTab] = useState<'rewards' | 'gifts'>('rewards');

  // Plans and staking APY config (per-plan)
  type MembershipPlanLite = { id: string; name: string };
  type StakingPlanApy = { months: number; apy: number };
  const [plans, setPlans] = useState<MembershipPlanLite[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [stakingPlansMap, setStakingPlansMap] = useState<Record<string, StakingPlanApy[]>>({});

  const selectedPlanDurations = useMemo<StakingPlanApy[]>(() => {
    return stakingPlansMap[selectedPlan] || [];
  }, [stakingPlansMap, selectedPlan]);

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
      count: selectedPlanDurations.length
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
    },
    {
      id: 'gifts',
      title: t('rewardmang.GiftManagement'),
      description: t('rewardmang.GiftDescription'),
      icon: FaGift,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      iconColor: 'text-pink-500',
      count: 0 // Will be updated with actual count
    }
  ];

  // Fetch rewards data (excluding staking per-plan which we fetch separately)
  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const rewardsData = await fetchRewardsFromFirebase();
      setRewards({ ...rewardsData, staking: [] });
      // console.log('Rewards data loaded:', rewardsData);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch plans from Firebase
  const fetchPlans = async () => {
    try {
      const snap = await getDocs(collection(db, 'plans'));
      const data = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name || d.id })) as MembershipPlanLite[];
      // Sort by name for consistency
      data.sort((a, b) => a.name.localeCompare(b.name));
      setPlans(data);
      if (!selectedPlan && data.length > 0) {
        const defaultPlan = data.find(p => p.id === 'economy')?.id || data[0].id;
        setSelectedPlan(defaultPlan);
      }
    } catch (e) {
      console.error('Error fetching plans:', e);
    }
  };

  // Fetch staking APY config (plan-specific) from rewards/staking
  const fetchStakingPlans = async () => {
    try {
      const cfgRef = doc(db, 'rewards', 'staking');
      const snap = await getDoc(cfgRef);
      if (snap.exists()) {
        const data: any = snap.data();
        const plansMap: Record<string, StakingPlanApy[]> = {};
        const rawPlans = data?.plans || {};
        Object.keys(rawPlans).forEach((pid) => {
          const arr = Array.isArray(rawPlans[pid]) ? rawPlans[pid] : [];
          plansMap[pid] = arr
            .map((d: any) => ({
              months: Number(d.months || d.duration) || 0,
              apy: typeof d.apy === 'number' ? (d.apy > 1 ? d.apy / 100 : d.apy) : 0,
            }))
            .filter((d: StakingPlanApy) => d.months > 0)
            .sort((a: StakingPlanApy, b: StakingPlanApy) => a.months - b.months);
        });
        setStakingPlansMap(plansMap);
      } else {
        setStakingPlansMap({});
      }
    } catch (e) {
      console.error('Error fetching staking plans config:', e);
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
    fetchPlans();
    fetchStakingPlans();
  }, []);

  // Modal helpers
  const openCreateModal = (section: 'staking' | 'referrals' | 'watchAds' | 'gifts') => {
    if (section === 'gifts') {
      setActiveTab('gifts');
      return;
    }
    setActiveSection(section);
    setEditingItem(null);
    if (section === 'staking') {
      setFormValues({ months: 1, apy: 5 });
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

  const openEditModal = (section: 'staking' | 'referrals' | 'watchAds' | 'gifts', item: any) => {
    if (section === 'gifts') {
      setActiveTab('gifts');
      return;
    }
    setActiveSection(section);
    setEditingItem(item);
    if (section === 'staking') {
      // For staking, item is a StakingPlanApy with months and apy (decimal)
      setFormValues({ months: item.months, apy: (item.apy > 1 ? item.apy : item.apy * 100) });
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

  const handleDelete = async (section: 'staking' | 'referrals' | 'watchAds' | 'gifts', id: string) => {
    if (section === 'gifts') {
      setActiveTab('gifts');
      return;
    }
    try {
      if (section === 'watchAds') {
        // Single-config document deletion
        await deleteDoc(doc(db, 'rewards', 'watchAds'));
      } else if (section === 'referrals') {
        await deleteDoc(doc(db, 'rewards', section, 'items', id));
      } else if (section === 'staking') {
        // For staking, id is the months value as string
        const monthsToDelete = Number(id);
        const cfgRef = doc(db, 'rewards', 'staking');
        const snap = await getDoc(cfgRef);
        let nextMap: Record<string, StakingPlanApy[]> = { ...stakingPlansMap };
        const current = nextMap[selectedPlan] || [];
        nextMap[selectedPlan] = current.filter((d) => d.months !== monthsToDelete);
        // Persist
        const payloadPlans: any = {};
        Object.keys(nextMap).forEach((pid) => {
          payloadPlans[pid] = (nextMap[pid] || []).map((d) => ({ months: d.months, apy: d.apy }));
        });
        const baseData = snap.exists() ? snap.data() : {};
        await setDoc(cfgRef, { ...baseData, plans: payloadPlans, updatedAt: serverTimestamp() }, { merge: true });
        setStakingPlansMap(nextMap);
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
        const months = Number(formValues.months) || 0;
        const apyPercent = Number(formValues.apy) || 0; // entered as percent
        const apyDecimal = apyPercent > 1 ? apyPercent / 100 : apyPercent;
        if (!selectedPlan) {
          throw new Error('No plan selected');
        }
        // Update local map
        const nextMap: Record<string, StakingPlanApy[]> = { ...stakingPlansMap };
        const list = [...(nextMap[selectedPlan] || [])];
        const idx = list.findIndex((d) => d.months === months);
        if (idx >= 0) {
          list[idx] = { months, apy: apyDecimal };
        } else {
          list.push({ months, apy: apyDecimal });
        }
        nextMap[selectedPlan] = list.sort((a, b) => a.months - b.months);
        // Persist to Firestore under rewards/staking.plans[plan]
        const cfgRef = doc(db, 'rewards', 'staking');
        const snap = await getDoc(cfgRef);
        const baseData = snap.exists() ? snap.data() : {};
        const payloadPlans: any = baseData?.plans ? { ...baseData.plans } : {};
        payloadPlans[selectedPlan] = nextMap[selectedPlan].map((d) => ({ months: d.months, apy: d.apy }));
        await setDoc(cfgRef, { ...baseData, plans: payloadPlans, updatedAt: serverTimestamp() }, { merge: true });
        setStakingPlansMap(nextMap);
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

      // For referrals we still use subcollections
      if (activeSection === 'referrals') {
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
    if (!selectedPlan || selectedPlanDurations.length === 0) {
      return renderEmptyState('staking');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-white/5">
            <tr>
              <th className="px-4 py-3">{t('admin.rewards.staking.duration')}</th>
              <th className="px-4 py-3">% {t('admin.rewards.staking.apy')}</th>
              <th className="px-4 py-3">{t('admin.rewards.actions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {selectedPlanDurations.map((entry) => (
              <tr key={`${selectedPlan}-${entry.months}`} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">{entry.months} {entry.months === 1 ? t('admin.rewards.staking.units.months') : t('admin.rewards.staking.units.months')}</td>
                <td className="px-4 py-3 font-medium">{(entry.apy * 100).toFixed(2)}%</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal('staking', entry)} className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('staking', String(entry.months))} className="p-1 text-red-400 hover:text-red-300 transition-colors">
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
              <th className="px-4 py-3">{t('admin.rewards.referrals.name')}</th>
              <th className="px-4 py-3">{t('admin.rewards.referrals.range')}</th>
              <th className="px-4 py-3">{t('admin.rewards.referrals.bonus')}</th>
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
           <thead className="text-xs text-gray-300 uppercase bg-white/5">
            <tr>
              <th className="px-4 py-3">{t('admin.rewards.watchAds.dailyLimit')}</th>
              <th className="px-4 py-3">{t('admin.rewards.watchAds.collectBonus')}</th>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{t('admin.rewards.staking.title')}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">{t('admin.rewards.staking.plan')}</label>
            <CustomSelect
              value={selectedPlan}
              onChange={setSelectedPlan}
              options={plans.map((p) => ({ value: p.id, label: p.name }))}
              placeholder={t('admin.rewards.staking.selectPlan')}
            />
          </div>
          <button onClick={() => openCreateModal('staking')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
            <FaPlus className="w-4 h-4" />
            {t('admin.rewards.staking.addDuration')}
          </button>
        </div>
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

      {/* Tab Navigation - Converted to Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 p-6 text-left ${
            activeTab === 'rewards'
              ? 'border-blue-500 bg-blue-500/20 shadow-2xl ring-2 ring-blue-500/50'
              : 'border-white/20 hover:border-white/30 hover:bg-white/15'
          }`}
        >
          <div className={`flex items-center gap-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-xl ${
              activeTab === 'rewards'
                ? 'bg-blue-500/30'
                : 'bg-gray-600/50'
            }`}>
              <FaCoins className={`w-8 h-8 ${
                activeTab === 'rewards' ? 'text-blue-300' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                activeTab === 'rewards' ? 'text-white' : 'text-gray-300'
              } ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                {t('rewardmang.RewardsManagement')}
              </h3>
              <p className={`text-sm ${
                activeTab === 'rewards' ? 'text-blue-200' : 'text-gray-400'
              } ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                {t('rewardmang.rewardsDescription')}
              </p>
            </div>
          </div>
          {activeTab === 'rewards' && (
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gifts')}
          className={`relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 p-6 text-left ${
            activeTab === 'gifts'
              ? 'border-pink-500 bg-pink-500/20 shadow-2xl ring-2 ring-pink-500/50'
              : 'border-white/20 hover:border-white/30 hover:bg-white/15'
          }`}
        >
          <div className={`flex items-center gap-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-xl ${
              activeTab === 'gifts'
                ? 'bg-pink-500/30'
                : 'bg-gray-600/50'
            }`}>
              <FaGift className={`w-8 h-8 ${
                activeTab === 'gifts' ? 'text-pink-300' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                activeTab === 'gifts' ? 'text-white' : 'text-gray-300'
              } ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                {t('rewardmang.GiftManagement')}
              </h3>
              <p className={`text-sm ${
                activeTab === 'gifts' ? 'text-pink-200' : 'text-gray-400'
              } ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                {t('rewardmang.GiftDescription')}
              </p>
            </div>
          </div>
          {activeTab === 'gifts' && (
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rewards' ? (
        <div className="space-y-6">
          {/* Reward Sections */}
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
      ) : (
        <GiftsTab />
      )}

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
                    <input type="number" value={formValues.months}
                      onChange={(e) => setFormValues({ ...formValues, months: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">% APY</label>
                    <input type="number" value={formValues.apy}
                      onChange={(e) => setFormValues({ ...formValues, apy: e.target.value })}
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