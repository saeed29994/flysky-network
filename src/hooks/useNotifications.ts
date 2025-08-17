// 📁 src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, Timestamp, where, doc, deleteDoc, writeBatch } from 'firebase/firestore';

import { auth } from '../firebase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  titleKey?: string; // Translation key for the title
  bodyKey?: string;  // Translation key for the body
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'sent' | 'scheduled' | 'draft' | 'failed' | 'processing';
  targetAudience: 'all' | 'premium' | 'new' | 'inactive' | 'custom' | 'plans';
  platforms: string[];
  sentAt?: Date;
  scheduledFor?: Date;
  processedAt?: Date;
  recipients: number;
  opened: number;
  clicked: number;
  createdAt: Date;
  createdBy: string;
  successCount?: number;
  errorCount?: number;
  error?: string;
  // Extended properties for dynamic targeting
  selectedPlans?: string[];
  selectedUsers?: Array<{id: string; email: string; plan?: string}>;
  userSearch?: string;
  filteredUsers?: Array<{id: string; email: string; plan?: string}>;
  userCount?: number;
  // Delivery status tracking
  deliveryStatus?: 'pending' | 'delivered' | 'partial_success' | 'failed';
  deliveryDetails?: {
    totalRecipients: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    errorMessage?: string;
    sentAt?: Date;
  };
}

export interface NotificationLog {
  id: string;
  notificationId: string;
  title: string;
  message: string;
  status: 'success' | 'partial_success' | 'failed';
  error?: string;
  errorDetails?: string;
  targetAudience: string;
  platforms: string[];
  timestamp: Date;
  processingTime: number;
  recipients: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{ token: string; error: string }>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  titleKey?: string; // Translation key for the title
  bodyKey?: string;  // Translation key for the body
  targetAudience?: 'all' | 'premium' | 'new' | 'inactive' | 'custom' | 'plans';
  platforms?: string[];
  scheduledFor?: Date | null;
  customUserIds?: string[];
  selectedPlans?: string[];
}

