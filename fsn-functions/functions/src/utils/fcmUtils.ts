import * as admin from "firebase-admin";

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Get FCM tokens from multiple sources for better compatibility
 * @param userId - The user ID
 * @param userData - The user data object
 * @returns Array of FCM tokens
 */
export async function getFcmTokens(userId: string, userData: any): Promise<string[]> {
  let fcmTokens: string[] = [];
  
  // First, try to get tokens from user document
  if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
    fcmTokens = [...userData.fcmTokens];
    console.log(`Found ${fcmTokens.length} tokens in user document for user ${userId}`);
  }
  
  // If no tokens found in user document, try userTokens collection
  if (fcmTokens.length === 0) {
    try {
      const tokenDoc = await db.collection("userTokens").doc(userId).get();
      if (tokenDoc.exists && tokenDoc.data()?.token) {
        fcmTokens = [tokenDoc.data()!.token];
        console.log(`Found token in userTokens collection for user ${userId}`);
      }
    } catch (error) {
      console.warn(`Error checking userTokens collection for user ${userId}:`, error);
    }
  }
  
  if (fcmTokens.length === 0) {
    console.log(`No FCM tokens found for user ${userId}`);
  }
  
  return fcmTokens;
}

/**
 * Send FCM notification to multiple tokens with error handling
 * @param tokens - Array of FCM tokens
 * @param notification - Notification object
 * @param userId - User ID for logging
 * @param userData - User data for token cleanup
 * @returns Object with success and error counts
 */
export async function sendFcmNotifications(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
    webpush?: any;
  },
  userId: string,
  userData: any
): Promise<{ successCount: number; errorCount: number }> {
  const messaging = admin.messaging();
  let successCount = 0;
  let errorCount = 0;
  
  for (const token of tokens) {
    try {
      await messaging.send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        webpush: notification.webpush,
      });
      successCount++;
      console.log(`✅ FCM notification sent successfully to token for user ${userId}`);
    } catch (err: any) {
      errorCount++;
      console.error(`❌ Failed to send FCM notification to token for user ${userId}:`, err);
      
      // Remove invalid tokens
      if (err.code === 'messaging/registration-token-not-registered') {
        await cleanupInvalidToken(userId, token, userData);
      }
    }
  }
  
  return { successCount, errorCount };
}

/**
 * Clean up invalid FCM tokens from both storage locations
 * @param userId - User ID
 * @param token - Invalid token to remove
 * @param userData - User data object
 */
async function cleanupInvalidToken(userId: string, token: string, userData: any): Promise<void> {
  try {
    // Remove from user document if it exists there
    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
      await db.collection("users").doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
      });
      console.log(`🗑️ Removed invalid token from user document for user ${userId}`);
    }
    
    // Remove from userTokens collection if it exists there
    const tokenDoc = await db.collection("userTokens").doc(userId).get();
    if (tokenDoc.exists && tokenDoc.data()?.token === token) {
      await db.collection("userTokens").doc(userId).delete();
      console.log(`🗑️ Removed invalid token from userTokens collection for user ${userId}`);
    }
  } catch (cleanupError) {
    console.error(`❌ Error cleaning up invalid token for user ${userId}:`, cleanupError);
  }
}

/**
 * Add notification to user's notifications collection
 * @param userId - User ID
 * @param notification - Notification object
 */
export async function addUserNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    body: string;
    link?: string;
    data?: any;
  }
): Promise<void> {
  try {
    await db.collection("users").doc(userId).collection("notifications").add({
      ...notification,
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Added notification to user collection for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error adding notification to user collection for user ${userId}:`, error);
  }
}

/**
 * Add message to inbox collection
 * @param inboxMessage - Inbox message object
 */
export async function addInboxMessage(inboxMessage: {
  userId: string;
  title: string;
  body: string;
  type: string;
  amount?: number;
  claimed?: boolean;
}): Promise<void> {
  try {
    await db.collection("inbox").add({
      ...inboxMessage,
      read: false,
      claimed: inboxMessage.claimed || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Added message to inbox for user ${inboxMessage.userId}`);
  } catch (error) {
    console.error(`❌ Error adding message to inbox for user ${inboxMessage.userId}:`, error);
  }
} 