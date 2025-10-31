"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAlliancePostReactionCreate = exports.onGlobalPostReactionCreate = exports.onAllianceCommentCreate = exports.onGlobalCommentCreate = exports.onAlliancePostCreate = exports.onGlobalPostCreate = exports.onAllianceMessageCreate = exports.onPublicMessageCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
/**
 * Notification System - Cloud Functions
 *
 * These functions automatically create notifications when users:
 * - Send chat messages
 * - Create posts
 * - Add comments
 * - Add reactions
 */
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Creates a notification document in Firestore
 */
async function createNotification(db, recipientId, notificationData) {
    // ✅ استخدام allianceNotifications بدلاً من notifications
    const notificationRef = db.collection('allianceNotifications').doc();
    await notificationRef.set({
        id: notificationRef.id,
        ...notificationData,
        recipientId,
        isRead: false,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    functions.logger.info(`✅ Alliance Notification created: ${notificationRef.id} for user ${recipientId}`);
    return notificationRef.id;
}
/**
 * Gets user data for notification
 */
async function getUserData(db, uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return {
                name: userData.fullName || userData.displayName || 'Unknown User',
                avatar: userData.avatarUrl || userData.photoURL || '',
            };
        }
    }
    catch (error) {
        functions.logger.error(`Error fetching user data for ${uid}:`, error);
    }
    return { name: 'Unknown User', avatar: '' };
}
// ============================================================================
// CHAT MESSAGE NOTIFICATIONS
// ============================================================================
/**
 * Triggers when a new message is created in public room
 * Creates notifications for all other active users in the room
 */
exports.onPublicMessageCreate = functions.firestore
    .document('allianceSystem/publicRoom/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const senderId = messageData.senderUid;
    const content = messageData.content || '';
    functions.logger.info(`📨 New public message from ${senderId}`);
    // Don't create notification if message is deleted or empty
    if (messageData.isDeleted || !content.trim()) {
        return null;
    }
    const db = admin.firestore();
    const senderData = await getUserData(db, senderId);
    // Get all users who have been active in the last 48 hours (to avoid spam)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentMessagesQuery = db
        .collection('allianceSystem/publicRoom/messages')
        .where('createdAt', '>=', twoDaysAgo)
        .select('senderUid');
    const recentMessagesSnapshot = await recentMessagesQuery.get();
    const activeUserIds = new Set();
    recentMessagesSnapshot.docs.forEach(doc => {
        const uid = doc.data().senderUid;
        if (uid && uid !== senderId) {
            activeUserIds.add(uid);
        }
    });
    functions.logger.info(`👥 Found ${activeUserIds.size} active users to notify`);
    // Create notifications for all active users
    const notificationPromises = Array.from(activeUserIds).map(recipientId => createNotification(db, recipientId, {
        type: 'message',
        relatedId: snapshot.id,
        senderId,
        senderName: senderData.name,
        senderAvatar: senderData.avatar,
        targetScope: 'public',
        contentPreview: content.substring(0, 100),
    }));
    await Promise.all(notificationPromises);
    functions.logger.info(`✅ Created ${notificationPromises.length} notifications for public message`);
    return null;
});
/**
 * Triggers when a new message is created in alliance room
 * Creates notifications for all alliance members except sender
 */
exports.onAllianceMessageCreate = functions.firestore
    .document('alliances/{allianceId}/roomMessages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const { allianceId } = context.params;
    const messageData = snapshot.data();
    const senderId = messageData.senderUid;
    const content = messageData.content || '';
    functions.logger.info(`📨 New alliance message in ${allianceId} from ${senderId}`);
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
    const notificationPromises = membersSnapshot.docs.map(memberDoc => createNotification(db, memberDoc.data().uid, {
        type: 'message',
        relatedId: snapshot.id,
        senderId,
        senderName: senderData.name,
        senderAvatar: senderData.avatar,
        targetScope: allianceId,
        contentPreview: content.substring(0, 100),
    }));
    await Promise.all(notificationPromises);
    functions.logger.info(`✅ Created ${notificationPromises.length} notifications for alliance message`);
    return null;
});
// ============================================================================
// POST NOTIFICATIONS
// ============================================================================
/**
 * Triggers when a new global post is created
 * Creates notifications for ALL users in the system (except the author)
 */
