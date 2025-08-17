import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  doc, 
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';

// Notification types for our system
export type NotificationType = 
  | 'claim_reward' 
  | 'inbox_message' 
  | 'referral_bonus' 
  | 'mining_reminder'
  | 'staking_reminder'
  | 'system';

// Interface for our notification objects
export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  timestamp: Timestamp;
  link?: string; // Optional routing path
  data?: any; // Optional additional data
}

// Add a notification to a user's collection
export const addNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Promise<string | null> => {
  try {
    const notificationData = {
      ...notification,
      read: false,
      timestamp: serverTimestamp()
    };
    
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<boolean> => {
  try {
    const notificationRef = doc(db, `users/${userId}/notifications/${notificationId}`);
    await updateDoc(notificationRef, { read: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const notificationsQuery = query(
      notificationsRef, 
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    if (snapshot.empty) return true;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete a notification
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<boolean> => {
  try {
    const notificationRef = doc(db, `users/${userId}/notifications/${notificationId}`);
    await deleteDoc(notificationRef);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}; 

/**
 * Creates an in-app notification and optionally sends a push notification
 * @param userId User ID
 * @param notification Notification data
 * @param sendPush Whether to also send as push notification
 */
export const createNotificationWithPush = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  sendPush: boolean = true
): Promise<string | null> => {
  try {
    // First check user preferences
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userPrefs = userDoc.exists() ? userDoc.data()?.notifications : null;
    
    // Default preferences if not set
    const inAppEnabled = userPrefs?.inApp !== undefined ? userPrefs.inApp : true;
    const pushEnabled = userPrefs?.push !== undefined ? userPrefs.push : true;
    
    // Check if this notification type should be shown based on preferences
    let shouldShowInApp = inAppEnabled;
    let shouldSendPush = pushEnabled && sendPush;
    
    // Check specific notification types
    if (notification.type === 'claim_reward' || notification.type === 'referral_bonus') {
      const rewardsEnabled = userPrefs?.rewards !== undefined ? userPrefs.rewards : true;
      shouldShowInApp = shouldShowInApp && rewardsEnabled;
      shouldSendPush = shouldSendPush && rewardsEnabled;
    } else if (notification.type === 'system') {
      const securityEnabled = userPrefs?.security !== undefined ? userPrefs.security : true;
      shouldShowInApp = shouldShowInApp && securityEnabled;
      shouldSendPush = shouldSendPush && securityEnabled;
    }
    
    // If in-app notifications are disabled, don't create one
    let notificationId = null;
    if (shouldShowInApp) {
      // Create the in-app notification
      const notificationsRef = collection(db, `users/${userId}/notifications`);
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        read: false,
        timestamp: serverTimestamp()
      });
      notificationId = docRef.id;
    }

    // If push is enabled and allowed by preferences, send push notification
    if (shouldSendPush) {
      try {
        // Use the new internationalized notification system instead of the old sendNotification
        // This prevents duplicate notifications by using the unified system
        const { sendInternationalizedNotification } = await import('./internationalizedNotificationService');

        await sendInternationalizedNotification({
          title: notification.title,
          message: notification.body,
          targetAudience: 'custom',
          platforms: ['mobile', 'web'],
          customUserIds: [userId], // Send only to this specific user
          data: {
            type: notification.type,
            link: notification.link,
            ...notification.data
          }
        });
      } catch (error) {
        console.error('Failed to send push notification via internationalized system:', error);
        // Still return the notification ID since the in-app notification was created
      }
    }

    return notificationId;
  } catch (error) {
    console.error('Error in createNotificationWithPush:', error);
    return null;
  }
}; 