// 📁 src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { db, functions } from '../firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, Timestamp, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { apiService } from '../utils/apiService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'sent' | 'scheduled' | 'draft' | 'failed' | 'processing';
  targetAudience: 'all' | 'premium' | 'new' | 'inactive';
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
  targetAudience?: 'all' | 'premium' | 'new' | 'inactive';
  platforms?: string[];
  scheduledFor?: Date | null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  logs: NotificationLog[];
  loading: boolean;
  logsLoading: boolean;
  error: string | null;
  sendNotification: (title: string, body: string) => Promise<boolean>;
  sendAdvancedNotification: (payload: NotificationPayload) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  deleteNotification: (id: string) => Promise<boolean>;
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

  const sendNotification = useCallback(async (title: string, body: string): Promise<boolean> => {
    try {
      setError(null);

      // Fetch all tokens from Firestore
      const tokensSnapshot = await getDocs(collection(db, 'userTokens'));
      const tokens: string[] = [];
      
      tokensSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });

      if (tokens.length === 0) {
        setError('No users registered for notifications');
        return false;
      }

      // Send notification via API
      const response = await apiService.sendNotification({
        title,
        body,
        tokens,
      });

      if (!response.success) {
        setError(response.error || 'Failed to send notification');
        return false;
      }

      // Add to local notifications list
      const newNotification: Notification = {
        id: `notif${Date.now()}`,
        title,
        message: body,
        type: 'info',
        status: 'sent',
        targetAudience: 'all',
        platforms: ['mobile', 'web'],
        sentAt: new Date(),
        recipients: tokens.length,
        opened: 0,
        clicked: 0,
        createdAt: new Date(),
        createdBy: 'Admin',
      };

      // Store in Firestore
      await addDoc(collection(db, 'notifications'), {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        status: newNotification.status,
        targetAudience: newNotification.targetAudience,
        platforms: newNotification.platforms,
        sentAt: Timestamp.fromDate(newNotification.sentAt || new Date()),
        recipients: newNotification.recipients,
        opened: newNotification.opened,
        clicked: newNotification.clicked,
        createdAt: Timestamp.fromDate(newNotification.createdAt),
        createdBy: newNotification.createdBy,
      });

      setNotifications(prev => [newNotification, ...prev]);
      return true;
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification');
      return false;
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
          // Use the Cloud Function for sending notifications
          const sendManualNotification = httpsCallable(functions, 'sendManualNotification');
          
          // For development environment, use direct Firestore approach if Cloud Function fails
          try {
            // Send immediately via Cloud Function
            await sendManualNotification({
              title,
              message: body,
              targetAudience,
              platforms,
              type: 'info'
            });
          } catch (callError) {
            // If in development and we get a CORS error, fall back to direct Firestore method
            if (import.meta.env.DEV) {
              console.warn('Cloud Function call failed, using fallback method for development:', callError);
              
              // Create notification document with sent status
              const notificationData: Record<string, any> = {
                title,
                message: body,
                type: 'info',
                status: 'sent',
                targetAudience,
                platforms,
                sentAt: Timestamp.fromDate(new Date()),
                recipients: 0,
                opened: 0,
                clicked: 0,
                createdAt: Timestamp.fromDate(new Date()),
                createdBy: 'Admin',
              };
              
              // Store in Firestore
              await addDoc(collection(db, 'notifications'), notificationData);
            } else {
              // In production, propagate the error
              throw callError;
            }
          }
          
          // Refresh notifications to show the new one
          await fetchNotifications();
          await fetchNotificationLogs();
          
          return true;
        } catch (err) {
          console.error('Error sending notification:', err);
          setError(`Failed to send notification: ${(err as Error).message}`);
          return false;
        }
      }
    } catch (err) {
      console.error('Error sending advanced notification:', err);
      setError(`Failed to send notification: ${(err as Error).message}`);
      return false;
    }
  }, [fetchNotifications, fetchNotificationLogs]);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
      return false;
    }
  }, []);

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
    sendNotification,
    sendAdvancedNotification,
    refreshNotifications,
    refreshLogs,
    deleteNotification,
    updateNotification,
    getNotificationLogs,
  };
}; 