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
exports.sendInternationalizedAdminNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const internationalizedNotifications_1 = require("./utils/internationalizedNotifications");
/**
 * Enhanced admin notification function with internationalization support
 * This function automatically detects user languages and translates notifications
 */
exports.sendInternationalizedAdminNotification = functions.https.onRequest(async (req, res) => {
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
        // Check if the user is authenticated and has admin privileges
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - No valid token provided' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        }
        catch (error) {
            res.status(401).json({ error: 'Unauthorized - Invalid token' });
            return;
        }
        // Check admin privileges in users collection
        const userSnapshot = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        if (!userSnapshot.exists) {
            res.status(403).json({ error: 'User not found' });
            return;
        }
        const userData = userSnapshot.data();
        if (userData?.role !== 'admin') {
            res.status(403).json({ error: 'User does not have admin privileges' });
            return;
        }
        // Validate request data
        if (!data.title || !data.message || !data.platforms || data.platforms.length === 0) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        // Clean up undefined values to prevent Firestore errors
        const cleanData = {
            title: data.title,
            message: data.message,
            targetAudience: data.targetAudience || 'all',
            platforms: data.platforms,
            type: data.type || 'info',
            selectedPlans: data.selectedPlans || [],
            customUserIds: data.customUserIds || [],
            data: data.data || {}
        };
        // Remove undefined values
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                delete cleanData[key];
            }
        });
        const processingStartTime = Date.now();
        const notificationRef = admin.firestore().collection('notifications').doc();
        const logRef = admin.firestore().collection('notificationLogs').doc();
        // Create notification document with internationalization metadata
        const notificationData = {
            title: cleanData.title,
            message: cleanData.message,
            type: cleanData.type,
            status: 'processing',
            targetAudience: cleanData.targetAudience,
            platforms: cleanData.platforms,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: decodedToken.uid,
            data: cleanData.data,
            // Add internationalization fields
            internationalized: true,
            sourceLanguage: 'en', // Admin sends in English
            // Add delivery status fields
            deliveryStatus: 'pending',
            deliveryDetails: {
                totalRecipients: 0,
                successfulDeliveries: 0,
                failedDeliveries: 0
            }
        };
        // Only add titleKey and bodyKey if they exist and are not undefined
        if (data.titleKey) {
            notificationData.titleKey = data.titleKey;
        }
        if (data.bodyKey) {
            notificationData.bodyKey = data.bodyKey;
        }
        await notificationRef.set(notificationData);
        console.log(`🌍 Starting internationalized notification delivery for ${notificationRef.id}`);
        console.log(`🔍 Target Audience: ${cleanData.targetAudience}`);
        console.log(`🔍 Selected Plans:`, cleanData.selectedPlans);
        console.log(`🔍 Custom User IDs:`, cleanData.customUserIds);
        let notificationResult;
        let userIds = [];
        // Send internationalized notifications based on target audience
        if (cleanData.targetAudience === 'all') {
            // Send to all users with automatic language detection
            notificationResult = await (0, internationalizedNotifications_1.sendInternationalizedNotificationToAllUsers)(cleanData.title, cleanData.message, cleanData.data);
            // Get total user count for logging
            const usersSnapshot = await admin.firestore().collection('users').get();
            userIds = usersSnapshot.docs.map(doc => doc.id);
        }
        else if (cleanData.targetAudience === 'plans' && cleanData.selectedPlans.length > 0) {
            // Send to users with specific subscription plans
            notificationResult = await (0, internationalizedNotifications_1.sendInternationalizedNotificationToPlans)(cleanData.selectedPlans, cleanData.title, cleanData.message, cleanData.data);
            // Get user IDs for the selected plans
            const usersSnapshot = await admin.firestore().collection('users').get();
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                const userPlan = userData.membership?.planName;
                const planMatches = cleanData.selectedPlans.some((selectedPlan) => {
                    const exactMatch = selectedPlan === userPlan;
                    const caseInsensitiveMatch = selectedPlan.toLowerCase() === userPlan?.toLowerCase();
                    return exactMatch || caseInsensitiveMatch;
                });
                if (planMatches) {
                    userIds.push(userDoc.id);
                }
            });
        }
        else if (cleanData.targetAudience === 'custom' && cleanData.customUserIds.length > 0) {
            // Send to specific custom users
            userIds = cleanData.customUserIds;
            notificationResult = await (0, internationalizedNotifications_1.sendInternationalizedNotificationsToUsers)(userIds, cleanData.title, cleanData.message, cleanData.data);
        }
        else if (cleanData.targetAudience === 'new') {
            // Users created in the last 7 days
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const usersSnapshot = await admin.firestore().collection('users').get();
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                if (userData.createdAt?.toDate() >= oneWeekAgo) {
                    userIds.push(userDoc.id);
                }
            });
            if (userIds.length > 0) {
                notificationResult = await (0, internationalizedNotifications_1.sendInternationalizedNotificationsToUsers)(userIds, cleanData.title, cleanData.message, cleanData.data);
            }
        }
        else if (cleanData.targetAudience === 'inactive') {
            // Users not active in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const usersSnapshot = await admin.firestore().collection('users').get();
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                if (userData.lastLogin?.toDate() <= thirtyDaysAgo) {
                    userIds.push(userDoc.id);
                }
            });
            if (userIds.length > 0) {
                notificationResult = await (0, internationalizedNotifications_1.sendInternationalizedNotificationsToUsers)(userIds, cleanData.title, cleanData.message, cleanData.data);
            }
        }
        // Handle case where no users were found
        if (!notificationResult || (userIds.length === 0 && cleanData.targetAudience !== 'all')) {
            console.warn(`⚠️ No users found for target audience: ${cleanData.targetAudience}`);
            await Promise.all([
                notificationRef.update({
                    status: 'failed',
                    error: 'No users found for the target audience',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    deliveryStatus: 'failed',
                    deliveryDetails: {
                        totalRecipients: 0,
                        successfulDeliveries: 0,
                        failedDeliveries: 0,
                        errorMessage: 'No users found for the target audience'
                    }
                }),
                logRef.set({
                    notificationId: notificationRef.id,
                    title: cleanData.title,
                    message: cleanData.message,
                    status: 'failed',
                    error: 'No users found for the target audience',
                    targetAudience: cleanData.targetAudience,
                    platforms: cleanData.platforms,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    processingTime: Date.now() - processingStartTime,
                    recipients: 0,
                    successCount: 0,
                    errorCount: 0
                })
            ]);
            res.status(200).json({
                success: false,
                error: 'No users found for the target audience',
                notificationId: notificationRef.id
            });
            return;
        }
        // Get language distribution for analytics
        const languageDistribution = await (0, internationalizedNotifications_1.getLanguageDistribution)(userIds);
        console.log(`🌍 Language distribution:`, languageDistribution);
        // Handle inbox notifications if platform includes 'inbox'
        if (cleanData.platforms.includes('inbox')) {
            console.log(`📥 Adding notification to ${userIds.length} user inboxes`);
            const inboxBatch = admin.firestore().batch();
            for (const userId of userIds) {
                const inboxRef = admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('inbox')
                    .doc();
                const inboxData = {
                    title: cleanData.title,
                    message: cleanData.message,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                    type: cleanData.type,
                    data: cleanData.data,
                    notificationId: notificationRef.id,
                    internationalized: true
                };
                inboxBatch.set(inboxRef, inboxData);
            }
            await inboxBatch.commit();
        }
        // Determine notification status based on results
        const successCount = notificationResult.successCount || 0;
        const failureCount = notificationResult.failureCount || 0;
        const totalRecipients = notificationResult.totalUsers || userIds.length;
        let notificationStatus = 'sent';
        let deliveryStatus = 'delivered';
        let errorMessage = null;
        if (successCount === 0) {
            notificationStatus = 'failed';
            deliveryStatus = 'failed';
            errorMessage = 'All notification attempts failed';
        }
        else if (failureCount > 0) {
            notificationStatus = 'sent';
            deliveryStatus = 'partial_success';
            errorMessage = `${failureCount} notifications failed to deliver`;
        }
        else {
            notificationStatus = 'sent';
            deliveryStatus = 'delivered';
        }
        console.log(`✅ Internationalized notification ${notificationRef.id}: ${successCount} successful, ${failureCount} failed (Status: ${notificationStatus})`);
        console.log(`🌍 Languages served:`, Object.keys(languageDistribution).join(', '));
        // Update notification status and log results
        await Promise.all([
            notificationRef.update({
                status: notificationStatus,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                recipients: totalRecipients,
                opened: 0,
                clicked: 0,
                successCount,
                errorCount: failureCount,
                error: errorMessage,
                deliveryStatus: deliveryStatus,
                deliveryDetails: {
                    totalRecipients,
                    successfulDeliveries: successCount,
                    failedDeliveries: failureCount,
                    errorMessage: errorMessage,
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    languageDistribution
                },
                // Add internationalization metadata
                languageDistribution,
                totalLanguages: Object.keys(languageDistribution).length
            }),
            logRef.set({
                notificationId: notificationRef.id,
                title: data.title,
                message: data.message,
                status: errorMessage ? 'partial_success' : 'success',
                targetAudience: data.targetAudience || 'all',
                platforms: data.platforms,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                processingTime: Date.now() - processingStartTime,
                recipients: totalRecipients,
                successCount,
                errorCount: failureCount,
                error: errorMessage,
                // Add internationalization metadata
                internationalized: true,
                languageDistribution,
                totalLanguages: Object.keys(languageDistribution).length
            })
        ]);
        res.status(200).json({
            success: successCount > 0,
            notificationId: notificationRef.id,
            recipients: totalRecipients,
            successCount,
            errorCount: failureCount,
            status: notificationStatus,
            deliveryStatus: deliveryStatus,
            error: errorMessage,
            // Add internationalization information
            internationalized: true,
            languageDistribution,
            totalLanguages: Object.keys(languageDistribution).length,
            processingTime: Date.now() - processingStartTime
        });
    }
    catch (err) {
        console.error(`❌ Error sending internationalized admin notification:`, err);
        res.status(500).json({
            success: false,
            error: `Error sending notification: ${err.message}`
        });
    }
});
