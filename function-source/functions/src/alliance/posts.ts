import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface Post {
  id: string;
  allianceId: string;
  authorUid: string;
  text: string;
  attachments?: any[];
  visibility: string;
  commentCount: number;
  reactionCounts: Record<string, number>;
  pinned: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

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

interface GetPostsRequest {
  allianceId: string;
  daysToLoad?: number;
  cursor?: string;
}

interface GetPostsResponse {
  posts: (Post & { createdAtDate: string })[];
  comments: Record<string, (Comment & { createdAtDate: string })[]>;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Cloud Function to securely fetch posts and comments
 * Implements rate limiting and proper data filtering
 */
export const getPosts = functions.https.onCall(async (data: GetPostsRequest, context): Promise<GetPostsResponse> => {
  try {
    const { allianceId, daysToLoad = 7, cursor } = data;

    // Rate limiting: Allow max 10 requests per minute per user
    if (context.auth?.uid) {
      const rateLimitRef = db.collection('rateLimits').doc(`posts_${context.auth.uid}`);
      const rateLimitDoc = await rateLimitRef.get();
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute window

      if (rateLimitDoc.exists) {
        const rateData = rateLimitDoc.data();
        if (rateData && rateData.requests > 10 && rateData.windowStart > windowStart) {
          throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.');
        }
      }

      // Update rate limit
      await rateLimitRef.set({
        requests: admin.firestore.FieldValue.increment(1),
        windowStart: now,
        lastRequest: now
      }, { merge: true });
    }

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysToLoad);
    dateThreshold.setHours(0, 0, 0, 0);

    // Determine collection path
    const postsRef = allianceId === 'global'
      ? db.collection('globalPosts')
      : db.collection('alliances').doc(allianceId).collection('posts');

    // Build query
    let query = postsRef
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateThreshold))
      .orderBy('createdAt', 'desc')
      .limit(21); // 20 + 1 for pagination check

    if (cursor) {
      const cursorDoc = await postsRef.doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const postsSnapshot = await query.get();

    const posts: (Post & { createdAtDate: string })[] = [];
    const postIds: string[] = [];
    const comments: Record<string, (Comment & { createdAtDate: string })[]> = {};

    // Process posts
    postsSnapshot.docs.slice(0, 20).forEach(doc => {
      const postData = doc.data() as Post;
      posts.push({
        ...postData,
        id: doc.id,
        createdAtDate: postData.createdAt.toDate().toISOString()
      });
      postIds.push(doc.id);
    });

    // Fetch comments for each post
    for (const postId of postIds) {
      const commentsRef = allianceId === 'global'
        ? db.collection(`globalPosts/${postId}/comments`)
        : db.collection(`alliances/${allianceId}/posts/${postId}/comments`);

      const commentsQuery = commentsRef
        .orderBy('createdAt', 'asc')
        .limit(50);

      const commentsSnapshot = await commentsQuery.get();

      comments[postId] = commentsSnapshot.docs.map(doc => {
        const commentData = doc.data() as Comment;
        return {
          ...commentData,
          id: doc.id,
          createdAtDate: commentData.createdAt.toDate().toISOString()
        };
      });
    }

    // Check if there are more posts
    const hasMore = postsSnapshot.docs.length > 20;
    const nextCursor = hasMore ? postsSnapshot.docs[19].id : undefined;

    return {
      posts,
      comments,
      hasMore,
      nextCursor
    };

  } catch (error) {
    console.error('Error in getPosts function:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch posts');
  }
});

/**
 * Cloud Function to create a new post
 */
export const createPost = functions.https.onCall(async (data: {
  allianceId: string;
  text: string;
  attachments?: any[];
  visibility?: string;
}, context) => {
  // Authentication required for posting
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create posts');
  }

  try {
    const { allianceId, text, attachments = [], visibility = 'public' } = data;

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Post text cannot be empty');
    }

    if (text.length > 2000) {
      throw new functions.https.HttpsError('invalid-argument', 'Post text too long');
    }

    // For alliance posts, check membership
    if (allianceId !== 'global') {
      const memberRef = db.collection('alliances').doc(allianceId).collection('members').doc(context.auth.uid);
      const memberDoc = await memberRef.get();
      if (!memberDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this alliance');
      }
    }

    // Create post document
    const postsRef = allianceId === 'global'
      ? db.collection('globalPosts')
      : db.collection('alliances').doc(allianceId).collection('posts');

    const postRef = postsRef.doc();
    const now = admin.firestore.Timestamp.now();

    const postData = {
      allianceId,
      authorUid: context.auth.uid,
      text: text.trim(),
      attachments,
      visibility,
      commentCount: 0,
      reactionCounts: {},
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };

    await postRef.set(postData);

    return {
      ok: true,
      postId: postRef.id,
      createdAt: now.toDate().toISOString()
    };

  } catch (error) {
   console.error('Error in createPost function:', error);
   if (error instanceof functions.https.HttpsError) {
     throw error;
   }
   throw new functions.https.HttpsError('internal', 'Failed to create post');
 }
});

