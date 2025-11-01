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
exports.toggleReaction = exports.addComment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Cloud Function to securely add comments with notifications and rewards
 */
exports.addComment = functions.https.onCall(async (data) => {
    try {
        const { allianceId, postId, text, replyToCommentId } = data;
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Comment text cannot be empty');
        }
        if (text.length > 1000) {
            throw new functions.https.HttpsError('invalid-argument', 'Comment text too long');
        }
        // Get user info from context (assuming it's passed from client)
        const userId = data.userId; // This should be passed from client
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID required');
        }
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const senderName = userData?.displayName || userData?.username || 'User';
        const senderAvatar = userData?.photoURL || '';
        // Determine collection path
        const isGlobalPost = allianceId === 'global';
        const commentRef = isGlobalPost
            ? db.collection(`globalPosts/${postId}/comments`).doc()
            : db.collection(`alliances/${allianceId}/posts/${postId}/comments`).doc();
        const postRef = isGlobalPost
            ? db.collection('globalPosts').doc(postId)
            : db.collection('alliances').doc(allianceId).collection('posts').doc(postId);
        const now = admin.firestore.Timestamp.now();
        const commentData = {
            id: commentRef.id,
            postId,
            allianceId,
            authorUid: userId,
            text: text.trim(),
            ...(replyToCommentId && { replyToCommentId }),
            reactionCounts: {},
            createdAt: now,
            updatedAt: now,
        };
        // Execute transaction
        await db.runTransaction(async (transaction) => {
            // Verify post exists
            const postSnap = await transaction.get(postRef);
            if (!postSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Post not found');
            }
            // If replying to a comment, verify it exists
            if (replyToCommentId) {
                const replyRef = isGlobalPost
                    ? db.collection(`globalPosts/${postId}/comments`).doc(replyToCommentId)
                    : db.collection(`alliances/${allianceId}/posts/${postId}/comments`).doc(replyToCommentId);
                const replySnap = await transaction.get(replyRef);
                if (!replySnap.exists) {
                    throw new functions.https.HttpsError('not-found', 'Comment to reply to not found');
                }
            }
            // Create comment
            transaction.set(commentRef, commentData);
            // Update post comment count
            transaction.update(postRef, {
                commentCount: admin.firestore.FieldValue.increment(1),
                updatedAt: now
            });
        });
        // Create notifications
        await createCommentNotifications(allianceId, postId, commentRef.id, userId, senderName, senderAvatar, replyToCommentId);
        // Award daily reward
        await awardDailyReward(userId, replyToCommentId ? 'comment_reply' : 'comment', 10);
        return {
            ok: true,
            commentId: commentRef.id,
            createdAt: now.toDate().toISOString()
        };
    }
    catch (error) {
        console.error('Error in addComment function:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to add comment');
    }
});
/**
 * Cloud Function to securely toggle reactions with notifications and rewards
 */
