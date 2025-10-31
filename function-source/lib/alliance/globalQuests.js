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
exports.onSubmissionReviewed = exports.sendQuestDeadlineReminders = exports.onQuestLaunched = exports.distributeQuestRewards = exports.calculateQuestRankings = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Cloud Function: Calculate Quest Rankings
 * Triggered when a quest status changes to 'completed'
 */
exports.calculateQuestRankings = functions.firestore
    .document('globalQuests/{questId}')
    .onUpdate(async (change, context) => {
    const questId = context.params.questId;
    const before = change.before.data();
    const after = change.after.data();
    // Check if status changed to completed
    if (before.status !== 'completed' && after.status === 'completed') {
        console.log(`Quest ${questId} completed, calculating rankings...`);
        try {
            // 1. Get all approved submissions
            const submissionsRef = admin.firestore()
                .collection(`globalQuests/${questId}/submissions`)
                .where('status', '==', 'approved')
                .orderBy('score', 'desc');
            const submissionsSnap = await submissionsRef.get();
            if (submissionsSnap.empty) {
                console.log('No approved submissions found');
                return;
            }
            // 2. Sort submissions by score
            const submissions = submissionsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // 3. Assign ranks and rewards
            const batch = admin.firestore().batch();
            const rewards = after.rewards;
            submissions.forEach((submission, index) => {
                const rank = index + 1;
                let reward = rewards.participation; // Default reward
                // Determine reward based on rank
                if (rank === 1)
                    reward = rewards.first;
                else if (rank === 2)
                    reward = rewards.second;
                else if (rank === 3)
                    reward = rewards.third;
                // Update submission
                const submissionRef = admin.firestore()
                    .doc(`globalQuests/${questId}/submissions/${submission.id}`);
                batch.update(submissionRef, {
                    rank,
                    reward,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Alliance ${submission.allianceId}: Rank ${rank}, Reward ${reward} FSN`);
            });
            // 4. Update completed count
            const questRef = admin.firestore().doc(`globalQuests/${questId}`);
            batch.update(questRef, {
                completedCount: submissions.length,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // 5. Commit updates
            await batch.commit();
            // 6. Send ranking notifications
            await sendRankingNotifications(questId, submissions, rewards, after.title);
            console.log(`Rankings calculated successfully for quest ${questId}`);
        }
        catch (error) {
            console.error('Error calculating rankings:', error);
            throw error;
        }
    }
});
/**
 * Send ranking notifications to alliances
 */
async function sendRankingNotifications(questId, submissions, rewards, questTitle) {
    const batch = admin.firestore().batch();
    for (const submission of submissions) {
        const rank = submission.rank;
        const reward = submission.reward;
        const allianceId = submission.allianceId;
        // Get alliance members
        const membersSnap = await admin.firestore()
            .collection(`alliances/${allianceId}/members`)
            .get();
        // Create notification for each member
        membersSnap.docs.forEach(memberDoc => {
            const notificationRef = admin.firestore()
                .collection('notifications')
                .doc();
            let title = '';
            let body = '';
            if (rank === 1) {
                title = '🥇 Congratulations! 1st Place!';
                body = `Your alliance won 1st place in "${questTitle}" and earned ${reward} FSN!`;
            }
            else if (rank === 2) {
                title = '🥈 Great Job! 2nd Place!';
                body = `Your alliance won 2nd place in "${questTitle}" and earned ${reward} FSN!`;
            }
            else if (rank === 3) {
                title = '🥉 Well Done! 3rd Place!';
                body = `Your alliance won 3rd place in "${questTitle}" and earned ${reward} FSN!`;
            }
            else {
                title = '✅ Quest Completed!';
                body = `Your alliance completed "${questTitle}" and earned ${reward} FSN!`;
            }
            batch.set(notificationRef, {
                id: notificationRef.id,
                uid: memberDoc.id,
                allianceId,
                type: 'quest_completed',
                title,
                body,
                refPath: `globalQuests/${questId}`,
                refId: questId,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    await batch.commit();
}
/**
 * Cloud Function: Distribute Quest Rewards
 * Callable function to distribute FSN rewards to alliance safeboxes
 */
exports.distributeQuestRewards = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify admin permission
    const userDoc = await admin.firestore()
        .doc(`users/${context.auth.uid}`)
        .get();
    if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can distribute rewards');
    }
    const { questId } = data;
    if (!questId) {
        throw new functions.https.HttpsError('invalid-argument', 'Quest ID is required');
    }
    try {
        // Get quest details
        const questDoc = await admin.firestore()
            .doc(`globalQuests/${questId}`)
            .get();
        if (!questDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Quest not found');
        }
        const quest = questDoc.data();
        if (quest?.status !== 'completed') {
            throw new functions.https.HttpsError('failed-precondition', 'Quest must be completed before distributing rewards');
        }
        // Get submissions with rewards
        const submissionsSnap = await admin.firestore()
            .collection(`globalQuests/${questId}/submissions`)
            .where('status', '==', 'approved')
            .where('reward', '>', 0)
            .get();
        if (submissionsSnap.empty) {
            return {
                success: true,
                message: 'No rewards to distribute',
                distributed: 0,
                totalAmount: 0
            };
        }
        const batch = admin.firestore().batch();
        let totalDistributed = 0;
        const distributedAlliances = [];
        // Distribute rewards to alliance safeboxes
        for (const doc of submissionsSnap.docs) {
            const submission = doc.data();
            const allianceId = submission.allianceId;
            const reward = submission.reward;
            // Update alliance safebox balance
            const allianceRef = admin.firestore()
                .doc(`alliances/${allianceId}`);
            batch.update(allianceRef, {
                safeboxBalance: admin.firestore.FieldValue.increment(reward),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Record transaction
            const transactionRef = admin.firestore()
                .collection(`alliances/${allianceId}/transactions`)
                .doc();
            batch.set(transactionRef, {
                id: transactionRef.id,
                type: 'quest_reward',
                amount: reward,
                currency: 'FSN',
                description: `Quest reward - Rank ${submission.rank}: ${quest?.title}`,
                questId,
                rank: submission.rank,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            totalDistributed += reward;
            distributedAlliances.push(allianceId);
        }
        // Mark quest as rewards distributed
        const questRef = admin.firestore().doc(`globalQuests/${questId}`);
        batch.update(questRef, {
            rewardsDistributed: true,
            rewardsDistributedAt: admin.firestore.FieldValue.serverTimestamp(),
            rewardsDistributedBy: context.auth.uid
        });
        await batch.commit();
        console.log(`Distributed ${totalDistributed} FSN to ${submissionsSnap.size} alliances`);
        return {
            success: true,
            message: `Successfully distributed ${totalDistributed} FSN to ${submissionsSnap.size} alliances`,
            distributed: submissionsSnap.size,
            totalAmount: totalDistributed,
            alliances: distributedAlliances
        };
    }
    catch (error) {
        console.error('Error distributing rewards:', error);
        throw new functions.https.HttpsError('internal', 'Failed to distribute rewards: ' + error.message);
    }
});
/**
 * Cloud Function: Send Quest Launch Notifications
 * Triggered when a quest is launched (status changes to 'active')
 */
exports.onQuestLaunched = functions.firestore
    .document('globalQuests/{questId}')
    .onUpdate(async (change, context) => {
    const questId = context.params.questId;
    const before = change.before.data();
    const after = change.after.data();
    // Check if status changed to active
    if (before.status !== 'active' && after.status === 'active') {
        console.log(`Quest ${questId} launched, sending notifications...`);
        try {
            // Get all users (we'll send to all users, not just alliance members)
            const usersSnap = await admin.firestore()
                .collection('users')
                .get();
            if (usersSnap.empty) {
                console.log('No users found');
                return;
            }
            const batch = admin.firestore().batch();
            let notificationCount = 0;
            // Send notification to all users
            for (const userDoc of usersSnap.docs) {
                const userId = userDoc.id;
                // Create notification in user's allianceNotifications subcollection
                const notificationRef = admin.firestore()
                    .collection(`users/${userId}/allianceNotifications`)
                    .doc();
                batch.set(notificationRef, {
                    id: notificationRef.id,
                    type: 'quest_launched',
                    title: '🎯 New Global Quest Available!',
                    message: `"${after.title}" - Compete with all alliances and earn FSN rewards!`,
                    questId,
                    questTitle: after.title,
                    allianceId: '',
                    allianceName: '',
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                notificationCount++;
                // Commit in batches of 500 (Firestore limit)
                if (notificationCount % 500 === 0) {
                    await batch.commit();
                    console.log(`Committed batch of 500 notifications (total: ${notificationCount})`);
                }
            }
            // Commit remaining notifications
            if (notificationCount % 500 !== 0) {
                await batch.commit();
            }
            console.log(`Sent ${notificationCount} notifications for quest ${questId}`);
        }
        catch (error) {
            console.error('Error sending quest launch notifications:', error);
        }
    }
});
/**
 * Cloud Function: Send Quest Deadline Reminders
 * Scheduled to run every hour
 */
exports.sendQuestDeadlineReminders = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
    console.log('Checking for quest deadline reminders...');
    try {
        const now = admin.firestore.Timestamp.now();
        const in24Hours = admin.firestore.Timestamp.fromMillis(now.toMillis() + (24 * 60 * 60 * 1000));
        // Get active quests with deadline in next 24 hours
        const questsSnap = await admin.firestore()
            .collection('globalQuests')
            .where('status', '==', 'active')
            .where('deadline', '>', now)
            .where('deadline', '<=', in24Hours)
            .get();
        if (questsSnap.empty) {
            console.log('No quests with upcoming deadlines');
            return;
        }
        for (const questDoc of questsSnap.docs) {
            const quest = questDoc.data();
            const questId = questDoc.id;
            // Get alliances that haven't submitted yet
            const submissionsSnap = await admin.firestore()
                .collection(`globalQuests/${questId}/submissions`)
                .get();
            const submittedAlliances = new Set(submissionsSnap.docs.map(doc => doc.data().allianceId));
            // Get all active alliances
            const alliancesSnap = await admin.firestore()
                .collection('alliances')
                .where('status', '==', 'active')
                .get();
            const batch = admin.firestore().batch();
            let reminderCount = 0;
            // Send reminders to alliances that haven't submitted
            for (const allianceDoc of alliancesSnap.docs) {
                const allianceId = allianceDoc.id;
                if (submittedAlliances.has(allianceId)) {
                    continue; // Skip alliances that already submitted
                }
                // Get alliance members
                const membersSnap = await admin.firestore()
                    .collection(`alliances/${allianceId}/members`)
                    .get();
                // Create reminder for each member
                membersSnap.docs.forEach(memberDoc => {
                    const notificationRef = admin.firestore()
                        .collection('notifications')
                        .doc();
                    batch.set(notificationRef, {
                        id: notificationRef.id,
                        uid: memberDoc.id,
                        allianceId,
                        type: 'event_reminder',
                        title: '⏰ Quest Deadline Reminder',
                        body: `"${quest.title}" deadline is in 24 hours! Submit now!`,
                        refPath: `globalQuests/${questId}`,
                        refId: questId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    reminderCount++;
                });
            }
            if (reminderCount > 0) {
                await batch.commit();
                console.log(`Sent ${reminderCount} deadline reminders for quest ${questId}`);
            }
        }
    }
    catch (error) {
        console.error('Error sending quest deadline reminders:', error);
    }
});
/**
 * Cloud Function: Send Submission Review Notifications
 * Triggered when a submission is reviewed
 */
exports.onSubmissionReviewed = functions.firestore
    .document('globalQuests/{questId}/submissions/{submissionId}')
    .onUpdate(async (change, context) => {
    const questId = context.params.questId;
    const submissionId = context.params.submissionId;
    const before = change.before.data();
    const after = change.after.data();
    // Check if status changed from pending
    if (before.status === 'pending' && after.status !== 'pending') {
        console.log(`Submission ${submissionId} reviewed, sending notification...`);
        try {
            const allianceId = after.allianceId;
            const status = after.status;
            // Get quest details
            const questDoc = await admin.firestore()
                .doc(`globalQuests/${questId}`)
                .get();
            const quest = questDoc.data();
            // Get alliance members
            const membersSnap = await admin.firestore()
                .collection(`alliances/${allianceId}/members`)
                .get();
            const batch = admin.firestore().batch();
            // Create notification for each member
            membersSnap.docs.forEach(memberDoc => {
                const notificationRef = admin.firestore()
                    .collection('notifications')
                    .doc();
                let title = '';
                let body = '';
                if (status === 'approved') {
                    title = '✅ Submission Approved!';
                    body = `Your submission for "${quest?.title}" has been approved!`;
                }
                else if (status === 'rejected') {
                    title = '❌ Submission Rejected';
                    body = `Your submission for "${quest?.title}" was rejected. ${after.reviewNotes || ''}`;
                }
                else if (status === 'needs_revision') {
                    title = '📝 Revision Needed';
                    body = `Your submission for "${quest?.title}" needs revision. ${after.reviewNotes || ''}`;
                }
                batch.set(notificationRef, {
                    id: notificationRef.id,
                    uid: memberDoc.id,
                    allianceId,
                    type: 'quest_completed',
                    title,
                    body,
                    refPath: `globalQuests/${questId}/submissions/${submissionId}`,
                    refId: submissionId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            console.log(`Sent review notifications for submission ${submissionId}`);
        }
        catch (error) {
            console.error('Error sending submission review notifications:', error);
        }
    }
});
