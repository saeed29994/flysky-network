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
exports.notifyMiningComplete = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translateText_1 = require("../utils/translateText");
// Ensure Firebase is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();
// Convert to HTTP function for direct calls (similar to sendInternationalizedAdminNotification)
exports.notifyMiningComplete = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    try {
        const data = req.body;
        // Validate request data
        if (!data.userId) {
            res.status(400).json({ error: 'Missing required field: userId' });
            return;
        }
        const uid = data.userId;
        // Get user data
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        const user = userSnap.data();
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Get FCM tokens from multiple sources for better compatibility
        let fcmTokens = [];
        // First, try to get tokens from user document
        if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
            fcmTokens = [...user.fcmTokens];
            console.log(`Found ${fcmTokens.length} tokens in user document for user ${uid}`);
        }
        // If no tokens found in user document, try userTokens collection
        if (fcmTokens.length === 0) {
            try {
                const tokenDoc = await db.collection("userTokens").doc(uid).get();
                if (tokenDoc.exists && tokenDoc.data()?.token) {
                    fcmTokens = [tokenDoc.data().token];
                    console.log(`Found token in userTokens collection for user ${uid}`);
                }
            }
            catch (error) {
                console.warn(`Error checking userTokens collection for user ${uid}:`, error);
            }
        }
        const lang = user.language || "en";
        const defaultTitle = "⛏️ Mining Complete!";
        const defaultBody = "You can now claim your FSN reward. Open the app to claim it.";
        // ✅ Translate texts if language is not English
        const translatedTitle = lang === "en" ? defaultTitle : await (0, translateText_1.translateText)(defaultTitle, lang);
        const translatedBody = lang === "en" ? defaultBody : await (0, translateText_1.translateText)(defaultBody, lang);
        const messaging = admin.messaging();
        let successCount = 0;
        let errorCount = 0;
        // ✅ Send FCM notification to each token
        for (const token of fcmTokens) {
            try {
                await messaging.send({
                    token,
                    notification: {
                        title: translatedTitle,
                        body: translatedBody,
                    },
                    webpush: {
                        fcmOptions: {
                            link: "https://fsncrew.io/dashboard",
                        },
                    },
                    data: {
                        type: 'mining_complete',
                        userId: uid,
                        link: '/mining',
                        timestamp: Date.now().toString()
                    }
                });
                successCount++;
                console.log(`✅ FCM notification sent successfully to token for user ${uid}`);
            }
            catch (err) {
                errorCount++;
                console.error(`❌ Failed to send FCM notification to token for user ${uid}:`, err);
                // Remove invalid tokens
                if (err.code === 'messaging/registration-token-not-registered') {
                    try {
                        // Remove from user document if it exists there
                        if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
                            await db.collection("users").doc(uid).update({
                                fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                            });
                            console.log(`🗑️ Removed invalid token from user document for user ${uid}`);
                        }
                        // Remove from userTokens collection if it exists there
                        const tokenDoc = await db.collection("userTokens").doc(uid).get();
                        if (tokenDoc.exists && tokenDoc.data()?.token === token) {
                            await db.collection("userTokens").doc(uid).delete();
                            console.log(`🗑️ Removed invalid token from userTokens collection for user ${uid}`);
                        }
                    }
                    catch (cleanupError) {
                        console.error(`❌ Error cleaning up invalid token for user ${uid}:`, cleanupError);
                    }
                }
            }
        }
        console.log(`✅ Mining notification processing complete for user ${uid}: ${successCount} successful, ${errorCount} failed`);
        // ✅ Add to the user's notifications collection (this is the main notification system)
        await db.collection("users").doc(uid).collection("notifications").add({
            type: "claim_reward",
            title: translatedTitle,
            body: translatedBody,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            link: "/mining", // Link to mining page
            data: {
                miningCompleted: true,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }
        });
        // Log the notification creation
        console.log(`✅ In-app notification added to user ${uid}'s notifications collection`);
        // Return success response
        res.status(200).json({
            success: true,
            fcmTokensFound: fcmTokens.length,
            fcmSuccessCount: successCount,
            fcmErrorCount: errorCount,
            inAppNotificationCreated: true,
            userLanguage: lang,
            translatedTitle,
            translatedBody
        });
    }
    catch (error) {
        console.error('❌ Error in notifyMiningComplete:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});
