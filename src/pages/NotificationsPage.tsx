import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Professional Header Section */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

          <div className="relative px-4 py-8 lg:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 lg:mb-12">
                <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Bell className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                  🔔 {t('mainNotifications.title')}
                </h1>
                <p className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                  {unreadCount > 0 
                    ? `${unreadCount} ${t('mainNotifications.unreadNotifications')}`
                    : t('mainNotifications.youHaveNoNotifications')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Header Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-white">{t('mainNotifications.title')}</h2>
                  <p className="text-gray-300 text-sm">
                    {unreadCount > 0 
                      ? `${unreadCount} ${t('mainNotifications.unreadNotifications')}`
                      : t('mainNotifications.youHaveNoNotifications')
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all duration-200 w-full sm:w-auto justify-center hover:scale-105"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('mainNotifications.markAllAsRead')}</span>
                    <span className="sm:hidden">{t('mainNotifications.markAllAsRead')}</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-200 w-full sm:w-auto justify-center hover:scale-105"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('mainNotifications.viewAll')}</span>
                  <span className="sm:hidden">{t('mainNotifications.viewAll')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <div className="flex items-center gap-2 text-gray-300 shrink-0">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{t('mainNotifications.filter')}:</span>
                <span className="sm:hidden">{t('mainNotifications.filter')}</span>
              </div>
              
              <button
                onClick={() => {
                  setFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:scale-105'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">{t('mainNotifications.all')}</span>
                <span className="sm:hidden">{t('mainNotifications.all')}</span>
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
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                      filter === type 
                        ? `bg-gradient-to-r ${color} text-white shadow-lg` 
                        : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:scale-105'
                    }`}
                  >
                    {icon}
                    <span className="hidden sm:inline">{t(getTranslationKey(type))}</span>
                    <span className="sm:hidden">{t(getTranslationKey(type))}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-16 text-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-white">{t('mainNotifications.loading')}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-12 text-center">
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
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden transition-all duration-200 hover:bg-white/15 hover:shadow-2xl hover:scale-[1.02] ${
                      !notification.read ? 'ring-2 ring-blue-400/50' : ''
                    }`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                            {notification.body}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{formatTime(notification.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-200 hover:scale-110"
                                  title={t('mainNotifications.markAsRead')}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200 hover:scale-110"
                                title="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 hover:scale-105 transition-all duration-200"
                      title="Previous page"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white px-4 text-sm sm:text-base font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 hover:scale-105 transition-all duration-200"
                      title="Next page"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage; 