/**
* Cloud Function to securely update a post
*/
export const updatePost = functions.https.onCall(async (data: {
 postId: string;
 allianceId: string;
 updates: {
   text?: string;
   attachments?: any[];
   visibility?: string;
 };
}, context) => {
 try {
   const { postId, allianceId, updates } = data;
   const callerUid = context.auth?.uid;

   if (!callerUid) {
     throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
   }

   const db = admin.firestore();

   // Determine collection path
   const postsRef = allianceId === 'global'
     ? db.collection('globalPosts')
     : db.collection('alliances').doc(allianceId).collection('posts');

   const postRef = postsRef.doc(postId);
   const postDoc = await postRef.get();

   if (!postDoc.exists) {
     throw new functions.https.HttpsError('not-found', 'Post not found');
   }

   const postData = postDoc.data()!;

   // Check ownership
   if (postData.authorUid !== callerUid) {
     throw new functions.https.HttpsError('permission-denied', 'Only post author can update post');
   }

   // Validate updates
   if (updates.text && (updates.text.trim().length === 0 || updates.text.length > 2000)) {
     throw new functions.https.HttpsError('invalid-argument', 'Invalid post text');
   }

   // Update post
   const updateData = {
     ...updates,
     updatedAt: admin.firestore.FieldValue.serverTimestamp()
   };

   await postRef.update(updateData);

   // Log the update
   const logRef = postsRef.doc(postId).collection('editHistory').doc();
   await logRef.set({
     editorUid: callerUid,
     changes: updates,
     timestamp: admin.firestore.FieldValue.serverTimestamp()
   });

   return { success: true, message: 'Post updated successfully' };

 } catch (error) {
   console.error('Error in updatePost:', error);
   if (error instanceof functions.https.HttpsError) {
     throw error;
   }
   throw new functions.https.HttpsError('internal', 'Failed to update post');
 }
});

/**
* Cloud Function to securely delete a post
*/
export const deletePost = functions.https.onCall(async (data: {
 postId: string;
 allianceId: string;
}, context) => {
 try {
   const { postId, allianceId } = data;
   const callerUid = context.auth?.uid;

   if (!callerUid) {
     throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
   }

   const db = admin.firestore();

   // Determine collection path
   const postsRef = allianceId === 'global'
     ? db.collection('globalPosts')
     : db.collection('alliances').doc(allianceId).collection('posts');

   const postRef = postsRef.doc(postId);
   const postDoc = await postRef.get();

   if (!postDoc.exists) {
     throw new functions.https.HttpsError('not-found', 'Post not found');
   }

   const postData = postDoc.data()!;

   // Check permissions
   const isAuthor = postData.authorUid === callerUid;

   // For alliance posts, check if user can manage
   let canDelete = isAuthor;
   if (!canDelete && allianceId !== 'global') {
     const allianceRef = db.collection('alliances').doc(allianceId);
     const allianceDoc = await allianceRef.get();
     const allianceData = allianceDoc.data()!;

     const isOwner = allianceData.ownerUid === callerUid;
     const isLeader = allianceData.leaderUid === callerUid;

     if (isOwner || isLeader) {
       canDelete = true;
     } else {
       // Check member role
       const memberRef = allianceRef.collection('members').doc(callerUid);
       const memberDoc = await memberRef.get();
       const memberRole = memberDoc.data()?.role;
       canDelete = ['co-leader', 'admin'].includes(memberRole);
     }
   }

   if (!canDelete) {
     throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to delete post');
   }

   // Delete post and all subcollections
   const batch = db.batch();

   // Delete the post
   batch.delete(postRef);

   // Delete all comments
   const commentsRef = postRef.collection('comments');
   const commentsSnap = await commentsRef.get();
   commentsSnap.docs.forEach(doc => batch.delete(doc.ref));

   // Delete all reactions
   const reactionsRef = postRef.collection('reactions');
   const reactionsSnap = await reactionsRef.get();
   reactionsSnap.docs.forEach(doc => batch.delete(doc.ref));

   await batch.commit();

   // Log the deletion
   const logRef = postsRef.doc('deletionLog').collection('entries').doc();
   await logRef.set({
     postId,
     deletedBy: callerUid,
     reason: 'user_deleted',
     timestamp: admin.firestore.FieldValue.serverTimestamp()
   });

   return { success: true, message: 'Post deleted successfully' };

 } catch (error) {
   console.error('Error in deletePost:', error);
   if (error instanceof functions.https.HttpsError) {
     throw error;
   }
   throw new functions.https.HttpsError('internal', 'Failed to delete post');
 }
});