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
exports.getUserDailyRewardsSummary = exports.getUserDailyRewards = exports.initializeAllianceUser = exports.onAllianceMessageReward = exports.onPublicMessageReward = exports.onAlliancePostReactionReward = exports.onGlobalPostReactionReward = exports.onAlliancePostCreateReward = exports.onGlobalPostCreateReward = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
/**
 * Daily Rewards System - Cloud Functions
 *
 * Awards points to users for daily activities:
 * - Creating a post: +10 points (once per day)
 * - Reacting to a post: +10 points (once per day)
 * - Sending a chat message: +10 points (once per day)
 */
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Check if user has already received reward today for a specific activity
 */
async function hasReceivedRewardToday(db, uid, activityType) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // ✅ استخدام allianceUsers بدلاً من users
        const rewardsQuery = db
            .collection('allianceUsers')
            .doc(uid)
            .collection('dailyRewards')
            .where('activityType', '==', activityType)
            .where('date', '>=', today)
            .limit(1);
        const snapshot = await rewardsQuery.get();
        return !snapshot.empty;
    }
    catch (error) {
        functions.logger.error(`Error checking daily reward for ${uid}:`, error);
        return false;
    }
}
/**
 * Award points to user and record the reward
 */
async function awardDailyPoints(db, uid, activityType, points = 10) {
    try {
        // Check if already rewarded today
        const alreadyRewarded = await hasReceivedRewardToday(db, uid, activityType);
        if (alreadyRewarded) {
            functions.logger.info(`⏭️ User ${uid} already received ${activityType} reward today`);
            return false;
        }
        // ✅ استخدام allianceUsers بدلاً من users
        const allianceUsersRef = db.collection('allianceUsers').doc(uid);
        const rewardRef = allianceUsersRef.collection('dailyRewards').doc();
        await db.runTransaction(async (transaction) => {
            const allianceUsersDoc = await transaction.get(allianceUsersRef);
            // إذا لم يكن المستند موجوداً، أنشئه
            if (!allianceUsersDoc.exists) {
                // جلب بيانات المستخدم من users collection
                const userRef = db.collection('users').doc(uid);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found in users collection');
                }
                const userData = userDoc.data();
                // إنشاء مستند جديد في allianceUsers
                transaction.set(allianceUsersRef, {
                    uid,
                    fullName: userData.fullName || userData.displayName || 'Unknown User',
                    avatarUrl: userData.avatarUrl || userData.photoURL || '',
                    email: userData.email || '',
                    boxsafe: points, // النقاط الأولى
                    lastPointsUpdate: firestore_1.FieldValue.serverTimestamp(),
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
            else {
                // تحديث النقاط الموجودة
                const currentBoxsafe = allianceUsersDoc.data()?.boxsafe || 0;
                const newBoxsafe = currentBoxsafe + points;
                transaction.update(allianceUsersRef, {
                    boxsafe: newBoxsafe,
                    lastPointsUpdate: firestore_1.FieldValue.serverTimestamp(),
                });
            }
            // تسجيل المكافأة
            transaction.set(rewardRef, {
                id: rewardRef.id,
                uid,
                activityType,
                points,
                date: firestore_1.FieldValue.serverTimestamp(),
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
        functions.logger.info(`✅ Awarded ${points} points to ${uid} for ${activityType}`);
        return true;
    }
    catch (error) {
        functions.logger.error(`❌ Error awarding points to ${uid}:`, error);
        return false;
    }
}
// ============================================================================
// POST REWARDS
// ============================================================================
/**
 * Award points when user creates a global post
 */
exports.onGlobalPostCreateReward = functions.firestore
    .document('globalPosts/{postId}')
    .onCreate(async (snapshot, context) => {
    const postData = snapshot.data();
    const authorId = postData.authorUid;
    functions.logger.info(`📝 Checking post reward for user ${authorId}`);
    const db = admin.firestore();
    await awardDailyPoints(db, authorId, 'post', 10);
    return null;
});
/**
 * Award points when user creates an alliance post
 */
exports.onAlliancePostCreateReward = functions.firestore
    .document('alliances/{allianceId}/posts/{postId}')
    .onCreate(async (snapshot, context) => {
    const postData = snapshot.data();
    const authorId = postData.authorUid;
    functions.logger.info(`📝 Checking alliance post reward for user ${authorId}`);
    const db = admin.firestore();
    await awardDailyPoints(db, authorId, 'post', 10);
    return null;
});
// ============================================================================
// REACTION REWARDS
// ============================================================================
/**
 * Award points when user reacts to a global post
 */
exports.onGlobalPostReactionReward = functions.firestore
    .document('globalPosts/{postId}/reactions/{reactionId}')
    .onCreate(async (snapshot, context) => {
    const reactionData = snapshot.data();
    const reactorId = reactionData.uid;
    functions.logger.info(`❤️ Checking reaction reward for user ${reactorId}`);
    const db = admin.firestore();
    await awardDailyPoints(db, reactorId, 'reaction', 10);
    return null;
});
/**
 * Award points when user reacts to an alliance post
 */
exports.onAlliancePostReactionReward = functions.firestore
    .document('alliances/{allianceId}/posts/{postId}/reactions/{reactionId}')
    .onCreate(async (snapshot, context) => {
    const reactionData = snapshot.data();
    const reactorId = reactionData.uid;
    functions.logger.info(`❤️ Checking alliance reaction reward for user ${reactorId}`);
    const db = admin.firestore();
    await awardDailyPoints(db, reactorId, 'reaction', 10);
    return null;
});
// ============================================================================
// CHAT REWARDS
// ============================================================================
/**
 * Award points when user sends a message in public room
 */
exports.onPublicMessageReward = functions.firestore
    .document('allianceSystem/publicRoom/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const senderId = messageData.senderUid;
    // Don't reward deleted or empty messages
    if (messageData.isDeleted || !messageData.content?.trim()) {
        return null;
    }
    functions.logger.info(`💬 Checking chat reward for user ${senderId}`);
    const db = admin.firestore();
    await awardDailyPoints(db, senderId, 'chat', 10);
    return null;
});
/**
 * Award points when user sends a message in alliance room
 */
exports.onAllianceMessageReward = functions.firestore
    .document('alliances/{allianceId}/roomMessages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const senderId = messageData.senderUid;
    // Don't reward deleted or empty messages
    if (messageData.isDeleted || !messageData.content?.trim()) {
        return null;
    }
    functions.logger.info(`💬 Checking alliance chat reward for user ${senderId}`);
    const db = admin.firestore();
    await awardDailyPoints(db, senderId, 'chat', 10);
    return null;
});
// ============================================================================
// USER INITIALIZATION
// ============================================================================
/**
 * Initialize or update user in allianceUsers collection
 * Called when user enters alliance system
 */
exports.initializeAllianceUser = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const uid = context.auth.uid;
    const db = admin.firestore();
    try {
        const allianceUsersRef = db.collection('allianceUsers').doc(uid);
        const allianceUsersDoc = await allianceUsersRef.get();
        // إذا كان المستند موجوداً بالفعل، قم بتحديث lastSeen فقط
        if (allianceUsersDoc.exists) {
            await allianceUsersRef.update({
                lastSeen: firestore_1.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`✅ Updated lastSeen for user ${uid} in allianceUsers`);
            return {
                status: 'updated',
                message: 'User already exists in allianceUsers',
                data: allianceUsersDoc.data()
            };
        }
        // إذا لم يكن موجوداً، أنشئ مستند جديد
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found in users collection');
        }
        const userData = userDoc.data();
        const newAllianceUserData = {
            uid,
            fullName: userData.fullName || userData.displayName || 'Unknown User',
            avatarUrl: userData.avatarUrl || userData.photoURL || '',
            email: userData.email || '',
            boxsafe: 0, // البداية بـ 0 نقطة
            lastPointsUpdate: null,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            lastSeen: firestore_1.FieldValue.serverTimestamp(),
        };
        await allianceUsersRef.set(newAllianceUserData);
        functions.logger.info(`✅ Created new allianceUsers document for user ${uid}`);
        return {
            status: 'created',
            message: 'User initialized in allianceUsers',
            data: newAllianceUserData
        };
    }
    catch (error) {
        functions.logger.error(`❌ Error initializing allianceUsers for user ${uid}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An error occurred while initializing user');
    }
});
// ============================================================================
// UTILITY FUNCTIONS (for admin/testing)
// ============================================================================
/**
 * Get user's daily rewards history
 */
exports.getUserDailyRewards = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { uid, days = 7 } = data;
    const targetUid = uid || context.auth.uid;
    const db = admin.firestore();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    // ✅ استخدام allianceUsers بدلاً من users
    const rewardsSnapshot = await db
        .collection('allianceUsers')
        .doc(targetUid)
        .collection('dailyRewards')
        .where('date', '>=', daysAgo)
        .orderBy('date', 'desc')
        .get();
    const rewards = rewardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
    return { rewards };
});
/**
 * Get user's daily rewards summary
 */
exports.getUserDailyRewardsSummary = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const targetUid = data.uid || context.auth.uid;
    const db = admin.firestore();
    // Get today's rewards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // ✅ استخدام allianceUsers بدلاً من users
    const todayRewardsSnapshot = await db
        .collection('allianceUsers')
        .doc(targetUid)
        .collection('dailyRewards')
        .where('date', '>=', today)
        .get();
    const todayRewards = {
        post: false,
        reaction: false,
        chat: false,
        totalPoints: 0,
    };
    todayRewardsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const activityType = data.activityType;
        if (activityType === 'post' || activityType === 'reaction' || activityType === 'chat') {
            todayRewards[activityType] = true;
        }
        todayRewards.totalPoints += data.points || 0;
    });
    // Get user's total points from allianceUsers
    const allianceUsersDoc = await db.collection('allianceUsers').doc(targetUid).get();
    const totalPoints = allianceUsersDoc.exists ? (allianceUsersDoc.data()?.boxsafe || 0) : 0;
    return {
        today: todayRewards,
        totalPoints,
        availableRewards: {
            post: !todayRewards.post,
            reaction: !todayRewards.reaction,
            chat: !todayRewards.chat,
        },
    };
});
