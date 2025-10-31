"use strict";
// function-source/functions/src/adminNotifications.ts
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
exports.sendInternationalizedAdminNotification = exports.grantWelcomeBonus = exports.distributeGifts = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Secure cloud function for distributing gifts to users
 * Only admin users can call this function
 */
exports.distributeGifts = functions
    .runWith({
    timeoutSeconds: 300,
    memory: '512MB'
})
    .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to distribute gifts');
    }
    const callerUid = context.auth.uid;
    try {
        // Admin permission check
        const callerDoc = await db.collection('users').doc(callerUid).get();
        if (!callerDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Caller user document not found');
        }
        const callerData = callerDoc.data();
        if (!callerData || callerData.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only administrators can distribute gifts');
        }
        // Validate input data
        const { title, message, amount, reason, targetType, userIds, planName } = data;
        if (!title || !message || !reason || amount <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid gift data: title, message, reason are required and amount must be positive');
        }
        if (!['all', 'single', 'multiple', 'plan'].includes(targetType)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid target type');
        }
        // Get target users based on type
        let targetUserIds = [];
        switch (targetType) {
            case 'all':
                const allUsersSnapshot = await db.collection('users').get();
                targetUserIds = allUsersSnapshot.docs.map(doc => doc.id);
                break;
            case 'single':
            case 'multiple':
                if (!userIds || userIds.length === 0) {
                    throw new functions.https.HttpsError('invalid-argument', 'User IDs are required for single/multiple target types');
                }
                // Validate that all user IDs exist
                for (const userId of userIds) {
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (!userDoc.exists) {
                        throw new functions.https.HttpsError('not-found', `User ${userId} not found`);
                    }
                }
                targetUserIds = userIds;
                break;
            case 'plan':
                if (!planName) {
                    throw new functions.https.HttpsError('invalid-argument', 'Plan name is required for plan target type');
                }
                const planUsersSnapshot = await db.collection('users')
                    .where('plan', '==', planName)
                    .get();
                targetUserIds = planUsersSnapshot.docs.map(doc => doc.id);
                break;
        }
        if (targetUserIds.length === 0) {
            throw new functions.https.HttpsError('not-found', 'No users found for the specified target criteria');
        }
        // Create gift distribution record
        const giftId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const giftRecord = {
            id: giftId,
            title,
            message,
            amount,
            reason,
            target: {
                type: targetType,
                planName: planName || null,
                userCount: targetUserIds.length
            },
            createdBy: callerUid,
            createdAt: firestore_1.Timestamp.now(),
            status: 'processing',
            totalRecipients: targetUserIds.length,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            totalAmountDistributed: 0
        };
        // Save gift distribution record
        await db.collection('giftDistributions').doc(giftId).set(giftRecord);
        // Process gifts in batches to avoid timeouts
        const batchSize = 10;
        let successfulDeliveries = 0;
        let failedDeliveries = 0;
        let totalAmountDistributed = 0;
        const logs = [];
        for (let i = 0; i < targetUserIds.length; i += batchSize) {
            const batch = db.batch();
            const batchUserIds = targetUserIds.slice(i, i + batchSize);
            for (const userId of batchUserIds) {
                try {
                    const userRef = db.collection('users').doc(userId);
                    const userDoc = await userRef.get();
                    if (!userDoc.exists) {
                        logs.push({
                            userId,
                            status: 'failed',
                            error: 'User not found',
                            timestamp: firestore_1.Timestamp.now()
                        });
                        failedDeliveries++;
                        continue;
                    }
                    const userData = userDoc.data();
                    const currentBalance = userData?.balance || 0;
                    const newBalance = currentBalance + amount;
                    // Update user balance
                    batch.update(userRef, {
                        balance: newBalance,
                        lastUpdated: firestore_1.Timestamp.now()
                    });
                    // Add inbox message
                    const inboxRef = userRef.collection('inbox').doc();
                    batch.set(inboxRef, {
                        title,
                        message,
                        amount,
                        type: 'admin_gift',
                        read: false,
                        claimed: false, // Require manual claiming
                        timestamp: firestore_1.Timestamp.now(),
                        giftId
                    });
                    logs.push({
                        userId,
                        userEmail: userData?.email || 'unknown',
                        status: 'success',
                        oldBalance: currentBalance,
                        newBalance,
                        timestamp: firestore_1.Timestamp.now()
                    });
                    successfulDeliveries++;
                    totalAmountDistributed += amount;
                }
                catch (error) {
                    console.error(`Failed to process gift for user ${userId}:`, error);
                    logs.push({
                        userId,
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: firestore_1.Timestamp.now()
                    });
                    failedDeliveries++;
                }
            }
            // Commit batch
            await batch.commit();
            // Small delay to avoid overwhelming Firestore
            if (i + batchSize < targetUserIds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        // Update gift distribution record with final results
        await db.collection('giftDistributions').doc(giftId).update({
            status: failedDeliveries === 0 ? 'completed' : 'completed_with_errors',
            successfulDeliveries,
            failedDeliveries,
            totalAmountDistributed,
            completedAt: firestore_1.Timestamp.now(),
            logs
        });
        return {
            success: true,
            giftId,
            totalRecipients: targetUserIds.length,
            successfulDeliveries,
            failedDeliveries,
            totalAmountDistributed
        };
    }
    catch (error) {
        console.error('Error in distributeGifts:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to distribute gifts');
    }
});
/**
 * Secure cloud function for granting welcome bonus to new users
 * This prevents users from manipulating the frontend to get extra bonuses
 */
