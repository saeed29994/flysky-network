import React, { useEffect, useState, useRef, memo } from 'react';
import { X, Bell, Info, Gift, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Interface for user notifications (from useUserNotifications)
interface UserNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: any;
  link?: string;
  data?: any;
}

interface NotificationToastProps {
  notification: UserNotification | null;
  onClose: () => void;
  onRead: (id: string) => void;
  onNavigate?: (link: string) => void;
  autoCloseTime?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = memo(({
  notification,
  onClose,
  onRead,
  onNavigate,
  autoCloseTime = 5000, // 5 seconds default
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationCompleteRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Reset state when a new notification arrives
  useEffect(() => {
    if (notification && !hasStartedRef.current) {
      // Clear any existing timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      
      // Reset flags
      animationCompleteRef.current = false;
      hasStartedRef.current = true;
      
      // Make notification visible
      setIsVisible(true);
      setProgressWidth(100);
      
      // Start progress bar animation
      const progressStep = 100 / (autoCloseTime / 50); // Update every 50ms
      progressTimerRef.current = setInterval(() => {
        setProgressWidth(prev => {
          const newWidth = prev - progressStep;
          return newWidth <= 0 ? 0 : newWidth;
        });
      }, 50);
      
      // Set timer for auto-close
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoCloseTime);
    }
    
    // Cleanup on unmount or when notification changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [notification?.id, autoCloseTime]); // Only depend on notification ID, not the entire object

  // Reset hasStartedRef when notification becomes null
  useEffect(() => {
    if (!notification) {
      hasStartedRef.current = false;
      // Clear timers when notification is null
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  }, [notification]);

  // Handle animation complete - clean up after exit animation
  const handleAnimationComplete = (definition: string) => {
    // Only process exit animations
    if (definition === "exit" && !isVisible && notification) {
      animationCompleteRef.current = true;
      onClose();
    }
  };

  // Get appropriate icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'claim_reward':
      case 'referral_bonus':
      case 'welcome_bonus':
        return <Gift className="w-5 h-5 text-yellow-400" />;
      case 'inbox_message':
        return <Bell className="w-5 h-5 text-blue-400" />;
      case 'mining_reminder':
      case 'staking_reminder':
        return <Clock className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };
  
  // Get translated type label
  const getNotificationTypeLabel = (type: string) => {
    try {
      return t(`mainNotifications.types.${type}`) || t('mainNotifications.types.info') || 'Notification';
    } catch (error) {
      // Fallback to a default label if translation key doesn't exist
      return t('mainNotifications.types.info') || 'Notification';
    }
  };

  // Handle notification click
  const handleClick = () => {
    if (notification?.id) {
      onRead(notification.id);
      
      // Navigate to the specified link if available
      if (notification.link && onNavigate) {
        onNavigate(notification.link);
      } else if (onNavigate) {
        onNavigate('/notifications');
      }
    }
  };

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    // Just trigger the animation to hide
    setIsVisible(false);
    
    // The actual onClose will be called after animation completes
  };

  if (!notification) return null;

  return (
    <div className="fixed z-50 md:top-6 md:right-6 top-4 left-4 right-4 md:left-auto">
      <AnimatePresence onExitComplete={() => !isVisible && !animationCompleteRef.current && onClose()}>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={handleAnimationComplete}
            className="bg-gray-900/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl p-4 max-w-md w-full cursor-pointer"
            onClick={handleClick}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-white/15 flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm line-clamp-1">
                  {notification.title}
                </h3>
                <p className="text-gray-200 text-xs mt-1 line-clamp-2">
                  {notification.body}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  {getNotificationTypeLabel(notification.type)}
                </p>
              </div>
              <button
                onClick={handleCloseClick}
                className="text-gray-400 hover:text-white p-1 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress bar for auto-close timer */}
            <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-linear"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}); 