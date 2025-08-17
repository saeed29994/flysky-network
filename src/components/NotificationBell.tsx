import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const NotificationBell: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useUserNotifications();

  // Check if current language is RTL (Arabic)
  const isRTL = i18n.language === 'ar';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString();
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button 
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-white/20 transition-colors"
        aria-label={t('mainNotifications.title')}
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-lg animate-pulse ${
            isRTL ? '-left-1' : '-right-1'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 top-16 right-0 left-0 mx-2 md:left-auto md:top-16 md:mx-0 md:w-[400px] lg:w-[450px] xl:w-[500px] max-h-[calc(100vh-6rem)] md:max-h-[600px] bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col ${
              isRTL 
                ? 'md:right-auto md:left-8 lg:left-6 xl:left-8' 
                : 'md:right-8 lg:right-6 xl:right-8'
            }`}
            style={{ transformOrigin: isRTL ? 'top left' : 'top right' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900/90 backdrop-blur-xl z-10 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}>
              <h3 className={`text-white font-medium flex items-center gap-2 ${isRTL ? 'text-right' : ''}`}>
                <Bell className="w-4 h-4" /> 
                {t('mainNotifications.title')}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center gap-1"
                    title={t('mainNotifications.markAllAsRead')}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {t('mainNotifications.markAllAsRead')}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {loading ? (
                <div className={`p-8 text-center ${isRTL ? 'text-right' : ''}`}>
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-blue-500/30 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-300 text-sm">{t('mainNotifications.loading')}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className={`p-12 text-center ${isRTL ? 'text-right' : ''}`}>
                  <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">{t('mainNotifications.noNotifications')}</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative p-4 rounded-lg border border-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 ${
                        !notification.read ? 'bg-blue-500/10 border-blue-500/20' : 'hover:border-white/10'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Read/Unread indicator */}
                      <div className={`absolute top-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isRTL ? 'left-3' : 'right-3'
                      }`}>
                        {!notification.read ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
                            title={t('mainNotifications.markAsRead')}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="p-1.5 rounded-full bg-green-500/20 text-green-400">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className={`flex gap-3 ${
                        isRTL ? 'pl-12' : 'pr-12'
                      }`}>
                        {/* Notification icon based on type */}
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            !notification.read ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/50 text-gray-400'
                          }`}>
                            {notification.type === 'claim_reward' ? (
                              <span className="text-lg">🎁</span>
                            ) : notification.type === 'referral_bonus' ? (
                              <span className="text-lg">👥</span>
                            ) : notification.type === 'mining_reminder' ? (
                              <span className="text-lg">⛏️</span>
                            ) : notification.type === 'staking_reminder' ? (
                              <span className="text-lg">🔒</span>
                            ) : notification.type === 'inbox_message' ? (
                              <span className="text-lg">💬</span>
                            ) : (
                              <span className="text-lg">🔔</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium flex items-center gap-2 ${
                            !notification.read ? 'text-white' : 'text-gray-300'
                          } ${isRTL ? 'text-right' : ''}`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                            )}
                          </h4>
                          <p className={`text-sm mt-1 line-clamp-2 ${
                            !notification.read ? 'text-gray-200' : 'text-gray-400'
                          } ${isRTL ? 'text-right' : ''}`}>
                            {notification.body}
                          </p>
                          <div className={`flex items-center mt-2 ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notification.type === 'claim_reward' ? 'bg-yellow-500/20 text-yellow-400' :
                              notification.type === 'referral_bonus' ? 'bg-green-500/20 text-green-400' :
                              notification.type === 'mining_reminder' ? 'bg-purple-500/20 text-purple-400' :
                              notification.type === 'staking_reminder' ? 'bg-pink-500/20 text-pink-400' :
                              notification.type === 'inbox_message' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {notification.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10 bg-gray-900/90 backdrop-blur-xl sticky bottom-0 z-10">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                  className={`text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 w-full py-2 rounded-lg hover:bg-white/5 transition-colors ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span>{t('mainNotifications.viewAll')}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 