interface UseNotificationsReturn {
  notifications: Notification[];
  logs: NotificationLog[];
  loading: boolean;
  logsLoading: boolean;
  error: string | null;
  sendAdvancedNotification: (payload: NotificationPayload) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  deleteNotification: (id: string) => Promise<boolean>;
  clearAllNotifications: () => Promise<boolean>;
  updateNotification: (id: string, updates: Partial<Notification>) => Promise<boolean>;
  getNotificationLogs: (notificationId: string) => Promise<NotificationLog[]>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch notifications from Firestore
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(notificationsQuery);
      const fetchedNotifications: Notification[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifications.push({
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          status: data.status || 'draft',
          targetAudience: data.targetAudience || 'all',
          platforms: data.platforms || [],
          sentAt: data.sentAt?.toDate(),
          scheduledFor: data.scheduledFor?.toDate(),
          processedAt: data.processedAt?.toDate(),
          recipients: data.recipients || 0,
          opened: data.opened || 0,
          clicked: data.clicked || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'System',
          successCount: data.successCount || 0,
          errorCount: data.errorCount || 0,
          error: data.error || undefined
        });
      });

      setNotifications(fetchedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotificationLogs = useCallback(async () => {
    try {
      setLogsLoading(true);

      // Fetch the most recent logs
      const logsRef = collection(db, 'notificationLogs');
      const logsQuery = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(logsQuery);
      const fetchedLogs: NotificationLog[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedLogs.push({
          id: doc.id,
          notificationId: data.notificationId || '',
          title: data.title || '',
          message: data.message || '',
          status: data.status || 'failed',
          error: data.error,
          errorDetails: data.errorDetails,
          targetAudience: data.targetAudience || 'all',
          platforms: data.platforms || [],
          timestamp: data.timestamp?.toDate() || new Date(),
          processingTime: data.processingTime || 0,
          recipients: data.recipients || 0,
          successCount: data.successCount || 0,
          errorCount: data.errorCount || 0
        });
      });

      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching notification logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const getNotificationLogs = useCallback(async (notificationId: string): Promise<NotificationLog[]> => {
    try {
      // Fetch logs for a specific notification
      const logsRef = collection(db, 'notificationLogs');
      const logsQuery = query(
        logsRef,
        where('notificationId', '==', notificationId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(logsQuery);
      const notificationLogs: NotificationLog[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationLogs.push({
          id: doc.id,
          notificationId: data.notificationId || '',
          title: data.title || '',
          message: data.message || '',
          status: data.status || 'failed',
          error: data.error,
          errorDetails: data.errorDetails,
          targetAudience: data.targetAudience || 'all',
          platforms: data.platforms || [],
          timestamp: data.timestamp?.toDate() || new Date(),
          processingTime: data.processingTime || 0,
          recipients: data.recipients || 0,
          successCount: data.successCount || 0,
          errorCount: data.errorCount || 0
        });
      });

      return notificationLogs;
    } catch (err) {
      console.error('Error fetching notification logs:', err);
      return [];
    }
  }, []);

  const sendAdvancedNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    try {
      setError(null);
      const { title, body, targetAudience = 'all', platforms = ['mobile', 'web'], scheduledFor = null } = payload;

      // If scheduled for later, store in Firestore
      if (scheduledFor) {
        try {
          // Create notification document with scheduled status
          const notificationData: Record<string, any> = {
            title,
            message: body,
            type: 'info',
            status: 'scheduled',
            targetAudience,
            platforms,
            scheduledFor: Timestamp.fromDate(scheduledFor),
            recipients: 0,
            opened: 0,
            clicked: 0,
            createdAt: Timestamp.fromDate(new Date()),
            createdBy: 'Admin',
          };
          
          // Store in Firestore
          await addDoc(collection(db, 'notifications'), notificationData);
          
          // Refresh notifications to show the new scheduled one
          await fetchNotifications();
          return true;
        } catch (err) {
          console.error('Error scheduling notification:', err);
          setError(`Failed to schedule notification: ${(err as Error).message}`);
          return false;
        }
      } else {
        try {
          // Get the current user's ID token for authentication
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error('No authenticated user found');
          }
          
          const idToken = await currentUser.getIdToken();
          
          // Use HTTP request to the NEW INTERNATIONALIZED Cloud Function
          const response = await fetch('https://us-central1-flysky-site.cloudfunctions.net/sendInternationalizedAdminNotification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              title,
              message: body,
              titleKey: payload.titleKey,
              bodyKey: payload.bodyKey,
              targetAudience,
              platforms,
              type: 'info',
              selectedPlans: payload.selectedPlans,
              customUserIds: payload.customUserIds
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }
          
          const resultData = await response.json();
          
          // Check if the notification was actually sent successfully
          if (resultData && resultData.successCount > 0) {
            // Notification was delivered to at least some devices
            if (resultData.errorCount > 0) {
              // Partial success - some delivered, some failed
              console.log(`⚠️ Partial success: ${resultData.successCount} delivered, ${resultData.errorCount} failed`);
              setError(`Notification partially delivered: ${resultData.successCount} users received it, ${resultData.errorCount} failed`);
            } else {
              // Complete success
              console.log(`✅ Internationalized notification sent successfully to ${resultData.successCount} devices`);
              
              // Log internationalization details
              if (resultData.internationalized && resultData.languageDistribution) {
                console.log(`🌍 Languages served: ${resultData.totalLanguages}`);
                console.log('📊 Language distribution:', resultData.languageDistribution);
              }
            }
            
            // Cloud Function already created the notification record, just refresh to show it
            await fetchNotifications();
            await fetchNotificationLogs();
            
            return true;
          } else {
            // Complete failure - no notifications delivered
            console.warn('❌ All notification attempts failed:', resultData);
            
            // Create notification document with failed status
            const notificationData: Record<string, any> = {
              title,
              message: body,
              type: 'info',
              status: 'failed',
              targetAudience,
              platforms,
              error: 'All notification attempts failed',
              createdAt: Timestamp.fromDate(new Date()),
              createdBy: 'Admin',
              recipients: 0,
              opened: 0,
              clicked: 0
            };
            
            // Store failed notification in Firestore
            await addDoc(collection(db, 'notifications'), notificationData);
            
            // Refresh notifications to show the failed one
            await fetchNotifications();
            await fetchNotificationLogs();
            
            setError('All notification attempts failed. Check if users have valid FCM tokens.');
            return false;
          }
          
        } catch (err) {
          console.error('❌ Error sending internationalized notification:', err);
          
          // Create notification document with failed status
          const notificationData: Record<string, any> = {
            title,
            message: body,
            type: 'info',
            status: 'failed',
            targetAudience,
            platforms,
            error: (err as Error).message || 'Unknown error',
            createdAt: Timestamp.fromDate(new Date()),
            createdBy: 'Admin',
            recipients: 0,
            opened: 0,
            clicked: 0
          };
          
          // Store failed notification in Firestore
          await addDoc(collection(db, 'notifications'), notificationData);
          
          // Refresh notifications to show the failed one
          await fetchNotifications();
          await fetchNotificationLogs();
          
          setError(`Failed to send notification: ${(err as Error).message}`);
          return false;
        }
      }
    } catch (err) {
      console.error('❌ Error in sendAdvancedNotification:', err);
      setError(`Failed to send notification: ${(err as Error).message}`);
      return false;
    }
  }, [fetchNotifications, fetchNotificationLogs]);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      // First, remove from local state immediately for better UX
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Delete the notification document from Firestore
      const notificationRef = doc(db, 'notifications', id);
      await deleteDoc(notificationRef);
      
      // Also delete related logs for this notification
      const logsRef = collection(db, 'notificationLogs');
      const logsQuery = query(logsRef, where('notificationId', '==', id));
      const logsSnapshot = await getDocs(logsQuery);
      
      if (!logsSnapshot.empty) {
        const batch = writeBatch(db);
        logsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      
      // Clean up any user inbox notifications that reference this notification
      // This handles cases where notifications were sent with 'inbox' platform
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      if (!usersSnapshot.empty) {
        const inboxBatch = writeBatch(db);
        let hasInboxNotifications = false;
        
        for (const userDoc of usersSnapshot.docs) {
          const inboxRef = collection(db, `users/${userDoc.id}/inbox`);
          const inboxQuery = query(inboxRef, where('notificationId', '==', id));
          const inboxSnapshot = await getDocs(inboxQuery);
          
          if (!inboxSnapshot.empty) {
            hasInboxNotifications = true;
            inboxSnapshot.docs.forEach(doc => {
              inboxBatch.delete(doc.ref);
            });
          }
        }
        
        // Commit the batch if there are any inbox notifications to delete
        if (hasInboxNotifications) {
          await inboxBatch.commit();
        }
      }
      
      console.log(`✅ Successfully deleted notification ${id} and cleaned up related data`);
      return true;
      
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
      
      // Restore the notification to local state if deletion failed
      await fetchNotifications();
      setError(`Failed to delete notification: ${(err as Error).message}`);
      return false;
    }
  }, [fetchNotifications]);

  const updateNotification = useCallback(async (id: string, updates: Partial<Notification>): Promise<boolean> => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, ...updates } : n)
      );
      return true;
    } catch (err) {
      console.error('Error updating notification:', err);
      setError('Failed to update notification');
      return false;
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const refreshLogs = useCallback(async () => {
    await fetchNotificationLogs();
  }, [fetchNotificationLogs]);

  const clearAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      // Clear local state immediately for better UX
      setNotifications([]);
      
      // Get all notification documents
      const notificationsRef = collection(db, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsRef);
      
      if (notificationsSnapshot.empty) {
        console.log('✅ No notifications to clear');
        return true;
      }
      
      // Delete all notifications in batches
      const batch = writeBatch(db);
      notificationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      // Clear all notification logs
      const logsRef = collection(db, 'notificationLogs');
      const logsSnapshot = await getDocs(logsRef);
      
      if (!logsSnapshot.empty) {
        const logsBatch = writeBatch(db);
        logsSnapshot.docs.forEach(doc => logsBatch.delete(doc.ref));
        await logsBatch.commit();
      }
      
      // Clear all user inbox notifications
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      if (!usersSnapshot.empty) {
        const inboxBatch = writeBatch(db);
        let hasInboxNotifications = false;
        
        for (const userDoc of usersSnapshot.docs) {
          const inboxRef = collection(db, `users/${userDoc.id}/inbox`);
          const inboxQuery = query(inboxRef, where('notificationId', '!=', ''));
          const inboxSnapshot = await getDocs(inboxQuery);
          
          if (!inboxSnapshot.empty) {
            hasInboxNotifications = true;
            inboxSnapshot.docs.forEach(doc => inboxBatch.delete(doc.ref));
          }
        }
        
        if (hasInboxNotifications) {
          await inboxBatch.commit();
        }
      }
      
      console.log('✅ All notifications cleared successfully');
      return true;
    } catch (err) {
      console.error('❌ Error clearing all notifications:', err);
      setError(`Failed to clear all notifications: ${(err as Error).message}`);
      
      // Refresh notifications to restore them if clearing failed
      await fetchNotifications();
      return false;
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    fetchNotificationLogs();
  }, [fetchNotifications, fetchNotificationLogs]);

  return {
    notifications,
    logs,
    loading,
    logsLoading,
    error,
    sendAdvancedNotification,
    refreshNotifications,
    refreshLogs,
    deleteNotification,
    clearAllNotifications,
    updateNotification,
    getNotificationLogs,
  };
}; 