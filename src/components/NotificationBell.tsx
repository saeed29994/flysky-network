import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const NotificationBell: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    loading,
  } = useNotifications();

  console.log(notifications);
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

  const unreadCount = notifications.length; // Since hook doesn't expose read flags, show total count
  // Format timestamp
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
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
            style={{ transformOrigin: 'top right' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900/90 backdrop-blur-xl z-10">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" /> 
                {t('mainNotifications.title')}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
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
                  <p className="text-gray-300 text-sm">{t('mainNotifications.loading')}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">{t('mainNotifications.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors`}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          {t(notification.title)}
                        </h4>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2 md:line-clamp-none">
                          {t(notification.message)}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
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