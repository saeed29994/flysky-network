// 📁 StakingCard.tsx
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaCoins, FaLock, FaChartLine } from 'react-icons/fa';
import { getPlanConfig } from '../utils/planConstants';

interface StakingCardProps {
  plan: 'economy' | 'business' | 'first-6' | 'first-lifetime';
  lockedAmount: number;
}

const StakingCard = ({ plan, lockedAmount }: StakingCardProps) => {
  const { t } = useTranslation();
  const planConfig = getPlanConfig(t);
  const currentPlan = planConfig[plan] || planConfig.economy;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-r ${currentPlan.color} rounded-xl flex items-center justify-center shadow-lg`}>
            <FaCoins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t('stakingCard.title')}</h2>
            <p className="text-sm text-gray-400">{currentPlan.name}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl">{currentPlan.icon}</span>
        </div>
      </div>

      {/* Locked Amount Display */}
      <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 mb-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaLock className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-gray-400 font-medium">Locked Amount</span>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {lockedAmount.toLocaleString()}
            </div>
            <div className="text-sm text-amber-400 font-semibold">FSN</div>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
          <span className="text-gray-300">Passive income generation</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
          <span className="text-gray-300">Flexible staking periods</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"></div>
          <span className="text-gray-300">High APY returns</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaChartLine className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Active</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StakingCard;
