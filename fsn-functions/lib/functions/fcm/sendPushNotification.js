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
exports.checkReferralBonuses = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.checkReferralBonuses = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;
    const beforeVerified = (beforeData.referralList || []).filter((r) => r.status === "Verified").length;
    const afterVerified = (afterData.referralList || []).filter((r) => r.status === "Verified").length;
    // ✅ Check for new verified referral
    if (afterVerified > beforeVerified) {
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();
        const user = userSnap.data();
        const fcmTokens = user?.fcmTokens || [];
        const reward = afterVerified < 10 ? 100 : afterVerified < 20 ? 200 : 300;
        // 📨 Add to inbox (English only)
        await db.collection("inbox").add({
            userId,
            title: "🎁 New Referral Verified",
            body: `Congratulations! A new referral has been verified. You'll earn ${reward} FSN once you claim it.`,
            read: false,
            claimed: false,
            timestamp: Date.now(),
        });
        // 🔔 Send FCM notification (English only)
        const messaging = admin.messaging();
        const message = {
            notification: {
                title: "🎉 New Referral!",
                body: `A new referral was verified. Get ready to claim your bonus!`,
            },
            webpush: {
                fcmOptions: {
                    link: "https://fsncrew.io/referral",
                },
            },
        };
        for (const token of fcmTokens) {
            await messaging.send({ ...message, token }).catch((err) => {
                console.error("FCM Error for token:", token, err.message);
            });
        }
    }
});
