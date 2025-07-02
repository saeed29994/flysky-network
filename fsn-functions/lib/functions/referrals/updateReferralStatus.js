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
exports.updateReferralStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const translateText_1 = require("../../utils/translateText");
const constants_1 = require("../../utils/constants");
admin.initializeApp();
const db = admin.firestore();
exports.updateReferralStatus = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return null;
    const prevStatus = (before.kycStatus || '').toLowerCase();
    const newStatus = (after.kycStatus || '').toLowerCase();
    const referredEmail = after.email;
    if (prevStatus === newStatus || newStatus !== 'verified')
        return null;
    const usersSnapshot = await db.collection('users').get();
    for (const docSnap of usersSnapshot.docs) {
        const data = docSnap.data();
        const referralList = data.referralList || [];
        let updated = false;
        const newList = referralList.map((entry) => {
            if (entry.email === referredEmail && entry.status === 'Pending') {
                entry.status = 'Verified';
                updated = true;
            }
            return entry;
        });
        if (updated) {
            await docSnap.ref.update({ referralList: newList });
            const tokens = data.fcmTokens || [];
            const lang = data.language || 'en';
            const titleEn = constants_1.NOTIFICATION_TEMPLATES.referralVerified.title;
            const bodyEn = constants_1.NOTIFICATION_TEMPLATES.referralVerified.body(referredEmail);
            let translatedTitle = titleEn;
            let translatedBody = bodyEn;
            try {
                translatedTitle = await (0, translateText_1.translateText)(titleEn, lang);
                translatedBody = await (0, translateText_1.translateText)(bodyEn, lang);
            }
            catch (err) {
                console.error('❌ Translation failed:', err);
            }
            if (tokens.length > 0) {
                const message = {
                    notification: { title: translatedTitle, body: translatedBody },
                    tokens,
                    webpush: {
                        fcmOptions: { link: constants_1.DEFAULT_DASHBOARD_URL },
                        notification: {
                            icon: constants_1.DEFAULT_ICON_URL,
                            click_action: constants_1.DEFAULT_DASHBOARD_URL,
                        },
                    },
                };
                try {
                    const response = await admin.messaging().sendEachForMulticast(message);
                    console.log(`📨 FCM sent: ${response.successCount}/${tokens.length}`);
                }
                catch (error) {
                    console.error('❌ FCM error:', error);
                }
            }
        }
    }
    return null;
});
