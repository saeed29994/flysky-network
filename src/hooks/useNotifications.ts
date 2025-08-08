// 📁 src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { apiService } from '../utils/apiService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'sent' | 'scheduled' | 'draft' | 'failed';
  targetAudience: 'all' | 'premium' | 'new' | 'inactive';
  platforms: string[];
  sentAt?: Date;
  scheduledFor?: Date;
  recipients: number;
  opened: number;
  clicked: number;
  createdAt: Date;
  createdBy: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  sendNotification: (title: string, body: string) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<boolean>;
  updateNotification: (id: string, updates: Partial<Notification>) => Promise<boolean>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
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
          recipients: data.recipients || 0,
          opened: data.opened || 0,
          clicked: data.clicked || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'System',
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

      setNotifications(prev => [newNotification, ...prev]);
      return true;
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification');
      return false;
    }
  }, []);

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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    sendNotification,
    refreshNotifications,
    deleteNotification,
    updateNotification,
  };
}; 