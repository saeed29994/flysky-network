import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Chat Notification System - Cloud Functions
 *
 * These functions create notifications for chat room messages
 * Separate from post notifications for better organization
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a chat notification document in Firestore
 */
async function createChatNotification(
  db: admin.firestore.Firestore,
  recipientId: string,
  notificationData: {
    type: 'room_message';
    relatedId: string; // messageId
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    targetScope: 'public' | string; // 'public' or allianceId
    contentPreview: string;
    roomType: 'public' | 'alliance';
  }
) {
  // ✅ استخدام allianceNotifications بدلاً من chatNotifications
  const notificationRef = db.collection('allianceNotifications').doc();

  await notificationRef.set({
    id: notificationRef.id,
    ...notificationData,
    recipientId,
    isRead: false,
    timestamp: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  functions.logger.info(`✅ Alliance Chat notification created: ${notificationRef.id} for user ${recipientId}`);
  return notificationRef.id;
}

/**
 * Gets user data for notification
 */
async function getUserData(db: admin.firestore.Firestore, uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      return {
        name: userData.fullName || userData.displayName || 'Unknown User',
        avatar: userData.avatarUrl || userData.photoURL || '',
      };
    }
  } catch (error) {
    functions.logger.error(`Error fetching user data for ${uid}:`, error);
  }
  return { name: 'Unknown User', avatar: '' };
}

// ============================================================================
// PUBLIC ROOM CHAT NOTIFICATIONS
// ============================================================================

/**
 * Triggers when a new message is created in public room
 * Creates notifications for all other active users in the room
 */
export const onPublicRoomMessageCreate = functions.firestore
  .document('allianceSystem/publicRoom/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const senderId = messageData.senderUid;
    const content = messageData.content || '';

    functions.logger.info(`📨 New public room message from ${senderId}`);

    // Don't create notification if message is deleted or empty
    if (messageData.isDeleted || !content.trim()) {
      return null;
    }

    const db = admin.firestore();
    const senderData = await getUserData(db, senderId);

    // Get all users who have been active in the last 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentMessagesQuery = db
      .collection('allianceSystem/publicRoom/messages')
      .where('createdAt', '>=', twoDaysAgo)
      .select('senderUid');

    const recentMessagesSnapshot = await recentMessagesQuery.get();
    const activeUserIds = new Set<string>();

    recentMessagesSnapshot.docs.forEach(doc => {
      const uid = doc.data().senderUid;
      if (uid && uid !== senderId) {
        activeUserIds.add(uid);
      }
    });

    functions.logger.info(`👥 Found ${activeUserIds.size} active users to notify`);

    // Create notifications for all active users
    const notificationPromises = Array.from(activeUserIds).map(recipientId =>
      createChatNotification(db, recipientId, {
        type: 'room_message',
        relatedId: snapshot.id,
        senderId,
        senderName: senderData.name,
        senderAvatar: senderData.avatar,
        targetScope: 'public',
        contentPreview: content.substring(0, 100),
        roomType: 'public',
      })
    );

    await Promise.all(notificationPromises);
    functions.logger.info(`✅ Created ${notificationPromises.length} chat notifications for public room message`);

    return null;
  });

// ============================================================================
// ALLIANCE ROOM CHAT NOTIFICATIONS
// ============================================================================

/**
 * Triggers when a new message is created in alliance room
 * Creates notifications for all alliance members except sender
 */
export const onAllianceRoomMessageCreate = functions.firestore
  .document('alliances/{allianceId}/roomMessages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const { allianceId } = context.params;
    const messageData = snapshot.data();
    const senderId = messageData.senderUid;
    const content = messageData.content || '';

    functions.logger.info(`📨 New alliance room message in ${allianceId} from ${senderId}`);

    if (messageData.isDeleted || !content.trim()) {
      return null;
    }

    const db = admin.firestore();
    const senderData = await getUserData(db, senderId);

    // Get all alliance members except sender
    const membersSnapshot = await db
      .collection(`alliances/${allianceId}/members`)
      .where('uid', '!=', senderId)
      .get();

    functions.logger.info(`👥 Found ${membersSnapshot.size} members to notify`);

    // Create notifications for all members
    const notificationPromises = membersSnapshot.docs.map(memberDoc =>
      createChatNotification(db, memberDoc.data().uid, {
        type: 'room_message',
        relatedId: snapshot.id,
        senderId,
        senderName: senderData.name,
        senderAvatar: senderData.avatar,
        targetScope: allianceId,
        contentPreview: content.substring(0, 100),
        roomType: 'alliance',
      })
    );

    await Promise.all(notificationPromises);
    functions.logger.info(`✅ Created ${notificationPromises.length} chat notifications for alliance room message`);

    return null;
  });