exports.toggleReaction = functions.https.onCall(async (data) => {
    try {
        const { allianceId, targetType, targetId, type } = data;
        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID required');
        }
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const senderName = userData?.displayName || userData?.username || 'User';
        const senderAvatar = userData?.photoURL || '';
        // Determine target path
        const getTargetPath = () => {
            const isGlobalPost = allianceId === 'global';
            if (targetType === 'post') {
                return isGlobalPost
                    ? `globalPosts/${targetId}`
                    : `alliances/${allianceId}/posts/${targetId}`;
            }
            else if (targetType === 'comment') {
                const parts = targetId.split('/');
                if (parts.length === 3 && parts[1] === 'comments') {
                    const postId = parts[0];
                    const commentId = parts[2];
                    return isGlobalPost
                        ? `globalPosts/${postId}/comments/${commentId}`
                        : `alliances/${allianceId}/posts/${postId}/comments/${commentId}`;
                }
                throw new functions.https.HttpsError('invalid-argument', 'Invalid comment targetId format');
            }
            throw new functions.https.HttpsError('invalid-argument', 'Invalid target type');
        };
        const targetPath = getTargetPath();
        const targetRef = db.doc(targetPath);
        const reactionRef = db.doc(`${targetPath}/reactions/${userId}`);
        let action = 'added';
        // Execute transaction
        await db.runTransaction(async (transaction) => {
            const targetSnap = await transaction.get(targetRef);
            if (!targetSnap.exists) {
                throw new functions.https.HttpsError('not-found', `${targetType} not found`);
            }
            const currentReactionSnap = await transaction.get(reactionRef);
            const currentReaction = currentReactionSnap.exists ? currentReactionSnap.data() : null;
            const targetData = targetSnap.data();
            const currentCounts = targetData?.reactionCounts || {};
            if (currentReaction) {
                if (currentReaction.type === type) {
                    // Remove reaction
                    transaction.delete(reactionRef);
                    const newCount = Math.max(0, (currentCounts[type] || 0) - 1);
                    const updatedCounts = { ...currentCounts };
                    if (newCount === 0)
                        delete updatedCounts[type];
                    transaction.update(targetRef, {
                        reactionCounts: updatedCounts,
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                    action = 'removed';
                }
                else {
                    // Change reaction
                    const newReaction = {
                        uid: userId,
                        type,
                        targetType,
                        targetId,
                        createdAt: admin.firestore.Timestamp.now(),
                    };
                    transaction.set(reactionRef, newReaction);
                    const updatedCounts = { ...currentCounts };
                    updatedCounts[currentReaction.type] = Math.max(0, (updatedCounts[currentReaction.type] || 0) - 1);
                    if (updatedCounts[currentReaction.type] === 0)
                        delete updatedCounts[currentReaction.type];
                    updatedCounts[type] = (updatedCounts[type] || 0) + 1;
                    transaction.update(targetRef, {
                        reactionCounts: updatedCounts,
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                    action = 'changed';
                }
            }
            else {
                // Add new reaction
                const newReaction = {
                    uid: userId,
                    type,
                    targetType,
                    targetId,
                    createdAt: admin.firestore.Timestamp.now(),
                };
                transaction.set(reactionRef, newReaction);
                const updatedCounts = {
                    ...currentCounts,
                    [type]: (currentCounts[type] || 0) + 1
                };
                transaction.update(targetRef, {
                    reactionCounts: updatedCounts,
                    updatedAt: admin.firestore.Timestamp.now()
                });
                action = 'added';
            }
        });
        // Create notifications
        await createReactionNotifications(allianceId, targetType, targetId, userId, senderName, senderAvatar, action);
        // Award daily reward for reaction
        await awardDailyReward(userId, 'reaction', 10);
        return { ok: true, action };
    }
    catch (error) {
        console.error('Error in toggleReaction function:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to toggle reaction');
    }
});
/**
 * Create notifications for comments
 */
async function createCommentNotifications(allianceId, postId, commentId, authorUid, senderName, senderAvatar, replyToCommentId) {
    const notifications = [];
    const now = admin.firestore.Timestamp.now();
    try {
        // Get post data
        const isGlobalPost = allianceId === 'global';
        const postRef = isGlobalPost
            ? db.collection('globalPosts').doc(postId)
            : db.collection('alliances').doc(allianceId).collection('posts').doc(postId);
        const postSnap = await postRef.get();
        if (!postSnap.exists)
            return;
        const postData = postSnap.data();
        if (replyToCommentId) {
            // Notify the comment author being replied to
            const replyRef = isGlobalPost
                ? db.collection(`globalPosts/${postId}/comments`).doc(replyToCommentId)
                : db.collection(`alliances/${allianceId}/posts/${postId}/comments`).doc(replyToCommentId);
            const replySnap = await replyRef.get();
            if (replySnap.exists) {
                const replyData = replySnap.data();
                if (replyData.authorUid !== authorUid) {
                    notifications.push({
                        type: 'comment_reply',
                        relatedId: commentId,
                        postId,
                        senderId: authorUid,
                        senderName,
                        senderAvatar,
                        targetScope: allianceId === 'global' ? 'public' : allianceId,
                        contentPreview: `Replied to your comment: ${replyData.text.substring(0, 50)}...`,
                        timestamp: now,
                        isRead: false,
                        recipientId: replyData.authorUid,
                    });
                }
            }
        }
        // Notify post author (if not the commenter and not already notified)
        if (postData.authorUid !== authorUid && !notifications.some(n => n.recipientId === postData.authorUid)) {
            notifications.push({
                type: replyToCommentId ? 'comment_reply' : 'comment',
                relatedId: commentId,
                postId,
                senderId: authorUid,
                senderName,
                senderAvatar,
                targetScope: allianceId === 'global' ? 'public' : allianceId,
                contentPreview: replyToCommentId ? 'Someone replied to a comment on your post' : 'Someone commented on your post',
                timestamp: now,
                isRead: false,
                recipientId: postData.authorUid,
            });
        }
        // Save notifications
        const batch = db.batch();
        notifications.forEach(notification => {
            const notifRef = db.collection('allianceNotifications').doc();
            batch.set(notifRef, notification);
        });
        if (notifications.length > 0) {
            await batch.commit();
        }
    }
    catch (error) {
        console.error('Error creating comment notifications:', error);
    }
}
/**
 * Create notifications for reactions
 */
async function createReactionNotifications(allianceId, targetType, targetId, reactorUid, senderName, senderAvatar, action) {
    if (action === 'removed')
        return; // Don't notify for removed reactions
    try {
        const now = admin.firestore.Timestamp.now();
        // Get target data
        const isGlobalPost = allianceId === 'global';
        let targetRef;
        let contentOwnerUid;
        if (targetType === 'post') {
            targetRef = isGlobalPost
                ? db.collection('globalPosts').doc(targetId)
                : db.collection('alliances').doc(allianceId).collection('posts').doc(targetId);
        }
        else {
            // Extract postId and commentId from targetId
            const parts = targetId.split('/');
            const postId = parts[0];
            const commentId = parts[2];
            targetRef = isGlobalPost
                ? db.collection(`globalPosts/${postId}/comments`).doc(commentId)
                : db.collection(`alliances/${allianceId}/posts/${postId}/comments`).doc(commentId);
        }
        const targetSnap = await targetRef.get();
        if (!targetSnap.exists)
            return;
        const targetData = targetSnap.data();
        contentOwnerUid = targetData?.authorUid;
        if (!contentOwnerUid || contentOwnerUid === reactorUid)
            return;
        // Create notification
        const notification = {
            type: 'reaction',
            relatedId: targetId,
            senderId: reactorUid,
            senderName,
            senderAvatar,
            targetScope: allianceId === 'global' ? 'public' : allianceId,
            contentPreview: `Someone reacted to your ${targetType}`,
            timestamp: now,
            isRead: false,
            recipientId: contentOwnerUid,
        };
        await db.collection('allianceNotifications').doc().set(notification);
    }
    catch (error) {
        console.error('Error creating reaction notifications:', error);
    }
}
/**
 * Award daily rewards for user activities
 */
async function awardDailyReward(userId, activityType, points) {
    try {
        const now = admin.firestore.Timestamp.now();
        const today = new Date(now.toDate());
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
        const userRewardsRef = db.collection('allianceUsers').doc(userId);
        // Check if user already got reward for this activity today
        const existingRewardQuery = await userRewardsRef
            .collection('dailyRewards')
            .where('activityType', '==', activityType)
            .where('date', '>=', todayTimestamp)
            .limit(1)
            .get();
        if (!existingRewardQuery.empty) {
            return; // Already rewarded today for this activity
        }
        // Get current rewards earned
        const userDoc = await userRewardsRef.get();
        const currentRewards = userDoc.exists ? (userDoc.data()?.stats?.rewardsEarned || 0) : 0;
        const newRewardsTotal = currentRewards + points;
        // Create reward activity record
        const rewardActivityRef = userRewardsRef.collection('dailyRewards').doc();
        await rewardActivityRef.set({
            activityType,
            points,
            uid: userId,
            createdAt: now,
            date: todayTimestamp,
            id: rewardActivityRef.id,
        });
        // Update total rewards
        await userRewardsRef.set({
            stats: {
                rewardsEarned: newRewardsTotal,
                lastActivity: now,
            }
        }, { merge: true });
        // Create transaction record
        const transactionRef = userRewardsRef.collection('transactions').doc();
        await transactionRef.set({
            type: 'reward',
            source: activityType,
            amount: points,
            description: `Daily reward for ${activityType}`,
            createdAt: now,
            balanceAfter: newRewardsTotal,
        });
    }
    catch (error) {
        console.error('Error awarding daily reward:', error);
    }
}
