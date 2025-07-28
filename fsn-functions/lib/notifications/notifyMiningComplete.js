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
// Create the onCall function with CORS support
exports.notifyMiningComplete = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "User not authenticated.");
    }
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.data();
    if (!user) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const fcmTokens = user.fcmTokens || [];
    const lang = user.language || "en";
    const defaultTitle = "⛏️ Mining Complete!";
    const defaultBody = "You can now claim your FSN reward. Open the app to claim it.";
    // ✅ ترجمة النصوص إذا كانت اللغة غير الإنجليزية
    const translatedTitle = lang === "en" ? defaultTitle : await (0, translateText_1.translateText)(defaultTitle, lang);
    const translatedBody = lang === "en" ? defaultBody : await (0, translateText_1.translateText)(defaultBody, lang);
    const messaging = admin.messaging();
    // ✅ إرسال إشعار FCM لكل توكن
    for (const token of fcmTokens) {
        await messaging
            .send({
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
        })
            .catch((err) => {
            console.error("🔥 FCM send error", token, err.message);
        });
    }
    // ✅ إضافة رسالة إلى صندوق البريد الداخلي
    await db.collection("inbox").add({
        userId: uid,
        title: translatedTitle,
        body: translatedBody,
        read: false,
        claimed: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: "mining",
    });
    // Add to the user's notifications collection
    await db.collection("users").doc(uid).collection("notifications").add({
        type: "claim_reward",
        title: translatedTitle,
        body: translatedBody,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        link: "/mining", // Link to mining page
    });
    return { success: true };
});
