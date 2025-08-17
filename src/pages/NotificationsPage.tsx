import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Gift, 
  Clock, 
  CheckCircle, 
  Filter, 
  ArrowLeft,
  ArrowRight,
  Info,
  MessageSquare,
  User
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type NotificationType = 'claim_reward' | 'inbox_message' | 'referral_bonus' | 'mining_reminder' | 'staking_reminder';

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const { 
    notifications, 
    loading
  } = useNotifications();

  // Format timestamp
  const formatTime = (date: any) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date instanceof Date ? date : new Date(date));
  };

  // Get filtered and paginated notifications (use title search or type if present)
  const filteredNotifications = notifications;
  
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Get the icon and color for filter buttons
  const getFilterIconAndColor = (type: NotificationType | 'all') => {
    switch (type) {
      case 'claim_reward':
        return { icon: <Gift className="w-4 h-4" />, color: 'from-yellow-500 to-amber-600' };
      case 'inbox_message':
        return { icon: <MessageSquare className="w-4 h-4" />, color: 'from-blue-500 to-indigo-600' };
      case 'referral_bonus':
        return { icon: <User className="w-4 h-4" />, color: 'from-green-500 to-emerald-600' };
      case 'mining_reminder':
        return { icon: <Clock className="w-4 h-4" />, color: 'from-purple-500 to-violet-600' };
      case 'staking_reminder':
        return { icon: <Clock className="w-4 h-4" />, color: 'from-pink-500 to-rose-600' };
      default:
        return { icon: <Bell className="w-4 h-4" />, color: 'from-blue-500 to-purple-600' };
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl shadow-lg">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{t('mainNotifications.title')}</h1>
                  <p className="text-gray-300">
                    {notifications.length} {t('mainNotifications.unreadNotifications')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('mainNotifications.viewAll')}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <div className="flex items-center gap-2 text-gray-300 shrink-0">
                <Filter className="w-4 h-4" />
                <span>{t('mainNotifications.filter')}:</span>
              </div>
              
              <button
                onClick={() => {
                  setFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                } transition-all duration-200`}
              >
                <Bell className="w-4 h-4" />
                {t('mainNotifications.all')}
              </button>
              
              {(['claim_reward', 'inbox_message', 'referral_bonus', 'mining_reminder', 'staking_reminder'] as const).map((type) => {
                const { icon, color } = getFilterIconAndColor(type);
                const getTranslationKey = (notificationType: NotificationType) => {
                  switch(notificationType) {
                    case 'claim_reward': return 'mainNotifications.rewards';
                    case 'inbox_message': return 'mainNotifications.messages';
                    case 'referral_bonus': return 'mainNotifications.referrals';
                    case 'mining_reminder': return 'mainNotifications.mining';
                    case 'staking_reminder': return 'mainNotifications.staking';
                    default: return 'mainNotifications.all';
                  }
                };
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setFilter(type);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      filter === type 
                        ? `bg-gradient-to-r ${color} text-white shadow-lg` 
                        : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                    } transition-all duration-200`}
                  >
                    {icon}
                    {t(getTranslationKey(type))}
                  </button>
                );
              })}
            </div>
          </motion.div>
          
          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-12 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-white">{t('mainNotifications.loading')}</p>
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-12 text-center">
                <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-white text-lg font-medium mb-2">{t('mainNotifications.noNotifications')}</p>
                <p className="text-gray-400">
                  {filter === 'all' 
                    ? t('mainNotifications.youHaveNoNotifications')
                    : t('mainNotifications.noFilteredNotifications')}
                </p>
              </div>
            ) : (
              paginatedNotifications.map((notification, index) => {
                const getTypeColor = () => 'bg-gray-500/20 border-white/20';
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`bg-gray-900/80 backdrop-blur-xl rounded-2xl border ${getTypeColor()} shadow-xl overflow-hidden cursor-pointer hover:bg-gray-800/80 transition-all duration-200 group`}
                    onClick={() => navigate('/dashboard')}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${getTypeColor()}`}>
                          <Info className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-lg font-semibold text-white`}>
                              {notification.title}
                            </h3>
                          </div>
                          <p className={`text-gray-300 mb-3`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{formatTime(notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          
          {/* Pagination */}
          {!loading && filteredNotifications.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center mt-8">
              <div className="inline-flex bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/20 p-1 shadow-xl">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-white/10 transition-colors"
                  aria-label="Previous page"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="px-4 py-2 flex items-center text-white">
                  {currentPage} / {totalPages}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-white/10 transition-colors"
                  aria-label="Next page"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage; 