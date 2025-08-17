import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useUserNotifications } from '../hooks/useUserNotifications';
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
  User,
  Check,
  Trash2
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
    loading,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    unreadCount
  } = useUserNotifications();

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get filtered notifications based on type
  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(notification => notification.type === filter);
  };

  const filteredNotifications = getFilteredNotifications();
  
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'claim_reward':
        return <Gift className="w-5 h-5 text-yellow-400" />;
      case 'referral_bonus':
        return <User className="w-5 h-5 text-green-400" />;
      case 'mining_reminder':
        return <Clock className="w-5 h-5 text-purple-400" />;
      case 'staking_reminder':
        return <Clock className="w-5 h-5 text-pink-400" />;
      case 'inbox_message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
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
                    {unreadCount} {t('mainNotifications.unreadNotifications')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('mainNotifications.markAllAsRead')}</span>
                  </button>
                )}
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
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-16 text-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-white">{t('mainNotifications.loading')}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-12 text-center">
                <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-white text-lg font-medium mb-2">{t('mainNotifications.noNotifications')}</p>
                <p className="text-gray-400">
                  {filter === 'all' 
                    ? t('mainNotifications.youHaveNoNotifications')
                    : t('mainNotifications.noFilteredNotifications')}
                </p>
              </div>
            ) : (
              <>
                {paginatedNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden ${
                      !notification.read ? 'ring-2 ring-blue-400/50' : ''
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              {formatTime(notification.timestamp)}
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                  title={t('mainNotifications.markAsRead')}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white px-4">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage; 