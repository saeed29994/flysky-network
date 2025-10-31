import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { NotificationToast } from './ui/notification-toast';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * NotificationProvider - Enhanced notification system with duplicate prevention
 * 
 * Features:
 * - Prevents notifications from showing repeatedly across route changes
 * - Uses localStorage to persist shown notification IDs
 * - Implements debouncing to prevent rapid notification processing
 * - Session-based duplicate prevention
 * - Auto-cleanup of old notification records
 * - Route change handling to reset processing state
 * 
 * The system ensures each notification is shown only once per session
 * and automatically dismisses after 5 seconds.
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    notifications,
    unreadNotifications,
    markAsRead,
  } = useUserNotifications();

  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  
  // Use refs to persist state across re-renders and route changes
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());
  const currentNotificationRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const hasShownCurrentRef = useRef(false);
  const lastProcessedNotificationRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionShownNotificationsRef = useRef<Set<string>>(new Set());

  // Load shown notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shownNotificationIds');
      if (stored) {
        const parsed = JSON.parse(stored);
        const newSet = new Set<string>(parsed as string[]);
        setShownNotificationIds(newSet);
        shownNotificationIdsRef.current = newSet;
      }
      
      // Clear session-based notifications on app refresh/restart
      sessionShownNotificationsRef.current.clear();
    } catch (error) {
      console.error('Error loading shown notification IDs from localStorage:', error);
    }
  }, []);

  // Save shown notification IDs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('shownNotificationIds', JSON.stringify([...shownNotificationIds]));
      shownNotificationIdsRef.current = shownNotificationIds;
    } catch (error) {
      console.error('Error saving shown notification IDs to localStorage:', error);
    }
  }, [shownNotificationIds]);

  // Handle navigation
  const handleNavigate = (link: string) => {
    navigate(link);
  };

  // Handle notification close
  const handleClose = () => {
    setCurrentNotification(null);
    currentNotificationRef.current = null;
    hasShownCurrentRef.current = false;
  };

  // Handle notification read
  const handleRead = async (id: string) => {
    try {
      await markAsRead(id);
      // Mark as shown so it won't be displayed again
      const newSet = new Set([...shownNotificationIds, id]);
      setShownNotificationIds(newSet);
      shownNotificationIdsRef.current = newSet;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Process new notifications - only run when unreadNotifications change
  useEffect(() => {
    // Skip if already processing or if we've shown the current notification
    if (isProcessingRef.current || !unreadNotifications.length || hasShownCurrentRef.current) {
      return;
    }

    // Find the first unread notification that hasn't been shown yet
    const newNotification = unreadNotifications.find(notification => 
      !shownNotificationIdsRef.current.has(notification.id)
    );

    if (newNotification && !currentNotificationRef.current) {
      // Check if this is the same notification we just processed
      if (lastProcessedNotificationRef.current === newNotification.id) {
        return;
      }

      // Check if this notification has been shown in the current session
      if (sessionShownNotificationsRef.current.has(newNotification.id)) {
        return;
      }

      // Additional check: ensure this notification hasn't been shown recently
      const notificationKey = `${newNotification.type}-${newNotification.title}-${newNotification.body}`;
      const recentlyShown = localStorage.getItem(`recentlyShown_${notificationKey}`);
      
      if (recentlyShown) {
        const shownTime = parseInt(recentlyShown);
        const timeSinceShown = Date.now() - shownTime;
        
        // If shown within last 5 minutes, skip it
        if (timeSinceShown < 5 * 60 * 1000) {
          // Mark as shown to prevent future processing
          const newSet = new Set([...shownNotificationIds, newNotification.id]);
          setShownNotificationIds(newSet);
          shownNotificationIdsRef.current = newSet;
          return;
        }
      }

      // Clear any existing processing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Debounce the notification processing to prevent rapid firing
      processingTimeoutRef.current = setTimeout(() => {
        console.log('🔔 Processing notification:', newNotification.id, newNotification.title);
        
        isProcessingRef.current = true;
        
        setCurrentNotification(newNotification);
        currentNotificationRef.current = newNotification;
        hasShownCurrentRef.current = true;
        lastProcessedNotificationRef.current = newNotification.id;
        
        // Mark as shown in current session
        sessionShownNotificationsRef.current.add(newNotification.id);
        
        // Mark this notification type as recently shown
        localStorage.setItem(`recentlyShown_${notificationKey}`, Date.now().toString());
        
        console.log('✅ Notification marked as shown:', newNotification.id);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          console.log('⏰ Auto-closing notification:', newNotification.id);
          setCurrentNotification(null);
          currentNotificationRef.current = null;
          isProcessingRef.current = false;
          hasShownCurrentRef.current = false;
          lastProcessedNotificationRef.current = null;
        }, 5000);
      }, 300); // 300ms debounce
    }
  }, [unreadNotifications, shownNotificationIds]); // Add shownNotificationIds back as dependency

  // Clean up shown notification IDs when notifications change significantly
  // This prevents the set from growing indefinitely
  useEffect(() => {
    const currentIds = new Set(notifications.map(n => n.id));
    setShownNotificationIds(prev => {
      const newSet = new Set<string>();
      // Only keep IDs that still exist in current notifications
      for (const id of prev) {
        if (currentIds.has(id)) {
          newSet.add(id);
        }
      }
      // Also update the ref
      shownNotificationIdsRef.current = newSet;
      return newSet;
    });
  }, [notifications]);

  // Clean up old recently shown notifications from localStorage
  useEffect(() => {
    const cleanupRecentlyShown = () => {
      try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        keys.forEach(key => {
          if (key.startsWith('recentlyShown_')) {
            const timestamp = localStorage.getItem(key);
            if (timestamp) {
              const shownTime = parseInt(timestamp);
              if (shownTime < fiveMinutesAgo) {
                localStorage.removeItem(key);
              }
            }
          }
        });
      } catch (error) {
        console.error('Error cleaning up recently shown notifications:', error);
      }
    };

    // Clean up every 5 minutes
    const interval = setInterval(cleanupRecentlyShown, 5 * 60 * 1000);
    
    // Initial cleanup
    cleanupRecentlyShown();
    
    return () => clearInterval(interval);
  }, []);

  // Reset processing state when location changes (route navigation)
  useEffect(() => {
    // Reset processing state on route change to allow new notifications
    if (isProcessingRef.current) {
      isProcessingRef.current = false;
    }
    
    // Clear any pending processing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, [location.pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {children}
      <NotificationToast 
        notification={currentNotification}
        onClose={handleClose}
        onRead={handleRead}
        onNavigate={handleNavigate}
        autoCloseTime={5000}
      />
    </>
  );
}; 