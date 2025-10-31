import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface Comment {
  id: string;
  postId: string;
  allianceId: string;
  authorUid: string;
  text: string;
  replyToCommentId?: string;
  reactionCounts: Record<string, number>;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface Post {
  id: string;
  allianceId: string;
  authorUid: string;
  text: string;
  createdAt: admin.firestore.Timestamp;
}

interface Notification {
  type: 'comment' | 'comment_reply' | 'reaction' | 'reward';
  relatedId: string;
  postId?: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  targetScope: string;
  contentPreview: string;
  timestamp: admin.firestore.Timestamp;
  isRead: boolean;
  recipientId: string;
}

/**
 * Cloud Function to securely add comments with notifications and rewards
 */
export const addComment = functions.https.onCall(async (data) => {
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

    const commentData: Comment = {
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

  } catch (error) {
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
export const toggleReaction = functions.https.onCall(async (data) => {
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
      } else if (targetType === 'comment') {
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

    let action: 'added' | 'removed' | 'changed' = 'added';

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
          if (newCount === 0) delete updatedCounts[type];
          transaction.update(targetRef, {
            reactionCounts: updatedCounts,
            updatedAt: admin.firestore.Timestamp.now()
          });
          action = 'removed';
        } else {
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
          if (updatedCounts[currentReaction.type] === 0) delete updatedCounts[currentReaction.type];
          updatedCounts[type] = (updatedCounts[type] || 0) + 1;

          transaction.update(targetRef, {
            reactionCounts: updatedCounts,
            updatedAt: admin.firestore.Timestamp.now()
          });
          action = 'changed';
        }
      } else {
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

  } catch (error) {
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
async function createCommentNotifications(
  allianceId: string,
  postId: string,
  commentId: string,
  authorUid: string,
  senderName: string,
  senderAvatar: string,
  replyToCommentId?: string
) {
  const notifications: Notification[] = [];
  const now = admin.firestore.Timestamp.now();

  try {
    // Get post data
    const isGlobalPost = allianceId === 'global';
    const postRef = isGlobalPost
      ? db.collection('globalPosts').doc(postId)
      : db.collection('alliances').doc(allianceId).collection('posts').doc(postId);

    const postSnap = await postRef.get();
    if (!postSnap.exists) return;

    const postData = postSnap.data() as Post;

    if (replyToCommentId) {
      // Notify the comment author being replied to
      const replyRef = isGlobalPost
        ? db.collection(`globalPosts/${postId}/comments`).doc(replyToCommentId)
        : db.collection(`alliances/${allianceId}/posts/${postId}/comments`).doc(replyToCommentId);

      const replySnap = await replyRef.get();
      if (replySnap.exists) {
        const replyData = replySnap.data() as Comment;
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

  } catch (error) {
    console.error('Error creating comment notifications:', error);
  }
}

/**
 * Create notifications for reactions
 */
async function createReactionNotifications(
  allianceId: string,
  targetType: string,
  targetId: string,
  reactorUid: string,
  senderName: string,
  senderAvatar: string,
  action: string
) {
  if (action === 'removed') return; // Don't notify for removed reactions

  try {
    const now = admin.firestore.Timestamp.now();

    // Get target data
    const isGlobalPost = allianceId === 'global';
    let targetRef: admin.firestore.DocumentReference;
    let contentOwnerUid: string;

    if (targetType === 'post') {
      targetRef = isGlobalPost
        ? db.collection('globalPosts').doc(targetId)
        : db.collection('alliances').doc(allianceId).collection('posts').doc(targetId);
    } else {
      // Extract postId and commentId from targetId
      const parts = targetId.split('/');
      const postId = parts[0];
      const commentId = parts[2];

      targetRef = isGlobalPost
        ? db.collection(`globalPosts/${postId}/comments`).doc(commentId)
        : db.collection(`alliances/${allianceId}/posts/${postId}/comments`).doc(commentId);
    }

    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return;

    const targetData = targetSnap.data();
    contentOwnerUid = targetData?.authorUid;

    if (!contentOwnerUid || contentOwnerUid === reactorUid) return;

    // Create notification
    const notification: Notification = {
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

  } catch (error) {
    console.error('Error creating reaction notifications:', error);
  }
}

/**
 * Cloud Function to securely edit a comment
 */
export const editComment = functions.https.onCall(async (data: {
  commentId: string;
  postId: string;
  allianceId: string;
  newText: string;
}, context) => {
  try {
    const { commentId, postId, allianceId, newText } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate input
    if (!newText || newText.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Comment text cannot be empty');
    }

    if (newText.length > 1000) {
      throw new functions.https.HttpsError('invalid-argument', 'Comment text too long');
    }

    const db = admin.firestore();

    // Get comment reference
    const commentRef = allianceId === 'global'
      ? db.collection('globalPosts').doc(postId).collection('comments').doc(commentId)
      : db.collection('alliances').doc(allianceId).collection('posts').doc(postId).collection('comments').doc(commentId);

    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Comment not found');
    }

    const commentData = commentDoc.data()!;

    // Check ownership
    if (commentData.authorUid !== callerUid) {
      throw new functions.https.HttpsError('permission-denied', 'Only comment author can edit comment');
    }

    // Update comment
    await commentRef.update({
      text: newText.trim(),
      edited: true,
      editedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Comment updated successfully' };

  } catch (error) {
    console.error('Error in editComment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to edit comment');
  }
});

/**
 * Award daily rewards for user activities
 */
async function awardDailyReward(userId: string, activityType: string, points: number) {
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

  } catch (error) {
    console.error('Error awarding daily reward:', error);
  }
}