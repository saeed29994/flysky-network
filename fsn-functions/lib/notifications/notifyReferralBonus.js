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
exports.notifyReferralBonus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translateText_1 = require("../utils/translateText");
// Ensure Firebase is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();
exports.notifyReferralBonus = functions.firestore
    .document("users/{userId}/referrals/{referralId}")
    .onUpdate(async (change, context) => {
    try {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const userId = context.params.userId;
        // Check if status changed to 'verified' or 'claimed'
        if (beforeData.status === afterData.status ||
            (afterData.status !== 'verified' && afterData.status !== 'claimed')) {
            return;
        }
        // Get user data
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            console.log("User not found:", userId);
            return;
        }
        const userData = userSnap.data();
        const fcmTokens = userData.fcmTokens || [];
        const lang = userData.language || "en";
        // Prepare notification content
        const defaultTitle = "🎉 Referral Bonus Ready!";
        const defaultBody = "Your referral has been verified. Your bonus is ready to claim!";
        // Translate if needed
        const translatedTitle = lang === "en" ? defaultTitle : await (0, translateText_1.translateText)(defaultTitle, lang);
        const translatedBody = lang === "en" ? defaultBody : await (0, translateText_1.translateText)(defaultBody, lang);
        // Add to user's notifications collection
        await db.collection("users").doc(userId).collection("notifications").add({
            type: "referral_bonus",
            title: translatedTitle,
            body: translatedBody,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            link: "/referral-program", // Link to referral page
            data: {
                referralId: context.params.referralId,
                amount: afterData.rewardAmount || 0
            }
        });
        // Add to inbox
        await db.collection("inbox").add({
            userId,
            title: translatedTitle,
            body: translatedBody,
            read: false,
            claimed: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            type: "referral_bonus",
            amount: afterData.rewardAmount || 0
        });
        // Send FCM notification
        const messaging = admin.messaging();
        // Send notification to each token
        for (const token of fcmTokens) {
            await messaging
                .send({
                token,
                notification: {
                    title: translatedTitle,
                    body: translatedBody,
                },
                data: {
                    type: "referral_bonus",
                    referralId: context.params.referralId,
                },
                webpush: {
                    fcmOptions: {
                        link: "https://fsncrew.io/referral-program",
                    },
                },
            })
                .catch((err) => {
                console.error("Failed to send FCM notification:", err);
                // Remove invalid tokens
                if (err.code === 'messaging/registration-token-not-registered') {
                    userRef.update({
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                    });
                }
            });
        }
        console.log(`✅ Referral bonus notification sent to user ${userId}`);
    }
    catch (error) {
        console.error("Error sending referral bonus notification:", error);
    }
});
