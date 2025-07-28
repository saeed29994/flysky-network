import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { Notification, NotificationType } from '../utils/notificationSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const NotificationBell: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications(5); // Only get 5 latest notifications for the dropdown

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

  // Get appropriate icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'claim_reward':
        return <span className="text-yellow-400 text-xl">🎁</span>;
      case 'inbox_message':
        return <span className="text-blue-400 text-xl">📧</span>;
      case 'referral_bonus':
        return <span className="text-green-400 text-xl">🎉</span>;
      case 'mining_reminder':
        return <span className="text-purple-400 text-xl">⛏️</span>;
      case 'staking_reminder':
        return <span className="text-purple-400 text-xl">💰</span>;
      default:
        return <span className="text-gray-400 text-xl">ℹ️</span>;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // If today, show only time
    const now = new Date();
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (notification.id) {
      markAsRead(notification.id);
      
      // Navigate to appropriate page based on notification type
      if (notification.link) {
        navigate(notification.link);
      }
      
      setIsOpen(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle bell click
  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button 
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-white/20 transition-colors"
        aria-label={t('notifications.title')}
      >
        <Bell className="w-6 h-6 text-white" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-lg">
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
            className="fixed z-50 top-16 right-0 left-0 mx-2 md:left-auto md:right-8 md:top-16 md:mx-0 md:w-[400px] max-h-[calc(100vh-6rem)] md:max-h-[500px] bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
            style={{
              transformOrigin: 'top right'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900/90 backdrop-blur-xl z-10">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" /> 
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-blue-500/30 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-300 text-sm">{t('notifications.loading')}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          {notification.title}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2 md:line-clamp-none">
                          {notification.body}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.read && (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
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
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 w-full py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span>{t('notifications.viewAll')}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 