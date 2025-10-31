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
exports.DEFAULT_LANGUAGE = exports.SUPPORTED_LANGUAGES = void 0;
exports.getUserLanguage = getUserLanguage;
exports.translateNotificationText = translateNotificationText;
exports.sendInternationalizedNotification = sendInternationalizedNotification;
exports.sendInternationalizedNotificationsToUsers = sendInternationalizedNotificationsToUsers;
exports.sendInternationalizedNotificationToAllUsers = sendInternationalizedNotificationToAllUsers;
exports.sendInternationalizedNotificationToPlans = sendInternationalizedNotificationToPlans;
exports.getLanguageDistribution = getLanguageDistribution;
const admin = __importStar(require("firebase-admin"));
const translate_1 = require("@google-cloud/translate");
const translate = new translate_1.v2.Translate();
// Supported languages mapping
exports.SUPPORTED_LANGUAGES = {
    'en': 'English',
    'ar': 'العربية',
    'fr': 'Français',
    'tr': 'Türkçe',
    'zh-CN': '中文'
};
// Default language fallback
exports.DEFAULT_LANGUAGE = 'en';
/**
 * Get user's preferred language from their profile
 * @param userId - User ID to check
 * @returns User's language preference or default
 */
async function getUserLanguage(userId) {
    try {
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userLanguage = userData?.language || userData?.preferredLanguage;
            if (userLanguage && exports.SUPPORTED_LANGUAGES[userLanguage]) {
                return userLanguage;
            }
        }
        return exports.DEFAULT_LANGUAGE;
    }
    catch (error) {
        console.warn(`⚠️ Failed to get language for user ${userId}:`, error);
        return exports.DEFAULT_LANGUAGE;
    }
}
/**
 * Translate notification content to user's language
 * @param text - Text to translate
 * @param targetLanguage - Target language code
 * @param fallbackText - Fallback text if translation fails
 * @returns Translated text or fallback
 */
async function translateNotificationText(text, targetLanguage, fallbackText) {
    // Don't translate if target language is English (source language)
    if (targetLanguage === 'en') {
        return text;
    }
    try {
        const [translated] = await translate.translate(text, targetLanguage);
        const translatedText = Array.isArray(translated) ? translated[0] : translated;
        // Validate translation result
        if (translatedText && translatedText.trim() && translatedText !== text) {
            console.log(`✅ Translated to ${targetLanguage}: "${text}" → "${translatedText}"`);
            return translatedText;
        }
        else {
            console.warn(`⚠️ Translation returned empty or same text for ${targetLanguage}`);
            return fallbackText || text;
        }
    }
    catch (error) {
        console.error(`❌ Translation failed for ${targetLanguage}:`, error);
        return fallbackText || text;
    }
}
/**
 * Send internationalized notification to a single user
 * @param userId - User ID to send notification to
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Success status
 */
async function sendInternationalizedNotification(userId, title, body, data, skipUserCollection = false) {
    try {
        // Get user's language preference
        const userLanguage = await getUserLanguage(userId);
        // Translate notification content first
        const translatedTitle = await translateNotificationText(title, userLanguage, title);
        const translatedBody = await translateNotificationText(body, userLanguage, body);
        // Add in-app notification to user's collection with TRANSLATED text (unless skipped)
        if (!skipUserCollection) {
            try {
                await admin.firestore().collection("users").doc(userId).collection("notifications").add({
                    type: data?.type || 'system',
                    title: translatedTitle, // Store TRANSLATED title
                    body: translatedBody, // Store TRANSLATED body
                    read: false,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    link: data?.link,
                    data: {
                        ...data,
                        originalTitle: title, // Store original English for reference
                        originalBody: body, // Store original English for reference
                        userLanguage, // Store user's language
                        translated: 'true' // Mark as translated
                    }
                });
                console.log(`✅ Added translated in-app notification to user ${userId}'s collection in ${userLanguage}`);
            }
            catch (error) {
                console.error(`❌ Failed to add in-app notification for user ${userId}:`, error);
            }
        }
        // Get user's FCM token
        const tokenDoc = await admin.firestore().collection('userTokens').doc(userId).get();
        if (!tokenDoc.exists || !tokenDoc.data()?.token) {
            console.warn(`⚠️ No FCM token found for user ${userId}`);
            // Still return true since in-app notification was created
            return true;
        }
        const token = tokenDoc.data().token;
        // Prepare notification message with translated content
        const message = {
            notification: {
                title: translatedTitle,
                body: translatedBody,
            },
            token,
            data: {
                ...data,
                originalTitle: title, // Store original for reference
                originalBody: body,
                userLanguage,
                translated: 'true'
            }
        };
        // Send notification
        await admin.messaging().send(message);
        console.log(`✅ Internationalized notification sent to user ${userId} in ${userLanguage}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send internationalized notification to user ${userId}:`, error);
        return false;
    }
}
/**
 * Send internationalized notification to multiple users
 * @param userIds - Array of user IDs
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Object with success and failure counts
 */
