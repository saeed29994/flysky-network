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
const db = admin.firestore();
exports.updateReferralStatus = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    // Check if KYC status changed to "Verified"
    const beforeKycStatus = beforeData?.kycStatus;
    const afterKycStatus = afterData?.kycStatus;
    // Only proceed if KYC status changed to "Verified"
    if (beforeKycStatus === afterKycStatus || afterKycStatus !== "Verified") {
        console.log(`🔄 KYC status unchanged or not verified for user ${userId}`);
        return;
    }
    console.log(`✅ KYC status changed to Verified for user ${userId}`);
    // Get the referrer information
    const referredBy = afterData?.referredBy;
    if (!referredBy) {
        console.log(`⚠️ User ${userId} has no referrer`);
        return;
    }
    console.log(`🔍 User ${userId} was referred by: ${referredBy}`);
    try {
        // Find the referrer user document
        let referrerRef = null;
        let referrerData = null;
        // First try to find by referral code
        const referralCodeQuery = await db.collection("users")
            .where("referralCode", "==", referredBy)
            .limit(1)
            .get();
        if (!referralCodeQuery.empty) {
            referrerRef = referralCodeQuery.docs[0].ref;
            referrerData = referralCodeQuery.docs[0].data();
            console.log(`✅ Found referrer by referral code: ${referrerRef.id}`);
        }
        else {
            // Fallback: try to find by UID
            const userDoc = await db.collection("users").doc(referredBy).get();
            if (userDoc.exists) {
                referrerRef = userDoc.ref;
                referrerData = userDoc.data() || null;
                console.log(`✅ Found referrer by UID: ${referrerRef.id}`);
            }
        }
        if (!referrerRef || !referrerData) {
            console.log(`❌ Could not find referrer for code/UID: ${referredBy}`);
            return;
        }
        // Get the referrer's current referral list
        const referralList = referrerData.referralList || [];
        const userEmail = afterData.email;
        // Find the specific referral entry for this user
        const referralIndex = referralList.findIndex((ref) => ref.email === userEmail);
        if (referralIndex === -1) {
            console.log(`❌ Referral entry not found for email: ${userEmail}`);
            return;
        }
        // Update the referral status to "Verified"
        referralList[referralIndex].status = "Verified";
        referralList[referralIndex].verifiedAt = Date.now();
        console.log(`📝 Updating referral status to Verified for ${userEmail}`);
        // Update the referrer's document
        await referrerRef.update({
            referralList: referralList
        });
        console.log(`✅ Referral status updated successfully for ${userEmail}`);
        // Calculate the reward based on verified referral count
        const verifiedCount = referralList.filter((r) => r.status === "Verified").length;
        const reward = verifiedCount < 10 ? 100 : verifiedCount < 20 ? 200 : 300;
        console.log(`💰 Referrer has ${verifiedCount} verified referrals, reward: ${reward} FSN`);
        // Add bonus notification to referrer's inbox
        const inboxEntry = {
            title: "🎉 Referral Bonus Unlocked!",
            body: `You've earned a ${reward} FSN bonus for verifying a referral.`,
            type: "referral_bonus",
            amount: reward,
            claimed: false,
            timestamp: Date.now(),
            referredUserEmail: userEmail,
        };
        await referrerRef.update({
            inbox: admin.firestore.FieldValue.arrayUnion(inboxEntry),
        });
        console.log(`📬 Bonus notification added to referrer's inbox`);
        // Send FCM notification to referrer
        try {
            const tokenDoc = await db.collection('userTokens').doc(referrerRef.id).get();
            if (tokenDoc.exists && tokenDoc.data()?.token) {
                const token = tokenDoc.data().token;
                await admin.messaging().send({
                    token,
                    notification: {
                        title: "🎉 Referral Verified!",
                        body: `You earned ${reward} FSN for verifying a referral. Claim your bonus now!`
                    },
                    data: {
                        type: "referral_bonus",
                        amount: reward.toString(),
                        action: "claim_bonus"
                    }
                });
                console.log("✅ FCM notification sent to referrer");
            }
            else {
                console.log("⚠️ No FCM token found for referrer");
            }
        }
        catch (error) {
            console.error("❌ Error sending FCM notification:", error);
        }
        console.log(`🎉 Referral verification process completed successfully for user ${userId}`);
    }
    catch (error) {
        console.error(`❌ Error updating referral status for user ${userId}:`, error);
    }
});
