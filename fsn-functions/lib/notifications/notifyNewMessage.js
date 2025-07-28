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
        const fcmTokens = userData.fcmTokens || [];
        const lang = userData.language || "en";
        // Prepare notification content
        const messageTitle = messageData.title || "New Message";
        const messageBody = messageData.body || "You have received a new message";
        // Translate if needed
        const translatedTitle = lang === "en" ? messageTitle : await (0, translateText_1.translateText)(messageTitle, lang);
        const translatedBody = lang === "en" ? messageBody : await (0, translateText_1.translateText)(messageBody, lang);
        // Add to user's notifications collection
        await db.collection("users").doc(userId).collection("notifications").add({
            type: "inbox_message",
            title: translatedTitle,
            body: translatedBody,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            link: "/inbox", // Link to inbox page
            data: { messageId: snapshot.id }
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
                    type: "inbox_message",
                    messageId: snapshot.id,
                },
                webpush: {
                    fcmOptions: {
                        link: "https://fsncrew.io/inbox",
                    },
                },
            })
                .catch((err) => {
                console.error("Failed to send FCM notification:", err);
                // Remove invalid tokens
                if (err.code === 'messaging/registration-token-not-registered') {
                    const userRef = db.collection("users").doc(userId);
                    userRef.update({
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                    });
                }
            });
        }
        console.log(`✅ Notification sent for new message to user ${userId}`);
    }
    catch (error) {
        console.error("Error sending new message notification:", error);
    }
});