async function sendInternationalizedNotificationsToUsers(userIds, title, body, data) {
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    console.log(`🌍 Sending internationalized notifications to ${userIds.length} users...`);
    // Process users in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
            try {
                const userLanguage = await getUserLanguage(userId);
                // Translate notification content first
                const translatedTitle = await translateNotificationText(title, userLanguage, title);
                const translatedBody = await translateNotificationText(body, userLanguage, body);
                // Add in-app notification to user's collection with TRANSLATED text
                try {
                    await admin.firestore().collection("users").doc(userId).collection("notifications").add({
                        type: data?.type || 'system',
                        title: translatedTitle, // Store TRANSLATED title
                        body: translatedBody, // Store TRANSLATED body
                        read: false,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        link: data?.link,
                        data: {
                            ...data,
                            originalTitle: title, // Store original English for reference
                            originalBody: body, // Store original English for reference
                            userLanguage, // Store user's language
                            translated: 'true' // Mark as translated
                        }
                    });
                    console.log(`✅ Added translated in-app notification to user ${userId}'s collection in ${userLanguage}`);
                }
                catch (error) {
                    console.error(`❌ Failed to add in-app notification for user ${userId}:`, error);
                }
                // Send push notification (this will also add to notifications, but we've already done it above)
                const success = await sendInternationalizedNotification(userId, title, body, data, true); // Skip user collection to avoid duplicates
                results.push({ userId, success, language: userLanguage });
                if (success) {
                    successCount++;
                }
                else {
                    failureCount++;
                }
                return { userId, success, language: userLanguage };
            }
            catch (error) {
                console.error(`❌ Error processing user ${userId}:`, error);
                results.push({ userId, success: false });
                failureCount++;
                return { userId, success: false };
            }
        });
        // Wait for batch to complete before moving to next batch
        await Promise.allSettled(batchPromises);
        // Small delay between batches to be respectful to external services
        if (i + batchSize < userIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    console.log(`✅ Internationalized notifications completed: ${successCount} success, ${failureCount} failures`);
    return { successCount, failureCount, results };
}
/**
 * Send internationalized notification to all users with language detection
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Object with success and failure counts
 */
async function sendInternationalizedNotificationToAllUsers(title, body, data) {
    try {
        // Get all users
        const usersSnapshot = await admin.firestore().collection('users').get();
        const userIds = usersSnapshot.docs.map(doc => doc.id);
        console.log(`🌍 Sending internationalized notification to all ${userIds.length} users...`);
        const result = await sendInternationalizedNotificationsToUsers(userIds, title, body, data);
        return {
            successCount: result.successCount,
            failureCount: result.failureCount,
            totalUsers: userIds.length
        };
    }
    catch (error) {
        console.error('❌ Failed to send internationalized notification to all users:', error);
        return { successCount: 0, failureCount: 0, totalUsers: 0 };
    }
}
/**
 * Send internationalized notification to users by subscription plan
 * @param selectedPlans - Array of plan names to target
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Object with success and failure counts
 */
async function sendInternationalizedNotificationToPlans(selectedPlans, title, body, data) {
    try {
        // Get users with matching subscription plans
        const usersSnapshot = await admin.firestore().collection('users').get();
        const userIds = [];
        usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data();
            const userPlan = userData.membership?.planName;
            // Check if user's plan matches any of the selected plans
            const planMatches = selectedPlans.some((selectedPlan) => {
                const exactMatch = selectedPlan === userPlan;
                const caseInsensitiveMatch = selectedPlan.toLowerCase() === userPlan?.toLowerCase();
                return exactMatch || caseInsensitiveMatch;
            });
            if (planMatches) {
                userIds.push(userDoc.id);
            }
        });
        console.log(`🌍 Sending internationalized notification to ${userIds.length} users with plans: ${selectedPlans.join(', ')}`);
        if (userIds.length === 0) {
            return { successCount: 0, failureCount: 0, totalUsers: 0 };
        }
        const result = await sendInternationalizedNotificationsToUsers(userIds, title, body, data);
        return {
            successCount: result.successCount,
            failureCount: result.failureCount,
            totalUsers: userIds.length
        };
    }
    catch (error) {
        console.error('❌ Failed to send internationalized notification to plans:', error);
        return { successCount: 0, failureCount: 0, totalUsers: 0 };
    }
}
/**
 * Get language statistics for notification recipients
 * @param userIds - Array of user IDs
 * @returns Object with language distribution
 */
async function getLanguageDistribution(userIds) {
    const languageCounts = {};
    for (const userId of userIds) {
        const language = await getUserLanguage(userId);
        languageCounts[language] = (languageCounts[language] || 0) + 1;
    }
    return languageCounts;
}
