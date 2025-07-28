import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  Notification, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationType
} from '../utils/notificationSystem';

// Interface for user notification preferences
interface NotificationPreferences {
  inApp: boolean;        // Control in-app notifications (toast, bell)
  push: boolean;         // Control push notifications
  email: boolean;        // Control email notifications
  marketing: boolean;    // Control marketing emails
  rewards: boolean;      // Control reward notifications
  security: boolean;     // Control security notifications
}

// Default preferences if not set
const DEFAULT_PREFERENCES: NotificationPreferences = {
  inApp: true,
  push: true,
  email: true,
  marketing: false,
  rewards: true,
  security: true
};

export const useNotifications = (limitCount = 20) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // First, fetch user notification preferences
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().notifications) {
          const userPrefs = userDoc.data().notifications;
          
          // Convert from the old format to our new format if needed
          setPreferences({
            inApp: userPrefs.inApp !== undefined ? userPrefs.inApp : true,
            push: userPrefs.push !== undefined ? userPrefs.push : true,
            email: userPrefs.email !== undefined ? userPrefs.email : true,
            marketing: userPrefs.marketing !== undefined ? userPrefs.marketing : false,
            rewards: userPrefs.rewards !== undefined ? userPrefs.rewards : true,
            security: userPrefs.security !== undefined ? userPrefs.security : true
          });
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
      }
    };

    fetchNotificationPreferences();
  }, []);

  // Should we show in-app notifications based on preferences and notification type?
  const shouldShowNotification = (notificationType: NotificationType): boolean => {
    // If in-app notifications are disabled, don't show any
    if (!preferences.inApp) return false;
    
    // Otherwise, check specific notification types
    switch (notificationType) {
      case 'claim_reward':
      case 'referral_bonus':
        return preferences.rewards;
      case 'system':
        return preferences.security;
      case 'inbox_message':
      case 'mining_reminder':
      case 'staking_reminder':
      default:
        return true; // Always show other types if in-app is enabled
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Query for notifications, sorted by timestamp (newest first)
    const notificationsRef = collection(db, `users/${user.uid}/notifications`);
    const q = query(
      notificationsRef, 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );

    // Setup real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Process notifications
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        // Update notifications state
        setNotifications(notificationsData);
        
        // Update unread count
        const unreadNotifications = notificationsData.filter(n => !n.read);
        setUnreadCount(unreadNotifications.length);
        
        // Check for new notifications (within the last 10 seconds)
        const tenSecondsAgo = new Date(Date.now() - 10000);
        const recentNotifications = notificationsData.filter(notification => {
          // Check if timestamp is a Firestore timestamp
          if (notification.timestamp instanceof Timestamp) {
            return notification.timestamp.toDate() > tenSecondsAgo;
          }
          // Fallback for any numeric timestamp (milliseconds)
          return (notification.timestamp as any) > tenSecondsAgo.getTime();
        });

        // Set the most recent notification for toast display
        // Only update if we find a newer notification or don't have one yet
        if (recentNotifications.length > 0 && !recentNotifications[0].read) {
          const newest = recentNotifications[0];
          
          // Only show if the notification type is enabled in preferences
          if (shouldShowNotification(newest.type)) {
            // Update if:
            // 1. We don't have a notification yet
            // 2. This is a different notification (new ID)
            // 3. This is a newer notification (compare timestamps)
            if (!newNotification || 
                newest.id !== newNotification.id || 
                (newest.timestamp && newNotification.timestamp && 
                newest.timestamp > newNotification.timestamp)) {
              setNewNotification(newest);
            }
          }
        }

        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [limitCount, preferences]); // Add preferences as dependency

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    const user = auth.currentUser;
    if (!user) return false;
    
    const success = await markNotificationAsRead(user.uid, notificationId);
    
    if (success) {
      // Update local state to avoid waiting for the snapshot update
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // If this was the new notification being shown in toast, clear it
      if (newNotification?.id === notificationId) {
        setNewNotification(null);
      }
    }
    
    return success;
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return false;
    
    const success = await markAllNotificationsAsRead(user.uid);
    
    if (success) {
      // Update local state to avoid waiting for the snapshot update
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      setNewNotification(null);
    }
    
    return success;
  };

  // Delete a notification
  const removeNotification = async (notificationId: string) => {
    const user = auth.currentUser;
    if (!user) return false;
    
    const success = await deleteNotification(user.uid, notificationId);
    
    if (success) {
      // Update local state
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if the removed notification was unread
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // If this was the new notification being shown in toast, clear it
      if (newNotification?.id === notificationId) {
        setNewNotification(null);
      }
    }
    
    return success;
  };

  // Clear the new notification (e.g., after showing toast)
  const clearNewNotification = () => {
    // Use setTimeout to prevent clearing too early
    // This gives animations time to complete
    setTimeout(() => {
      setNewNotification(null);
    }, 300); // Short delay to ensure animation completes
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    newNotification,
    preferences,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNewNotification
  };
}; 