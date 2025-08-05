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
exports.notifyNewMessage = void 0;
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
exports.notifyNewMessage = functions.firestore
    .document("users/{userId}/inbox/{messageId}")
    .onCreate(async (snapshot, context) => {
    try {
        const userId = context.params.userId;
        const messageData = snapshot.data();
        if (messageData.fromNotification)
            return;
        // Get user's language preference
        const userSnap = await db.collection("users").doc(userId).get();
        const userData = userSnap.data();
        if (!userData) {
            console.log("User not found:", userId);
            return;
        }
        // Get FCM tokens using utility function
        const fcmTokens = await (0, fcmUtils_1.getFcmTokens)(userId, userData);
        if (fcmTokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            // Still add to notifications even if no FCM tokens
        }
        const lang = userData.language || "en";
        // Prepare notification content
        const messageTitle = messageData.title || "New Message";
        const messageBody = messageData.body || "You have received a new message";
        // Translate if needed
        const translatedTitle = lang === "en" ? messageTitle : await (0, translateText_1.translateText)(messageTitle, lang);
        const translatedBody = lang === "en" ? messageBody : await (0, translateText_1.translateText)(messageBody, lang);
        // Add to user's notifications collection using utility function
        await (0, fcmUtils_1.addUserNotification)(userId, {
            type: "inbox_message",
            title: translatedTitle,
            body: translatedBody,
            link: "/inbox",
            data: { messageId: snapshot.id }
        });
        // Send FCM notification if tokens are available
        if (fcmTokens.length > 0) {
            const result = await (0, fcmUtils_1.sendFcmNotifications)(fcmTokens, {
                title: translatedTitle,
                body: translatedBody,
                data: {
                    type: "inbox_message",
                    messageId: snapshot.id,
                },
                webpush: {
                    fcmOptions: {
                        link: "https://fsncrew.io/inbox",
                    },
                },
            }, userId, userData);
            console.log(`✅ Notification processing complete for user ${userId}: ${result.successCount} successful, ${result.errorCount} failed`);
        }
        console.log(`✅ New message notification processed for user ${userId}`);
    }
    catch (error) {
        console.error("❌ Error sending new message notification:", error);
    }
});
