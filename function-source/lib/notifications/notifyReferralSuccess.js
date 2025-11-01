"use strict";
// function-source/functions/src/notifications/notifyReferralSuccess.ts
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
exports.notifyReferralSuccess = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Ensure Firebase is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();
/**
 * This function triggers when a user's document is updated.
 * It specifically checks if a referral in the `referralList` array
 * has just been changed to 'Verified'.
 * If so, it creates a notification document in the user's 'inbox' subcollection.
 */
exports.notifyReferralSuccess = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const beforeList = beforeData?.referralList || [];
    const afterList = afterData?.referralList || [];
    // Do nothing if the list hasn't changed or is empty
    if (beforeList.length === afterList.length && beforeList.every((v, i) => v === afterList[i])) {
        return null;
    }
    // Find referrals that just became 'Verified'
    const newlyVerifiedReferrals = afterList.filter((afterRef) => {
        if (afterRef.status !== "Verified") {
            return false; // We only care about newly verified ones
        }
        // Find the corresponding referral in the old list
        const beforeRef = beforeList.find((br) => br.email === afterRef.email);
        // Was it not 'Verified' before, but is 'Verified' now?
        return !beforeRef || beforeRef.status !== "Verified";
    });
    if (newlyVerifiedReferrals.length === 0) {
        console.log(`No newly verified referrals for user ${userId}. Exiting.`);
        return null;
    }
    console.log(`Found ${newlyVerifiedReferrals.length} newly verified referrals for user ${userId}.`);
    // For each newly verified referral, create an inbox notification
    const inboxPromises = newlyVerifiedReferrals.map((referral) => {
        const inboxRef = db.collection("users").doc(userId).collection("inbox").doc();
        const notificationBody = `Your referral for ${referral.email} has been successfully verified! Your bonus is ready to be claimed.`;
        return inboxRef.set({
            title: "✅ Referral Verified!",
            body: notificationBody,
            type: "referral_verified",
            timestamp: Date.now(),
            read: false,
            link: "/referral-program", // Link to the referral page
            referredUserEmail: referral.email,
        });
    });
    try {
        await Promise.all(inboxPromises);
        console.log(`Successfully created ${inboxPromises.length} inbox notifications for user ${userId}.`);
    }
    catch (error) {
        console.error(`Error creating inbox notifications for user ${userId}:`, error);
    }
    return null;
});