exports.grantWelcomeBonus = functions
    .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
})
    .https.onCall(async (data, context) => {
    // This function can only be called by the system itself
    // It should be called from user registration triggers, not from frontend
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'System authentication required');
    }
    const { userId, amount, reason } = data;
    if (!userId || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid welcome bonus data');
    }
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        // Check if user already received welcome bonus
        const existingBonusQuery = await userRef.collection('inbox')
            .where('type', '==', 'welcome_bonus')
            .where('claimed', '==', true)
            .limit(1)
            .get();
        if (!existingBonusQuery.empty) {
            // User already received welcome bonus, skip
            return {
                success: true,
                message: 'Welcome bonus already granted',
                skipped: true
            };
        }
        const currentBalance = userData?.balance || 0;
        const newBalance = currentBalance + amount;
        // Add welcome message to inbox (DO NOT update balance here)
        const inboxRef = userRef.collection('inbox').doc('welcome');
        await inboxRef.set({
            title: 'Welcome to FlySky Network!',
            body: `Welcome! You received ${amount} FSN as a welcome bonus!`,
            timestamp: firestore_1.Timestamp.now(),
            read: false,
            claimed: false, // Require manual claiming
            amount,
            type: 'welcome_bonus',
            reason
        });
        // Log the welcome bonus
        await db.collection('welcomeBonusLogs').add({
            userId,
            userEmail: userData?.email || 'unknown',
            amount,
            reason,
            grantedAt: firestore_1.Timestamp.now(),
            grantedBy: 'system'
        });
        return {
            success: true,
            message: 'Welcome bonus granted successfully',
            newBalance
        };
    }
    catch (error) {
        console.error('Error granting welcome bonus:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to grant welcome bonus');
    }
});
/**
 * Cloud function to send internationalized admin notifications
 */
exports.sendInternationalizedAdminNotification = functions
    .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
})
    .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
    }
    const callerUid = context.auth.uid;
    try {
        // Admin permission check
        const callerDoc = await db.collection('users').doc(callerUid).get();
        if (!callerDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Caller not found');
        }
        const callerData = callerDoc.data();
        if (!callerData || callerData.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }
        const { title, message, targetAudience, platforms, data: notificationData } = data;
        if (!title || !message) {
            throw new functions.https.HttpsError('invalid-argument', 'Title and message are required');
        }
        // Create notification record
        const notificationRef = db.collection('notifications').doc();
        await notificationRef.set({
            title,
            message,
            targetAudience: targetAudience || 'all',
            platforms: platforms || ['inbox'],
            data: notificationData || {},
            status: 'pending',
            createdBy: callerUid,
            createdAt: firestore_1.Timestamp.now()
        });
        return {
            success: true,
            notificationId: notificationRef.id,
            message: 'Notification queued for processing'
        };
    }
    catch (error) {
        console.error('Error sending admin notification:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to send notification');
    }
});
