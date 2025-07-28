import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useUserPlan } from '../contexts/UserPlanContext';

interface BalanceCardProps {
  balance?: number;
  change24h?: number;
  currency?: string;
  isLoading?: boolean;
  useContextBalance?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance: propBalance,
  change24h = 0,
  currency = 'FSN',
  isLoading = false,
  useContextBalance = false
}) => {
  const { t } = useTranslation();
  const { balance: contextBalance } = useUserPlan();
  
  // Use balance from context if specified, otherwise use the prop
  const balance = useContextBalance ? contextBalance : (propBalance || 0);

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10 animate-pulse">
        <div className="flex items-center">
          <div className="p-2 md:p-3 bg-gray-600 rounded-lg w-10 h-10"></div>
          <div className="ml-3 md:ml-4 flex-1">
            <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-600 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = change24h >= 0;
  const changePercentage = Math.abs(change24h);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
            <FaWallet className="text-white text-lg md:text-xl" />
          </div>
          <div className="ml-3 md:ml-4 flex-1 min-w-0">
            <p className="text-xs md:text-sm text-gray-400 truncate">
              {t('wallet.availableBalance', 'Available Balance')}
            </p>
            <p className="text-lg md:text-2xl font-bold text-white truncate">
              {balance.toLocaleString()} {currency}
            </p>
          </div>
        </div>
        
        {change24h !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            isPositive 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isPositive ? (
              <FaArrowUp className="text-xs" />
            ) : (
              <FaArrowDown className="text-xs" />
            )}
            <span className="hidden sm:inline">{changePercentage.toFixed(2)}%</span>
            <span className="sm:hidden">{changePercentage.toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {/* Mobile-optimized hover effect */}
      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{t('wallet.lastUpdated', 'Last updated')}</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