exports.onGlobalPostCreate = functions.firestore
    .document('globalPosts/{postId}')
    .onCreate(async (snapshot, context) => {
    const postData = snapshot.data();
    const authorId = postData.authorUid;
    const text = postData.text || '';
    functions.logger.info(`📝 New global post from ${authorId}`);
    if (!text.trim()) {
        return null;
    }
    const db = admin.firestore();
    const authorData = await getUserData(db, authorId);
    try {
        // Get ALL users from the users collection (except the author)
        const usersSnapshot = await db
            .collection('users')
            .where(admin.firestore.FieldPath.documentId(), '!=', authorId)
            .get();
        functions.logger.info(`👥 Found ${usersSnapshot.size} users to notify about new global post`);
        // Create notifications for all users
        const notificationPromises = usersSnapshot.docs.map(userDoc => createNotification(db, userDoc.id, {
            type: 'post',
            relatedId: snapshot.id,
            senderId: authorId,
            senderName: authorData.name,
            senderAvatar: authorData.avatar,
            targetScope: 'public',
            contentPreview: text.substring(0, 100),
        }));
        await Promise.all(notificationPromises);
        functions.logger.info(`✅ Created ${notificationPromises.length} notifications for global post`);
    }
    catch (error) {
        functions.logger.error('❌ Error creating post notifications:', error);
    }
    return null;
});
/**
 * Triggers when a new alliance post is created
 * Creates notifications for all alliance members except author
 */
exports.onAlliancePostCreate = functions.firestore
    .document('alliances/{allianceId}/posts/{postId}')
    .onCreate(async (snapshot, context) => {
    const { allianceId } = context.params;
    const postData = snapshot.data();
    const authorId = postData.authorUid;
    const text = postData.text || '';
    functions.logger.info(`📝 New alliance post in ${allianceId} from ${authorId}`);
    if (!text.trim()) {
        return null;
    }
    const db = admin.firestore();
    const authorData = await getUserData(db, authorId);
    // Get all alliance members except author
    const membersSnapshot = await db
        .collection(`alliances/${allianceId}/members`)
        .where('uid', '!=', authorId)
        .get();
    functions.logger.info(`👥 Found ${membersSnapshot.size} members to notify`);
    const notificationPromises = membersSnapshot.docs.map(memberDoc => createNotification(db, memberDoc.data().uid, {
        type: 'post',
        relatedId: snapshot.id,
        senderId: authorId,
        senderName: authorData.name,
        senderAvatar: authorData.avatar,
        targetScope: allianceId,
        contentPreview: text.substring(0, 100),
    }));
    await Promise.all(notificationPromises);
    functions.logger.info(`✅ Created ${notificationPromises.length} notifications for alliance post`);
    return null;
});
// ============================================================================
// COMMENT NOTIFICATIONS
// ============================================================================
/**
 * Triggers when a new comment is created on a global post
 * Creates notification for the post author
 */
exports.onGlobalCommentCreate = functions.firestore
    .document('globalPosts/{postId}/comments/{commentId}')
    .onCreate(async (snapshot, context) => {
    const { postId } = context.params;
    const commentData = snapshot.data();
    const commenterId = commentData.authorUid;
    const text = commentData.text || '';
    functions.logger.info(`💬 New comment on global post ${postId} from ${commenterId}`);
    if (!text.trim()) {
        return null;
    }
    const db = admin.firestore();
    // Get post author
    const postDoc = await db.collection('globalPosts').doc(postId).get();
    if (!postDoc.exists) {
        return null;
    }
    const postAuthorId = postDoc.data().authorUid;
    // Don't notify if commenter is the post author
    if (commenterId === postAuthorId) {
        return null;
    }
    const commenterData = await getUserData(db, commenterId);
    await createNotification(db, postAuthorId, {
        type: 'comment',
        relatedId: `${postId}/comments/${snapshot.id}`,
        senderId: commenterId,
        senderName: commenterData.name,
        senderAvatar: commenterData.avatar,
        targetScope: 'public',
        contentPreview: text.substring(0, 100),
    });
    functions.logger.info(`✅ Created notification for post author ${postAuthorId}`);
    return null;
});
/**
 * Triggers when a new comment is created on an alliance post
 * Creates notification for the post author
 */
