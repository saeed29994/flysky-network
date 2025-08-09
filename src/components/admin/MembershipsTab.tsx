// 📁 src/components/admin/MembershipsTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import {
  FaCrown, FaStar, FaGem, FaCoins, FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaLock, FaUnlock, FaSpinner, FaEye
} from 'react-icons/fa';

interface MembershipPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
  userCount: number;
  revenue: number;
  color: string;
  icon: string;
  maxUsers?: number;
  discount?: number;
  popular?: boolean;
  description?: string;
  bonus?: number;
  miningRate?: string;
  createdAt?: number;
  updatedAt?: number;
}

const MembershipsTab = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<MembershipPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<MembershipPlan>>({
    name: '',
    displayName: '',
    price: 0,
    duration: 'monthly',
    features: [],
    isActive: true,
    color: 'from-green-500 to-emerald-500',
    icon: 'FaCoins',
    description: '',
    bonus: 0,
    miningRate: '600 FSN / 12 hours'
  });

  // Fetch plans from Firebase
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching plans from Firebase...');
        const plansRef = collection(db, 'membershipPlans');
        const snapshot = await getDocs(plansRef);
        
        console.log('📊 Firebase response:', snapshot.size, 'plans found');
        
        if (snapshot.empty) {
          console.log('📝 No plans found, creating default plans...');
          // Create default plans if none exist
          await createDefaultPlans();
        } else {
          const plansData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MembershipPlan[];
          console.log('✅ Plans loaded from Firebase:', plansData);
          setPlans(plansData);
        }
      } catch (error) {
        console.error('❌ Error fetching plans:', error);
        // Fallback to mock data if Firebase fails
        console.log('🔄 Falling back to mock data...');
        setPlans(getDefaultPlans());
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getDefaultPlans = (): MembershipPlan[] => [
    {
      id: 'economy',
      name: 'economy',
      displayName: t('admin.memberships.defaultPlans.economy.name'),
      price: 0,
      duration: 'lifetime',
      features: ['Basic mining', 'Standard support', 'Community access'],
      isActive: true,
      userCount: 1250,
      revenue: 0,
      color: 'from-green-500 to-emerald-500',
      icon: 'FaCoins',
      description: t('admin.memberships.defaultPlans.economy.description'),
      bonus: 0,
      miningRate: '600 FSN / 12 hours'
    },
    {
      id: 'business',
      name: 'business',
      displayName: t('admin.memberships.defaultPlans.business.name'),
      price: 99,
      duration: 'monthly',
      features: ['Advanced mining', 'Priority support', 'Business tools', 'Analytics'],
      isActive: true,
      userCount: 450,
      revenue: 44550,
      color: 'from-purple-500 to-pink-500',
      icon: 'FaGem',
      maxUsers: 1000,
      description: t('admin.memberships.defaultPlans.business.description'),
      bonus: 100000,
      miningRate: '3000 FSN / 12 hours'
    },
    {
      id: 'first-6',
      name: 'first-6',
      displayName: t('admin.memberships.defaultPlans.first6.name'),
      price: 299,
      duration: '6months',
      features: ['Premium mining', 'VIP support', 'Exclusive features', 'Early access'],
      isActive: true,
      userCount: 180,
      revenue: 53820,
      color: 'from-blue-500 to-cyan-500',
      icon: 'FaStar',
      discount: 15,
      popular: true,
      description: t('admin.memberships.defaultPlans.first6.description'),
      bonus: 500000,
      miningRate: '6000 FSN / 12 hours'
    },
    {
      id: 'first-lifetime',
      name: 'first-lifetime',
      displayName: t('admin.memberships.defaultPlans.firstLifetime.name'),
      price: 999,
      duration: 'lifetime',
      features: ['Ultimate mining', '24/7 support', 'All features', 'Lifetime access'],
      isActive: true,
      userCount: 75,
      revenue: 74925,
      color: 'from-yellow-500 to-orange-500',
      icon: 'FaCrown',
      discount: 25,
      description: t('admin.memberships.defaultPlans.firstLifetime.description'),
      bonus: 1000000,
      miningRate: '6000 FSN / 12 hours'
    }
  ];

  const createDefaultPlans = async () => {
    try {
      const defaultPlans = getDefaultPlans();
      const plansRef = collection(db, 'membershipPlans');
      
      for (const plan of defaultPlans) {
        await addDoc(plansRef, {
          ...plan,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      
      setPlans(defaultPlans);
    } catch (error) {
      console.error('Error creating default plans:', error);
      setPlans(getDefaultPlans());
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FaCrown': return <FaCrown className="w-5 h-5" />;
      case 'FaStar': return <FaStar className="w-5 h-5" />;
      case 'FaGem': return <FaGem className="w-5 h-5" />;
      default: return <FaCoins className="w-5 h-5" />;
    }
  };

  // Fallback to mock data if plans array is empty
  const displayPlans = plans.length > 0 ? plans : getDefaultPlans();


  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.displayName || newPlan.price === undefined) {
      alert(t('admin.memberships.fillRequiredFields'));
      return;
    }

    try {
      setSaving(true);
      const planData = {
        ...newPlan,
        userCount: 0,
        revenue: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const plansRef = collection(db, 'membershipPlans');
      const docRef = await addDoc(plansRef, planData);
      
      const newPlanWithId = { ...planData, id: docRef.id } as MembershipPlan;
      setPlans(prev => [...prev, newPlanWithId]);
      
      setShowCreateModal(false);
      setNewPlan({
        name: '',
        displayName: '',
        price: 0,
        duration: 'monthly',
        features: [],
        isActive: true,
        color: 'from-green-500 to-emerald-500',
        icon: 'FaCoins',
        description: '',
        bonus: 0,
        miningRate: '600 FSN / 12 hours'
      });
    } catch (error) {
      console.error('Error creating plan:', error);
      alert(t('admin.memberships.createPlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlan = async (planId: string, updates: Partial<MembershipPlan>) => {
    try {
      setSaving(true);
      const planRef = doc(db, 'membershipPlans', planId);
      await updateDoc(planRef, {
        ...updates,
        updatedAt: Date.now()
      });
      
      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      ));
      setEditingPlan(null);
    } catch (error) {
      console.error('Error updating plan:', error);
      alert(t('admin.memberships.updatePlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(t('admin.memberships.confirmDelete'))) {
      return;
    }

    try {
      setSaving(true);
      const planRef = doc(db, 'membershipPlans', planId);
      await deleteDoc(planRef);
      
      setPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert(t('admin.memberships.deletePlanFailed'));
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('admin.memberships.loadingPlans')}</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering MembershipsTab with', plans.length, 'plans:', plans);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Create Plan Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaPlus className="w-4 h-4" />}
          {t('admin.memberships.createPlan')}
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayPlans.map((plan, index) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl relative ${
              plan.popular ? 'ring-2 ring-yellow-500/50' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  {t('admin.memberships.mostPopular')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center`}>
                  {getIconComponent(plan.icon)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.displayName}</h3>
                  <p className="text-gray-400 text-sm capitalize">{plan.duration}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  ${plan.price}
                  {plan.duration !== 'lifetime' && <span className="text-sm text-gray-400">/{plan.duration}</span>}
                </p>
                {plan.discount && (
                  <p className="text-green-400 text-sm font-medium">{plan.discount}% OFF</p>
                )}
              </div>
            </div>

            {plan.description && (
              <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
            )}

            <div className="space-y-3 mb-6">
              {plan.features?.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <FaCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{t('admin.memberships.subscribers')}</p>
                <p className="text-white font-bold">{plan.userCount.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{t('admin.memberships.revenue')}</p>
                <p className="text-white font-bold">${plan.revenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowViewModal(plan)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEye className="w-3 h-3" />
                {t('admin.memberships.view')}
              </button>
              <button
                onClick={() => setEditingPlan(plan)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEdit className="w-3 h-3" />
                {t('admin.memberships.edit')}
              </button>
              <button
                onClick={() => handleUpdatePlan(plan.id, { isActive: !plan.isActive })}
                disabled={saving}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                  plan.isActive 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } ${saving ? 'opacity-50' : ''}`}
              >
                {plan.isActive ? <FaLock className="w-3 h-3" /> : <FaUnlock className="w-3 h-3" />}
                {plan.isActive ? t('admin.memberships.disable') : t('admin.memberships.enable')}
              </button>
              <button
                onClick={() => handleDeletePlan(plan.id)}
                disabled={saving}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaPlus className="w-4 h-4 text-blue-400" />
              {t('admin.memberships.createNewPlan')}
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('admin.memberships.planName')}
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="text"
                placeholder={t('admin.memberships.displayName')}
                value={newPlan.displayName}
                onChange={(e) => setNewPlan(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder={t('admin.memberships.description')}
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <input
                type="number"
                placeholder={t('admin.memberships.price')}
                value={newPlan.price}
                onChange={(e) => setNewPlan(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="number"
                placeholder={t('admin.memberships.bonusFSN')}
                value={newPlan.bonus}
                onChange={(e) => setNewPlan(prev => ({ ...prev, bonus: Number(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="text"
                placeholder={t('admin.memberships.miningRate')}
                value={newPlan.miningRate}
                onChange={(e) => setNewPlan(prev => ({ ...prev, miningRate: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                value={newPlan.duration}
                onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">{t('admin.memberships.monthly')}</option>
                <option value="yearly">{t('admin.memberships.yearly')}</option>
                <option value="6months">{t('admin.memberships.6months')}</option>
                <option value="lifetime">{t('admin.memberships.lifetime')}</option>
              </select>
              
              <select
                value={newPlan.icon}
                onChange={(e) => setNewPlan(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FaCoins">{t('admin.memberships.coins')}</option>
                <option value="FaGem">{t('admin.memberships.gem')}</option>
                <option value="FaStar">{t('admin.memberships.star')}</option>
                <option value="FaCrown">{t('admin.memberships.crown')}</option>
              </select>
              
              <select
                value={newPlan.color}
                onChange={(e) => setNewPlan(prev => ({ ...prev, color: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="from-green-500 to-emerald-500">{t('admin.memberships.green')}</option>
                <option value="from-purple-500 to-pink-500">{t('admin.memberships.purple')}</option>
                <option value="from-blue-500 to-cyan-500">{t('admin.memberships.blue')}</option>
                <option value="from-yellow-500 to-orange-500">{t('admin.memberships.yellow')}</option>
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePlan}
                  disabled={saving}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheck className="w-4 h-4" />}
                  {t('admin.memberships.create')}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  {t('admin.memberships.cancel')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* View Plan Modal */}
      {showViewModal && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaEye className="w-4 h-4 text-blue-400" />
              {t('admin.memberships.planDetails')}: {showViewModal.displayName}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.memberships.basicInformation')}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">{t('admin.memberships.name')}:</span> <span className="text-white">{showViewModal.name}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.displayName')}:</span> <span className="text-white">{showViewModal.displayName}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.price')}:</span> <span className="text-white">${showViewModal.price}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.duration')}:</span> <span className="text-white capitalize">{showViewModal.duration}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.status')}:</span> <span className={`${showViewModal.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {showViewModal.isActive ? t('admin.memberships.active') : t('admin.memberships.inactive')}
                  </span></p>
                </div>
              </div>
              
              {showViewModal.description && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">{t('admin.memberships.description')}</h4>
                  <p className="text-gray-300 text-sm">{showViewModal.description}</p>
                </div>
              )}
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.memberships.features')}</h4>
                <div className="space-y-1">
                  {showViewModal?.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FaCheck className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.memberships.statistics')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">{t('admin.memberships.subscribers')}</p>
                    <p className="text-white font-bold">{showViewModal.userCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t('admin.memberships.revenue')}</p>
                    <p className="text-white font-bold">${showViewModal.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowViewModal(null)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                {t('admin.memberships.close')}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaEdit className="w-4 h-4 text-blue-400" />
              {t('admin.memberships.editPlan')}: {editingPlan.displayName}
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('admin.memberships.displayName')}
                value={editingPlan.displayName}
                onChange={(e) => setEditingPlan(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder={t('admin.memberships.description')}
                value={editingPlan.description || ''}
                onChange={(e) => setEditingPlan(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <input
                type="number"
                placeholder={t('admin.memberships.price')}
                value={editingPlan.price}
                onChange={(e) => setEditingPlan(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="number"
                placeholder={t('admin.memberships.bonusFSN')}
                value={editingPlan.bonus || 0}
                onChange={(e) => setEditingPlan(prev => prev ? { ...prev, bonus: Number(e.target.value) } : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="text"
                placeholder={t('admin.memberships.miningRate')}
                value={editingPlan.miningRate || ''}
                onChange={(e) => setEditingPlan(prev => prev ? { ...prev, miningRate: e.target.value } : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (editingPlan) {
                      handleUpdatePlan(editingPlan.id, editingPlan);
                    }
                  }}
                  disabled={saving}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheck className="w-4 h-4" />}
                  {t('admin.memberships.update')}
                </button>
                <button
                  onClick={() => setEditingPlan(null)}
                  disabled={saving}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  {t('admin.memberships.cancel')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MembershipsTab; 