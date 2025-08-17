import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { NotificationToast } from './ui/notification-toast';

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Component that provides notification functionality
// Must be used within a Router context
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { 
    notifications,
    unreadNotifications,
    markAsRead,
  } = useUserNotifications();

  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasShownCurrent, setHasShownCurrent] = useState(false);

  // Load shown notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shownNotificationIds');
      if (stored) {
        const parsed = JSON.parse(stored);
        setShownNotificationIds(new Set(parsed));
      }
    } catch (error) {
      console.error('Error loading shown notification IDs from localStorage:', error);
    }
  }, []);

  // Save shown notification IDs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('shownNotificationIds', JSON.stringify([...shownNotificationIds]));
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
    setHasShownCurrent(false);
  };

  // Handle notification read
  const handleRead = async (id: string) => {
    try {
      await markAsRead(id);
      // Mark as shown so it won't be displayed again
      setShownNotificationIds(prev => new Set([...prev, id]));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Process new notifications - only run when unreadNotifications change
  useEffect(() => {
    if (isProcessing || !unreadNotifications.length || hasShownCurrent) {
      return;
    }

    // Find the first unread notification that hasn't been shown yet
    const newNotification = unreadNotifications.find(notification => 
      !shownNotificationIds.has(notification.id)
    );

    if (newNotification && !currentNotification) {
      setIsProcessing(true);
      setCurrentNotification(newNotification);
      setHasShownCurrent(true);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        setCurrentNotification(null);
        setIsProcessing(false);
        setHasShownCurrent(false);
      }, 5000);
    }
  }, [unreadNotifications, shownNotificationIds, currentNotification, isProcessing, hasShownCurrent, notifications.length]);

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
      return newSet;
    });
  }, [notifications]);

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