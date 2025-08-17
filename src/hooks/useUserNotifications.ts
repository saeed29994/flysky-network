import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, where, doc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { auth } from '../firebase';
import { Notification } from '../utils/notificationSystem';

export interface UserNotification extends Notification {
  id: string;
  read: boolean;
  timestamp: any; // Firestore Timestamp
}

interface UseUserNotificationsReturn {
  notifications: UserNotification[];
  unreadNotifications: UserNotification[];
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  unreadCount: number;
  cleanupDuplicateNotifications: () => Promise<void>;
  cleanupMiningReminders: () => Promise<void>;
}

export const useUserNotifications = (): UseUserNotificationsReturn => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread notifications and count
  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const fetchNotifications = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user notifications from Firestore
      const notificationsRef = collection(db, `users/${user.uid}/notifications`);
      const notificationsQuery = query(
        notificationsRef,
        orderBy('timestamp', 'desc'),
        limit(100) // Increased limit to get more notifications
      );

      const snapshot = await getDocs(notificationsQuery);
      const fetchedNotifications: UserNotification[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifications.push({
          id: doc.id,
          type: data.type || 'system',
          title: data.title || '',
          body: data.body || '',
          read: data.read || false,
          timestamp: data.timestamp,
          link: data.link,
          data: data.data
        });
      });

      setNotifications(fetchedNotifications);
    } catch (err) {
      console.error('Error fetching user notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupDuplicateNotifications = useCallback(async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Find duplicate notifications (same type, title, and body within a short time window)
      const notificationsRef = collection(db, `users/${user.uid}/notifications`);
      const recentNotificationsQuery = query(
        notificationsRef,
        where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24 hours
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(recentNotificationsQuery);
      const duplicates: string[] = [];
      const seen = new Map<string, string>(); // key: type+title+body, value: first notification id

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.type}-${data.title}-${data.body}`;
        
        if (seen.has(key)) {
          // This is a duplicate, mark for deletion
          duplicates.push(doc.id);
        } else {
          seen.set(key, doc.id);
        }
      });

      // Special handling for periodic reminders - keep only the most recent one of each type
      const periodicTypes = ['mining_reminder', 'staking_reminder'];
      const periodicNotifications = snapshot.docs.filter(doc => {
        const data = doc.data();
        return periodicTypes.includes(data.type);
      });

      // Group by type and keep only the most recent
      const typeGroups = new Map<string, any[]>();
      periodicNotifications.forEach(doc => {
        const data = doc.data();
        if (!typeGroups.has(data.type)) {
          typeGroups.set(data.type, []);
        }
        typeGroups.get(data.type)!.push({ id: doc.id, data, timestamp: data.timestamp });
      });

      // For each type, keep only the most recent notification
      typeGroups.forEach((notifications) => {
        if (notifications.length > 1) {
          // Sort by timestamp (newest first) and mark older ones for deletion
          notifications.sort((a, b) => {
            const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return timeB.getTime() - timeA.getTime();
          });
          
          // Mark all but the first (most recent) for deletion
          notifications.slice(1).forEach(notification => {
            duplicates.push(notification.id);
          });
        }
      });

      // Delete duplicate notifications
      if (duplicates.length > 0) {
        const batch = writeBatch(db);
        duplicates.forEach(id => {
          const notificationRef = doc(db, `users/${user.uid}/notifications/${id}`);
          batch.delete(notificationRef);
        });
        
        await batch.commit();
        console.log(`🧹 Cleaned up ${duplicates.length} duplicate notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up duplicate notifications:', error);
    }
  }, []);

  // Additional function to clean up mining reminders specifically
  const cleanupMiningReminders = useCallback(async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get all mining reminder notifications
      const notificationsRef = collection(db, `users/${user.uid}/notifications`);
      const miningRemindersQuery = query(
        notificationsRef,
        where('type', '==', 'mining_reminder'),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(miningRemindersQuery);
      
      if (snapshot.docs.length > 1) {
        // Keep only the most recent mining reminder
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const timeA = a.data().timestamp?.toDate?.() || new Date(a.data().timestamp);
          const timeB = b.data().timestamp?.toDate?.() || new Date(b.data().timestamp);
          return timeB.getTime() - timeA.getTime();
        });

        // Mark older ones for deletion
        const duplicates = sortedDocs.slice(1).map(doc => doc.id);
        
        if (duplicates.length > 0) {
          const batch = writeBatch(db);
          duplicates.forEach(id => {
            const notificationRef = doc(db, `users/${user.uid}/notifications/${id}`);
            batch.delete(notificationRef);
          });
          
          await batch.commit();
          console.log(`🧹 Cleaned up ${duplicates.length} duplicate mining reminders`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up mining reminders:', error);
    }
  }, []);

  // Set up real-time listener for notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, `users/${user.uid}/notifications`);
    const notificationsQuery = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const fetchedNotifications: UserNotification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification = {
          id: doc.id,
          type: data.type || 'system',
          title: data.title || '',
          body: data.body || '',
          read: data.read || false,
          timestamp: data.timestamp,
          link: data.link,
          data: data.data
        };
        
        fetchedNotifications.push(notification);
      });

      setNotifications(fetchedNotifications);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to notifications:', error);
      setError('Failed to load notifications');
      setLoading(false);
    });

    // Clean up duplicate notifications on initialization
    cleanupDuplicateNotifications();
    cleanupMiningReminders(); // Clean up existing duplicate mining reminders on initialization

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [cleanupDuplicateNotifications, cleanupMiningReminders]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const notificationRef = doc(db, `users/${user.uid}/notifications/${id}`);
      await updateDoc(notificationRef, { read: true });
      
      // Note: Local state will be updated automatically by the real-time listener
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const notificationsRef = collection(db, `users/${user.uid}/notifications`);
      const unreadQuery = query(notificationsRef, where('read', '==', false));
      const snapshot = await getDocs(unreadQuery);
      
      if (snapshot.empty) return true;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      
      // Note: Local state will be updated automatically by the real-time listener
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const notificationRef = doc(db, `users/${user.uid}/notifications/${id}`);
      await deleteDoc(notificationRef);
      
      // Note: Local state will be updated automatically by the real-time listener
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, []);

  return {
    notifications,
    unreadNotifications,
    loading,
    error,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
    cleanupDuplicateNotifications,
    cleanupMiningReminders
  };
};
