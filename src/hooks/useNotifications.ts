// 📁 src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, Timestamp, where, doc, deleteDoc, writeBatch } from 'firebase/firestore';

import { auth } from '../firebase';

// Helper function to safely parse Firestore date values (Timestamp, string, number, or Date)
function parseFirestoreDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
}

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
  sendAdvancedNotification: (payload: NotificationPayload) => Promise<any>; // Allow full response object
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
          sentAt: parseFirestoreDate(data.sentAt),
          scheduledFor: data.scheduledFor?.toDate(),
          processedAt: parseFirestoreDate(data.processedAt),
          recipients: data.recipients || 0,
          opened: data.opened || 0,
          clicked: data.clicked || 0,
          createdAt: parseFirestoreDate(data.createdAt) || new Date(),
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
          timestamp: parseFirestoreDate(data.timestamp) || new Date(),
          processingTime: data.processingTime || 0,
          recipients: data.recipients || 0,
          successCount: data.successCount || 0,
          errorCount: data.errorCount || 0
        });
      });

      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching notification logs:', err);
      // Don't set error state for logs - just log the error silently
      // This prevents permission errors from breaking the UI
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
          timestamp: parseFirestoreDate(data.timestamp) || new Date(),
          processingTime: data.processingTime || 0,
          recipients: data.recipients || 0,
          successCount: data.successCount || 0,
          errorCount: data.errorCount || 0
        });
      });

      return notificationLogs;
    } catch (err) {
      console.error('Error fetching notification logs:', err);
      // Return empty array instead of throwing - handles permission errors gracefully
      return [];
    }
  }, []);

  const sendAdvancedNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    try {
      setError(null);
      const { title, body, targetAudience = 'all', platforms = ['mobile', 'web', 'inbox'], scheduledFor = null } = payload;

      // Ensure inbox is always included for admin notifications
      const ensuredPlatforms = platforms.includes('inbox') ? platforms : [...platforms, 'inbox'];
      console.log('📋 Final platforms being sent:', ensuredPlatforms);

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
          console.log('ID Token obtained:', idToken ? 'Yes' : 'No');

          // Use HTTP request to the NEW INTERNATIONALIZED Cloud Function
          console.log('📤 Sending notification request to cloud function...');
          console.log('Current user:', auth.currentUser?.uid);
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
              platforms: ensuredPlatforms,
              type: 'info',
              selectedPlans: payload.selectedPlans,
              customUserIds: payload.customUserIds
            })
          });
          console.log('📨 Request payload:', {
            title,
            message: body,
            targetAudience,
            platforms,
            selectedPlans: payload.selectedPlans,
            customUserIds: payload.customUserIds
          });

          console.log('Response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response:', errorText);
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { error: errorText };
            }
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }
          
          const resultData = await response.json();
          
          // The backend now handles all notification logging.
          // We just need to return the result and refresh the UI.
          
          // Log the result for debugging
          console.log('✅ Notification function executed. Result:', resultData);

          // Check if the function actually saved notifications to user collections
          if (resultData && resultData.successCount > 0) {
            console.log(`✅ ${resultData.successCount} notifications were successfully delivered`);
            console.log('📊 Full result details:', resultData);
          } else {
            console.warn('⚠️ No notifications were delivered to users');
            console.log('📊 Full result details:', resultData);
          }

          // Refresh the list of notifications and logs from the database
          await fetchNotifications();
          await fetchNotificationLogs();

          // Return the full result object to the UI component
          return resultData;
          
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
          // Only refresh logs if we have permission - handled gracefully in the function
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

      // Note: Inbox cleanup is removed for performance reasons
      // The inbox notifications will be cleaned up automatically by the app
      // when users access their inbox, or can be handled by a background job

      console.log(`✅ Successfully deleted notification ${id} and related logs`);
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

      // Note: Inbox cleanup is removed for performance reasons
      // The inbox notifications will be cleaned up automatically by the app
      // when users access their inbox, or can be handled by a background job

      console.log('✅ All notifications and logs cleared successfully');
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
    // Only fetch logs if we have permission - this will be handled gracefully in the function
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