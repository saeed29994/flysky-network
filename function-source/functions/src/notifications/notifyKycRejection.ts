import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { translateText } from "../utils/translateText";
import { getFcmTokens, sendFcmNotifications, addUserNotification } from "../utils/fcmUtils";

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();

export const notifyKycRejection = functions.firestore
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
      const lang: string = afterData.language || "en";
      
      // Prepare notification content
      const messageTitle = "KYC Application Rejected";
      const messageBody = `Your KYC application has been rejected. Reason: ${afterData.kycRejectionReason}`;
      
      // Translate if needed
      const translatedTitle = 
        lang === "en" ? messageTitle : await translateText(messageTitle, lang);
      const translatedBody = 
        lang === "en" ? messageBody : await translateText(messageBody, lang);

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
      await addUserNotification(userId, {
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
      const fcmTokens = await getFcmTokens(userId, afterData);
      
      if (fcmTokens.length > 0) {
        const result = await sendFcmNotifications(
          fcmTokens,
          {
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
          },
          userId,
          afterData
        );
        
        console.log(`✅ KYC rejection notification sent for user ${userId}: ${result.successCount} successful, ${result.errorCount} failed`);
      }
      
      console.log(`✅ KYC rejection notification processed for user ${userId}`);
    } catch (error) {
      console.error("❌ Error sending KYC rejection notification:", error);
    }
  });
