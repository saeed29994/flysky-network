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
exports.getFcmTokens = getFcmTokens;
exports.sendFcmNotifications = sendFcmNotifications;
exports.addUserNotification = addUserNotification;
exports.addInboxMessage = addInboxMessage;
const admin = __importStar(require("firebase-admin"));
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
async function getFcmTokens(userId, userData) {
    let fcmTokens = [];
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
                fcmTokens = [tokenDoc.data().token];
                console.log(`Found token in userTokens collection for user ${userId}`);
            }
        }
        catch (error) {
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
async function sendFcmNotifications(tokens, notification, userId, userData) {
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
        }
        catch (err) {
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
async function cleanupInvalidToken(userId, token, userData) {
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
    }
    catch (cleanupError) {
        console.error(`❌ Error cleaning up invalid token for user ${userId}:`, cleanupError);
    }
}
/**
 * Add notification to user's notifications collection
 * @param userId - User ID
 * @param notification - Notification object
 */
async function addUserNotification(userId, notification) {
    try {
        await db.collection("users").doc(userId).collection("notifications").add({
            ...notification,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Added notification to user collection for user ${userId}`);
    }
    catch (error) {
        console.error(`❌ Error adding notification to user collection for user ${userId}:`, error);
    }
}
/**
 * Add message to inbox collection
 * @param inboxMessage - Inbox message object
 */
async function addInboxMessage(inboxMessage) {
    try {
        await db.collection("inbox").add({
            ...inboxMessage,
            read: false,
            claimed: inboxMessage.claimed || false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Added message to inbox for user ${inboxMessage.userId}`);
    }
    catch (error) {
        console.error(`❌ Error adding message to inbox for user ${inboxMessage.userId}:`, error);
    }
}
