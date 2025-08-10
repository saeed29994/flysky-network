// 📁 src/components/admin/MembershipsTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import {
  FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaSpinner, FaEye
} from 'react-icons/fa';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
  createdAt?: any;
}

const formatTimestamp = (ts: any): string => {
  if (!ts) return '-';
  try {
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString();
    }
    if (typeof ts.seconds === 'number') {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    if (typeof ts === 'number') {
      return new Date(ts).toLocaleString();
    }
  } catch (_) {
    // ignore
  }
  return '-';
};

const MembershipsTab = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<MembershipPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<MembershipPlan>>({
    id: '',
    name: '',
    price: 0,
    durationDays: 30,
    features: []
  });
  const [newFeature, setNewFeature] = useState<string>('');
  const [editFeature, setEditFeature] = useState<string>('');

  // Fetch plans from Firebase
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching plans from Firebase...');
        const plansRef = collection(db, 'plans');
        const snapshot = await getDocs(plansRef);
        
        console.log('📊 Firebase response:', snapshot.size, 'plans found');
        
        if (!snapshot.empty) {
          const plansData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MembershipPlan[];
          console.log('✅ Plans loaded from Firebase:', plansData);
          setPlans(plansData);
        }
      } catch (error) {
        console.error('❌ Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  console.log('🔍 Plans:', plans);

  const displayPlans = plans;

  const handleCreatePlan = async () => {
    if (!newPlan.id || !newPlan.name || newPlan.price === undefined || newPlan.durationDays === undefined) {
      alert(t('admin.memberships.fillRequiredFields'));
      return;
    }

    try {
      setSaving(true);
      const planId = String(newPlan.id).trim();
      const planData = {
        name: String(newPlan.name).trim(),
        price: Number(newPlan.price),
        durationDays: Number(newPlan.durationDays),
        features: Array.isArray(newPlan.features) ? newPlan.features : [],
        createdAt: serverTimestamp()
      };

      const planRef = doc(db, 'plans', planId);
      await setDoc(planRef, planData);

      // Fetch fresh doc to resolve serverTimestamp()
      let createdAtResolved: any = undefined;
      try {
        const freshSnap = await getDoc(planRef);
        createdAtResolved = freshSnap.exists() ? (freshSnap.data() as any).createdAt : undefined;
      } catch (e) {
        // fallback to client time if server timestamp not immediately available
        createdAtResolved = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
       
      const newPlanWithId = { ...planData, id: planId, createdAt: createdAtResolved } as MembershipPlan;
      setPlans(prev => [...prev, newPlanWithId]);
      
      setShowCreateModal(false);
      setNewPlan({
        id: '',
        name: '',
        price: 0,
        durationDays: 30,
        features: []
      });
      setNewFeature('');
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
      const planRef = doc(db, 'plans', planId);
      const { id: _omitId, createdAt: _omitCreatedAt, ...allowed } = updates as any;
      await updateDoc(planRef, allowed);
      
      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, ...allowed } : plan
      ));
      setEditingPlan(null);
      setEditFeature('');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert(t('admin.memberships.updatePlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      setSaving(true);
      const planRef = doc(db, 'plans', planId);
      await deleteDoc(planRef);
      
      setPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert(t('admin.memberships.deletePlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addNewFeature = () => {
    const value = newFeature.trim();
    if (!value) return;
    setNewPlan(prev => ({ ...prev, features: [ ...(prev.features || []), value ] }));
    setNewFeature('');
  };

  const removeNewFeature = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const addEditFeature = () => {
    const value = editFeature.trim();
    if (!value || !editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [ ...(editingPlan.features || []), value ] });
    setEditFeature('');
  };

  const removeEditFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: (editingPlan.features || []).filter((_, i) => i !== index) });
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
          {t(['admin.memberships.createPlan', 'admin.memberships.create', 'common.create'] as any)}
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayPlans?.map((plan, index) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{t('admin.memberships.duration')}: {plan.durationDays} {t('admin.memberships.days')}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${plan.price}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features?.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{t('admin.memberships.duration')}</p>
                <p className="text-white font-bold">{plan.durationDays} {t('admin.memberships.days')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{t('admin.memberships.createdAt')}</p>
                <p className="text-white font-bold">{formatTimestamp(plan.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowViewModal(plan)}
                className="flex-1 h-10 bg-gray-500 hover:bg-gray-600 text-white px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEye className="w-3 h-3" />
                {t(['admin.memberships.view', 'common.view'] as any)}
              </button>
              <button
                onClick={() => setEditingPlan(plan)}
                className="flex-1 h-10 bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEdit className="w-3 h-3" />
                {t(['admin.memberships.edit', 'common.edit'] as any)}
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={saving}
                    className="h-10 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 text-white sm:rounded-2xl max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">{t('admin.memberships.delete')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      {t('admin.memberships.confirmDelete')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={saving} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                      {t('common.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeletePlan(plan.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={saving}
                    >
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.planId')}</label>
                <input
                  type="text"
                  placeholder={t('admin.memberships.planId')}
                  value={newPlan.id}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.planName')}</label>
                <input
                  type="text"
                  placeholder={t('admin.memberships.planName')}
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.price')}</label>
                <input
                  type="number"
                  placeholder={t('admin.memberships.price')}
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.durationDays')}</label>
                <input
                  type="number"
                  placeholder={t('admin.memberships.durationDays')}
                  value={newPlan.durationDays}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.features')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('admin.memberships.featurePlaceholder')}
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addNewFeature}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <FaPlus className="w-3 h-3" />
                    {t('admin.memberships.addFeature')}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">{t('admin.memberships.featuresHelper')}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(newPlan.features || []).map((feat, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs px-3 py-1.5 rounded-full">
                      {feat}
                      <button type="button" onClick={() => removeNewFeature(idx)} className="text-red-300 hover:text-red-400">
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
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
              {t('admin.memberships.planDetails')}: {showViewModal.name}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.memberships.basicInformation')}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">{t('admin.memberships.name')}:</span> <span className="text-white">{showViewModal.name}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.price')}:</span> <span className="text-white">${showViewModal.price}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.duration')}:</span> <span className="text-white">{showViewModal.durationDays} {t('admin.memberships.days')}</span></p>
                  <p><span className="text-gray-400">{t('admin.memberships.createdAt')}:</span> <span className="text-white">{formatTimestamp(showViewModal.createdAt)}</span></p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{t('admin.memberships.features')}</h4>
                <div className="space-y-1">
                  {showViewModal?.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
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
              {t('admin.memberships.editPlan')}: {editingPlan.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.planName')}</label>
                <input
                  type="text"
                  placeholder={t('admin.memberships.planName')}
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.price')}</label>
                <input
                  type="number"
                  placeholder={t('admin.memberships.price')}
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.durationDays')}</label>
                <input
                  type="number"
                  placeholder={t('admin.memberships.durationDays')}
                  value={editingPlan.durationDays}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, durationDays: Number(e.target.value) } : null)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('admin.memberships.features')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('admin.memberships.featurePlaceholder')}
                    value={editFeature}
                    onChange={(e) => setEditFeature(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addEditFeature}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <FaPlus className="w-3 h-3" />
                    {t('admin.memberships.addFeature')}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">{t('admin.memberships.featuresHelper')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {editingPlan.features?.map((feat, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs px-3 py-1.5 rounded-full">
                      {feat}
                      <button type="button" onClick={() => removeEditFeature(idx)} className="text-red-300 hover:text-red-400">
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (editingPlan) {
                      const { id, createdAt, ...payload } = editingPlan;
                      handleUpdatePlan(id, payload);
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
