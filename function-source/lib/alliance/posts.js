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
exports.createPost = exports.getPosts = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Cloud Function to securely fetch posts and comments
 * Implements rate limiting and proper data filtering
 */
exports.getPosts = functions.https.onCall(async (data, context) => {
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
        const posts = [];
        const postIds = [];
        const comments = {};
        // Process posts
        postsSnapshot.docs.slice(0, 20).forEach(doc => {
            const postData = doc.data();
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
                const commentData = doc.data();
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
    }
    catch (error) {
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
exports.createPost = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        console.error('Error in createPost function:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create post');
    }
});
