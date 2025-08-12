// 📁 src/components/admin/TransactionsTab.tsx

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaCreditCard } from 'react-icons/fa';

const TransactionsTab = () => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Simple Message */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
        <div className="flex flex-col items-center gap-4">
          <FaCreditCard className="w-16 h-16 text-gray-400" />
          <h3 className="text-xl font-semibold text-white">
            {t('admin.transactions.noTransactions', 'No transaction data')}
          </h3>
          <p className="text-gray-400 text-center max-w-md">
            {t('admin.transactions.description', 'Transaction data will be displayed here when available.')}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionsTab; 