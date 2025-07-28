import React, { useEffect, useState, useRef } from 'react';
import { X, Bell, Info, Gift, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, NotificationType } from '../../utils/notificationSystem';
import { useTranslation } from 'react-i18next';

interface NotificationToastProps {
  notification: Notification | null;
  onClose: () => void;
  onRead: (id: string) => void;
  onNavigate?: (link: string) => void;
  autoCloseTime?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onRead,
  onNavigate,
  autoCloseTime = 3000, // 3 seconds default
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationCompleteRef = useRef(false);

  // Reset state when a new notification arrives
  useEffect(() => {
    if (notification) {
      // Clear any existing timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Reset animation complete flag
      animationCompleteRef.current = false;
      
      // Make notification visible
      setIsVisible(true);
      
      // Set timer for auto-close
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoCloseTime);
    }
    
    // Cleanup on unmount or when notification changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification, autoCloseTime]);

  // Handle animation complete - clean up after exit animation
  const handleAnimationComplete = (definition: string) => {
    // Only process exit animations
    if (definition === "exit" && !isVisible && notification) {
      animationCompleteRef.current = true;
      onClose();
    }
  };

  // Get appropriate icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'claim_reward':
        return <Gift className="w-5 h-5 text-yellow-400" />;
      case 'inbox_message':
        return <Bell className="w-5 h-5 text-blue-400" />;
      case 'referral_bonus':
        return <Gift className="w-5 h-5 text-green-400" />;
      case 'mining_reminder':
      case 'staking_reminder':
        return <Clock className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };
  
  // Get translated type label
  const getNotificationTypeLabel = (type: NotificationType) => {
    return t(`notifications.types.${type}`);
  };

  // Handle notification click
  const handleClick = () => {
    if (notification?.id) {
      onRead(notification.id);
      
      // Navigate to the specified link if available
      if (notification.link && onNavigate) {
        onNavigate(notification.link);
      }
    }
  };

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ 
                  duration: autoCloseTime / 1000, 
                  ease: "linear"
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 