exports.onAllianceCommentCreate = functions.firestore
    .document('alliances/{allianceId}/posts/{postId}/comments/{commentId}')
    .onCreate(async (snapshot, context) => {
    const { allianceId, postId } = context.params;
    const commentData = snapshot.data();
    const commenterId = commentData.authorUid;
    const text = commentData.text || '';
    functions.logger.info(`💬 New comment on alliance post ${postId} from ${commenterId}`);
    if (!text.trim()) {
        return null;
    }
    const db = admin.firestore();
    // Get post author
    const postDoc = await db.collection(`alliances/${allianceId}/posts`).doc(postId).get();
    if (!postDoc.exists) {
        return null;
    }
    const postAuthorId = postDoc.data().authorUid;
    // Don't notify if commenter is the post author
    if (commenterId === postAuthorId) {
        return null;
    }
    const commenterData = await getUserData(db, commenterId);
    await createNotification(db, postAuthorId, {
        type: 'comment',
        relatedId: `${postId}/comments/${snapshot.id}`,
        senderId: commenterId,
        senderName: commenterData.name,
        senderAvatar: commenterData.avatar,
        targetScope: allianceId,
        contentPreview: text.substring(0, 100),
    });
    functions.logger.info(`✅ Created notification for post author ${postAuthorId}`);
    return null;
});
// ============================================================================
// REACTION NOTIFICATIONS
// ============================================================================
/**
 * Triggers when a new reaction is created on a global post
 * Creates notification for the post author
 */
exports.onGlobalPostReactionCreate = functions.firestore
    .document('globalPosts/{postId}/reactions/{reactionId}')
    .onCreate(async (snapshot, context) => {
    const { postId } = context.params;
    const reactionData = snapshot.data();
    const reactorId = reactionData.uid;
    const emoji = reactionData.emoji || '👍';
    functions.logger.info(`❤️ New reaction on global post ${postId} from ${reactorId}`);
    const db = admin.firestore();
    // Get post author
    const postDoc = await db.collection('globalPosts').doc(postId).get();
    if (!postDoc.exists) {
        return null;
    }
    const postAuthorId = postDoc.data().authorUid;
    // Don't notify if reactor is the post author
    if (reactorId === postAuthorId) {
        return null;
    }
    const reactorData = await getUserData(db, reactorId);
    await createNotification(db, postAuthorId, {
        type: 'reaction',
        relatedId: postId,
        senderId: reactorId,
        senderName: reactorData.name,
        senderAvatar: reactorData.avatar,
        targetScope: 'public',
        contentPreview: `Reacted with ${emoji}`,
    });
    functions.logger.info(`✅ Created reaction notification for post author ${postAuthorId}`);
    return null;
});
/**
 * Triggers when a new reaction is created on an alliance post
 * Creates notification for the post author
 */
exports.onAlliancePostReactionCreate = functions.firestore
    .document('alliances/{allianceId}/posts/{postId}/reactions/{reactionId}')
    .onCreate(async (snapshot, context) => {
    const { allianceId, postId } = context.params;
    const reactionData = snapshot.data();
    const reactorId = reactionData.uid;
    const emoji = reactionData.emoji || '👍';
    functions.logger.info(`❤️ New reaction on alliance post ${postId} from ${reactorId}`);
    const db = admin.firestore();
    // Get post author
    const postDoc = await db.collection(`alliances/${allianceId}/posts`).doc(postId).get();
    if (!postDoc.exists) {
        return null;
    }
    const postAuthorId = postDoc.data().authorUid;
    // Don't notify if reactor is the post author
    if (reactorId === postAuthorId) {
        return null;
    }
    const reactorData = await getUserData(db, reactorId);
    await createNotification(db, postAuthorId, {
        type: 'reaction',
        relatedId: postId,
        senderId: reactorId,
        senderName: reactorData.name,
        senderAvatar: reactorData.avatar,
        targetScope: allianceId,
        contentPreview: `Reacted with ${emoji}`,
    });
    functions.logger.info(`✅ Created reaction notification for post author ${postAuthorId}`);
    return null;
});
