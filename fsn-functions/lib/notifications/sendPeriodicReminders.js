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
exports.sendDailyReminders = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translateText_1 = require("../utils/translateText");
// Ensure Firebase is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();
// Helper function to get FCM tokens from multiple sources
async function getFcmTokens(userId, userData) {
    let fcmTokens = [];
    // First, try to get tokens from user document
    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        fcmTokens = [...userData.fcmTokens];
    }
    // If no tokens found in user document, try userTokens collection
    if (fcmTokens.length === 0) {
        try {
            const tokenDoc = await db.collection("userTokens").doc(userId).get();
            if (tokenDoc.exists && tokenDoc.data()?.token) {
                fcmTokens = [tokenDoc.data().token];
            }
        }
        catch (error) {
            console.warn(`Error checking userTokens collection for user ${userId}:`, error);
        }
    }
    return fcmTokens;
}
// Scheduled function to run once a day
exports.sendDailyReminders = functions.pubsub
    .schedule('0 12 * * *') // Run at 12:00 PM every day
    .timeZone('UTC')
    .onRun(async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        const oneDayAgo = new Date(now.toMillis() - 24 * 60 * 60 * 1000);
        // Get users who haven't mined in the last 24 hours
        const usersRef = db.collection('users');
        const usersSnap = await usersRef.get();
        // Counter for logging
        let miningRemindersCount = 0;
        let stakingRemindersCount = 0;
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            // Get FCM tokens from multiple sources
            const fcmTokens = await getFcmTokens(userId, userData);
            // Skip users without FCM tokens
            if (fcmTokens.length === 0) {
                continue;
            }
            const lang = userData.language || 'en';
            const userTimezone = userData.timezone || 'UTC';
            // Check mining activity
            if (!userData.lastMiningTime ||
                userData.lastMiningTime.toMillis() < oneDayAgo.getTime()) {
                // Check if user already received a mining reminder recently (within last 24 hours)
                const recentMiningRemindersQuery = await db.collection("users").doc(userId).collection("notifications")
                    .where('type', '==', 'mining_reminder')
                    .where('timestamp', '>=', oneDayAgo)
                    .limit(1)
                    .get();
                if (recentMiningRemindersQuery.empty) {
                    // User hasn't received a mining reminder recently, send one
                    await sendMiningReminder(userId, fcmTokens, lang, userData);
                    miningRemindersCount++;
                }
                else {
                    console.log(`ℹ️ User ${userId} already received a mining reminder recently, skipping`);
                }
            }
            // Check staking activity - optional based on plan
            if (userData.plan &&
                (userData.plan === 'business' ||
                    userData.plan === 'first-6' ||
                    userData.plan === 'first-lifetime')) {
                // Check if user has any active staking
                // Use the correct subcollection path: users/{userId}/staking
                const stakingQuery = await db.collection("users").doc(userId).collection("staking")
                    .where('status', '==', 'active')
                    .limit(1)
                    .get();
                if (stakingQuery.empty) {
                    // Check if user already received a staking reminder recently (within last 24 hours)
                    const recentStakingRemindersQuery = await db.collection("users").doc(userId).collection("notifications")
                        .where('type', '==', 'staking_reminder')
                        .where('timestamp', '>=', oneDayAgo)
                        .limit(1)
                        .get();
                    if (recentStakingRemindersQuery.empty) {
                        // User hasn't received a staking reminder recently, send one
                        await sendStakingReminder(userId, fcmTokens, lang, userData);
                        stakingRemindersCount++;
                    }
                    else {
                        console.log(`ℹ️ User ${userId} already received a staking reminder recently, skipping`);
                    }
                }
            }
        }
        console.log(`✅ Sent ${miningRemindersCount} mining reminders and ${stakingRemindersCount} staking reminders`);
        return null;
    }
    catch (error) {
        console.error('❌ Error sending periodic reminders:', error);
        return null;
    }
});
// Helper function to send mining reminder
async function sendMiningReminder(userId, fcmTokens, lang, userData) {
    try {
        const defaultTitle = "⛏️ Daily Mining Reminder";
        const defaultBody = "Don't forget to mine today to earn your daily FSN rewards!";
        const translatedTitle = lang === "en" ? defaultTitle : await (0, translateText_1.translateText)(defaultTitle, lang);
        const translatedBody = lang === "en" ? defaultBody : await (0, translateText_1.translateText)(defaultBody, lang);
        await db.collection("users").doc(userId).collection("notifications").add({
            type: "mining_reminder",
            title: translatedTitle,
            body: translatedBody,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            link: "/mining"
        });
        // Send FCM notifications
        const messaging = admin.messaging();
        let successCount = 0;
        let errorCount = 0;
        for (const token of fcmTokens) {
            try {
                await messaging.send({
                    token,
                    notification: {
                        title: translatedTitle,
                        body: translatedBody,
                    },
                    data: {
                        type: "mining_reminder"
                    },
                    webpush: {
                        fcmOptions: {
                            link: "https://fsncrew.io/mining",
                        },
                    },
                });
                successCount++;
            }
            catch (err) {
                errorCount++;
                console.error(`❌ Failed to send mining reminder to token for user ${userId}:`, err);
                // Remove invalid tokens
                if (err.code === 'messaging/registration-token-not-registered') {
                    try {
                        // Remove from user document if it exists there
                        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                            await db.collection("users").doc(userId).update({
                                fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                            });
                        }
                        // Remove from userTokens collection if it exists there
                        const tokenDoc = await db.collection("userTokens").doc(userId).get();
                        if (tokenDoc.exists && tokenDoc.data()?.token === token) {
                            await db.collection("userTokens").doc(userId).delete();
                        }
                    }
                    catch (cleanupError) {
                        console.error(`❌ Error cleaning up invalid token for user ${userId}:`, cleanupError);
                    }
                }
            }
        }
        console.log(`✅ Mining reminder sent to user ${userId}: ${successCount} successful, ${errorCount} failed`);
    }
    catch (error) {
        console.error("❌ Error in sendMiningReminder:", error);
    }
}
// Helper function to send staking reminder
async function sendStakingReminder(userId, fcmTokens, lang, userData) {
    try {
        const defaultTitle = "💰 Staking Opportunity";
        const defaultBody = "Boost your FSN rewards by staking your tokens today!";
        const translatedTitle = lang === "en" ? defaultTitle : await (0, translateText_1.translateText)(defaultTitle, lang);
        const translatedBody = lang === "en" ? defaultBody : await (0, translateText_1.translateText)(defaultBody, lang);
        await db.collection("users").doc(userId).collection("notifications").add({
            type: "staking_reminder",
            title: translatedTitle,
            body: translatedBody,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            link: "/staking"
        });
        // Send FCM notifications
        const messaging = admin.messaging();
        let successCount = 0;
        let errorCount = 0;
        for (const token of fcmTokens) {
            try {
                await messaging.send({
                    token,
                    notification: {
                        title: translatedTitle,
                        body: translatedBody,
                    },
                    data: {
                        type: "staking_reminder"
                    },
                    webpush: {
                        fcmOptions: {
                            link: "https://fsncrew.io/staking",
                        },
                    },
                });
                successCount++;
            }
            catch (err) {
                errorCount++;
                console.error(`❌ Failed to send staking reminder to token for user ${userId}:`, err);
                // Remove invalid tokens
                if (err.code === 'messaging/registration-token-not-registered') {
                    try {
                        // Remove from user document if it exists there
                        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                            await db.collection("users").doc(userId).update({
                                fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                            });
                        }
                        // Remove from userTokens collection if it exists there
                        const tokenDoc = await db.collection("userTokens").doc(userId).get();
                        if (tokenDoc.exists && tokenDoc.data()?.token === token) {
                            await db.collection("userTokens").doc(userId).delete();
                        }
                    }
                    catch (cleanupError) {
                        console.error(`❌ Error cleaning up invalid token for user ${userId}:`, cleanupError);
                    }
                }
            }
        }
        console.log(`✅ Staking reminder sent to user ${userId}: ${successCount} successful, ${errorCount} failed`);
    }
    catch (error) {
        console.error("❌ Error in sendStakingReminder:", error);
    }
}
