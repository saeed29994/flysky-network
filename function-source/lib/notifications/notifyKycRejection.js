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
exports.notifyKycRejection = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translateText_1 = require("../utils/translateText");
const fcmUtils_1 = require("../utils/fcmUtils");
// Ensure Firebase is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();
exports.notifyKycRejection = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
    try {
        const userId = context.params.userId;
        const beforeData = change.before.data();
        const afterData = change.after.data();
        // Check if KYC status changed from pending to rejected
        const wasPending = beforeData.kycStatus === 'Pending';
        const isRejected = afterData.kycStatus === 'Not activated' || afterData.kycStatus === 'Not Actived';
        const hasRejectionReason = afterData.kycRejectionReason;
        if (!wasPending || !isRejected || !hasRejectionReason) {
            return; // Not a KYC rejection or no rejection reason
        }
        // Get user's language preference
        const lang = afterData.language || "en";
        // Prepare notification content
        const messageTitle = "KYC Application Rejected";
        const messageBody = `Your KYC application has been rejected. Reason: ${afterData.kycRejectionReason}`;
        // Translate if needed
        const translatedTitle = lang === "en" ? messageTitle : await (0, translateText_1.translateText)(messageTitle, lang);
        const translatedBody = lang === "en" ? messageBody : await (0, translateText_1.translateText)(messageBody, lang);
        // Add to user's inbox
        const inboxRef = db.collection(`users/${userId}/inbox`);
        await inboxRef.add({
            title: translatedTitle,
            message: translatedBody,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            type: 'kyc_rejection',
            read: false,
            kycRejectionReason: afterData.kycRejectionReason,
            kycRejectionDate: afterData.kycRejectionDate
        });
        // Add to user's notifications collection
        await (0, fcmUtils_1.addUserNotification)(userId, {
            type: "kyc_rejection",
            title: translatedTitle,
            body: translatedBody,
            link: "/kyc",
            data: {
                kycRejectionReason: afterData.kycRejectionReason,
                kycRejectionDate: afterData.kycRejectionDate
            }
        });
        // Get FCM tokens and send push notification
        const fcmTokens = await (0, fcmUtils_1.getFcmTokens)(userId, afterData);
        if (fcmTokens.length > 0) {
            const result = await (0, fcmUtils_1.sendFcmNotifications)(fcmTokens, {
                title: translatedTitle,
                body: translatedBody,
                data: {
                    type: "kyc_rejection",
                    kycRejectionReason: afterData.kycRejectionReason,
                    kycRejectionDate: afterData.kycRejectionDate?.toDate?.()?.toISOString() || new Date().toISOString(),
                },
                webpush: {
                    fcmOptions: {
                        link: "https://fsncrew.io/kyc",
                    },
                },
            }, userId, afterData);
            console.log(`✅ KYC rejection notification sent for user ${userId}: ${result.successCount} successful, ${result.errorCount} failed`);
        }
        console.log(`✅ KYC rejection notification processed for user ${userId}`);
    }
    catch (error) {
        console.error("❌ Error sending KYC rejection notification:", error);
    }
});
