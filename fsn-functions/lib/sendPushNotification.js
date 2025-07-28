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
exports.sendPushNotification = exports.sendFCM = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translate_1 = require("@google-cloud/translate");
if (!admin.apps.length) {
    admin.initializeApp();
}
const translate = new translate_1.v2.Translate();
// ✅ دالة مساعدة لإرسال الإشعار (تُستخدم داخل باقي الـ Cloud Functions)
const sendFCM = async (userId, title, body) => {
    try {
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const lang = userDoc.exists && userDoc.data()?.language ? userDoc.data().language : "ar";
        const tokenDoc = await admin.firestore().collection("userTokens").doc(userId).get();
        if (!tokenDoc.exists || !tokenDoc.data()?.token)
            return;
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
            token,
        };
        await admin.messaging().send(message);
        console.log("✅ FCM sent to", userId);
    }
    catch (error) {
        console.error("❌ Error sending FCM:", error);
    }
};
exports.sendFCM = sendFCM;
// ✅ دالة HTTP لاستدعائها عبر رابط مباشر (POST)
exports.sendPushNotification = functions.https.onRequest(async (req, res) => {
    const { userId, title, body } = req.body;
    if (!userId || !title || !body) {
        res.status(400).json({ success: false, message: "Missing required fields." });
        return;
    }
    try {
        await (0, exports.sendFCM)(userId, title, body);
        res.status(200).json({ success: true, message: "Notification sent successfully" });
    }
    catch (error) {
        console.error("❌ Error sending notification:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});
