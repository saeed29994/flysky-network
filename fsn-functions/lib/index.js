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
exports.sendDailyReminders = exports.notifyReferralBonus = exports.notifyNewMessage = exports.notifyMiningComplete = exports.sendPushNotification = exports.translateFunction = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translate_1 = require("@google-cloud/translate");
const translateText_1 = require("./utils/translateText");
// Import notification functions
const notifyMiningComplete_1 = require("./notifications/notifyMiningComplete");
Object.defineProperty(exports, "notifyMiningComplete", { enumerable: true, get: function () { return notifyMiningComplete_1.notifyMiningComplete; } });
const notifyNewMessage_1 = require("./notifications/notifyNewMessage");
Object.defineProperty(exports, "notifyNewMessage", { enumerable: true, get: function () { return notifyNewMessage_1.notifyNewMessage; } });
const notifyReferralBonus_1 = require("./notifications/notifyReferralBonus");
Object.defineProperty(exports, "notifyReferralBonus", { enumerable: true, get: function () { return notifyReferralBonus_1.notifyReferralBonus; } });
const sendPeriodicReminders_1 = require("./notifications/sendPeriodicReminders");
Object.defineProperty(exports, "sendDailyReminders", { enumerable: true, get: function () { return sendPeriodicReminders_1.sendDailyReminders; } });
// process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + "/../flysky-site-3daa1e4343c4.json";
if (!admin.apps.length) {
    admin.initializeApp();
}
const translate = new translate_1.v2.Translate();
const allowedOrigins = [
    "http://localhost:5173", // Local development server
    "http://localhost:3000", // Another common local port
    "https://fsncrew.io",
    "https://www.fsncrew.io"
];
// Export existing functions
exports.translateFunction = functions.https.onRequest(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        res.set("Access-Control-Allow-Credentials", "true");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    try {
        const { text, targetLang } = req.body;
        if (!text || !targetLang) {
            res.status(400).json({ error: "Missing text or targetLang" });
            return;
        }
        const translated = await (0, translateText_1.translateText)(text, targetLang);
        res.status(200).json({ translation: translated });
    }
    catch (error) {
        console.error("🔥 Translation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.sendPushNotification = functions.https.onRequest(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        res.set("Access-Control-Allow-Credentials", "true");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    const { userId, title, body } = req.body;
    if (!userId || !title || !body) {
        res.status(400).json({ success: false, message: "Missing required fields." });
        return;
    }
    try {
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const lang = userDoc.exists && userDoc.data()?.language ? userDoc.data().language : "ar";
        const tokenDoc = await admin.firestore().collection("userTokens").doc(userId).get();
        if (!tokenDoc.exists || !tokenDoc.data()?.token) {
            res.status(404).json({ success: false, message: "FCM token not found for user." });
            return;
        }
        const token = tokenDoc.data().token;
        let translatedTitle = title;
        let translatedBody = body;
        try {
            [translatedTitle] = await translate.translate(title, lang);
            [translatedBody] = await translate.translate(body, lang);
        }
        catch (translationError) {
            console.warn("⚠️ Failed to translate:", translationError.message);
        }
        const message = {
            notification: {
                title: translatedTitle,
                body: translatedBody,
            },
            token: token,
        };
        const response = await admin.messaging().send(message);
        console.log("✅ Notification sent:", response);
        res.status(200).json({ success: true, message: "Notification sent successfully" });
    }
    catch (error) {
        console.error("❌ Error sending notification:", error);
        if (error.errorInfo?.code === 'messaging/registration-token-not-registered') {
            await admin.firestore().collection("userTokens").doc(userId).delete();
            console.log("🚫 تم حذف التوكن غير الصالح.");
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});
// Configure functions for proper CORS and region
const runtimeOpts = {
    timeoutSeconds: 60,
    memory: '256MB',
    cors: true
};
