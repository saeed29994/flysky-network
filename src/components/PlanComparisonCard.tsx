import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGem, FaArrowUp } from 'react-icons/fa';
import { PLAN_LIMITS } from '../utils/planConstants';

interface PlanComparisonCardProps {
  userPlan: string;
  className?: string;
}

const PlanComparisonCard: React.FC<PlanComparisonCardProps> = ({ userPlan, className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
        {Object.entries(PLAN_LIMITS).map(([planName, limit]) => (
          <div key={planName} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{getPlanLabel(planName, t)}</span>
              {planName === userPlan && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">{t('planComparison.current')}</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{limit} FSN</div>
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