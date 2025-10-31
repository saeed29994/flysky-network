// 📁 EarningsTableCard.tsx
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaCoins } from 'react-icons/fa';

const EarningsTableCard = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <FaCoins className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{t('miningPage.earningsTableTitle')}</h3>
          <p className="text-sm text-gray-400">{t('miningPage.earningsTableSubtitle')}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">Economy</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">10 FSN = $0.10</div>
            <div className="text-xs text-gray-400">{t('miningPage.per12hMonthly', { monthly: '600' })}</div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">Business Class</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">50 FSN = $0.50</div>
            <div className="text-xs text-gray-400">{t('miningPage.per12hMonthly', { monthly: '3,000' })}</div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">First Class</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">100 FSN = $1.00</div>
            <div className="text-xs text-gray-400">{t('miningPage.per12hMonthly', { monthly: '6,000' })}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCoins className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">{t('miningPage.earningsAtPrice')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">{t('miningPage.expectedReturns')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EarningsTableCard;