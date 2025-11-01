import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGem, FaArrowUp, FaSpinner } from 'react-icons/fa';
import { fetchPlansFromFirebase, FirebasePlan } from '../utils/plansService';

interface PlanComparisonCardProps {
  userPlan: string;
  className?: string;
}

const PlanComparisonCard: React.FC<PlanComparisonCardProps> = ({ userPlan, className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plansData, setPlansData] = useState<Record<string, FirebasePlan>>({});
  const [loading, setLoading] = useState(true);

  // Fetch plans data from Firebase
  useEffect(() => {
    const loadPlansData = async () => {
      try {
        setLoading(true);
        const plans = await fetchPlansFromFirebase();
        setPlansData(plans);
      } catch (error) {
        console.error('Error loading plans data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlansData();
  }, []);

  const getPlanLabel = (plan: string, t: any) => {
    switch (plan) {
      case 'business': return t('plans.business');
      case 'first-6': return t('first6');
      case 'first-lifetime': return t('firstLifetime');
      default: return t('plans.economy');
    }
  };

  // Check if user can upgrade (not on First Class plans)
  const canUpgrade = !userPlan.includes('first');

  const handleUpgrade = () => {
    navigate('/membership');
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="ml-3 text-gray-400">{t('common.loading')}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <FaGem className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{t('planComparison.title')}</h3>
          <p className="text-sm text-gray-400">{t('planComparison.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(plansData)
          .sort(([, planA], [, planB]) => (planA.price || 0) - (planB.price || 0)) // Sort by price ascending to descending
          .map(([planId, plan]) => (
          <div key={planId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{plan.name || getPlanLabel(planId, t)}</span>
              {planId === userPlan && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">{t('planComparison.current')}</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{plan.dailyMiningReward || 0} FSN</div>
              <div className="text-xs text-gray-400">{t('planComparison.perDay')}</div>
            </div>
          </div>
        ))}
      </div>

      {canUpgrade && (
        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaArrowUp className="inline mr-2" />
          {t('planComparison.upgradePlan')}
        </button>
      )}
    </motion.div>
  );
};

export default PlanComparisonCard; 