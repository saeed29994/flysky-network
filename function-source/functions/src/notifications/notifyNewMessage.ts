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

export const notifyNewMessage = functions.firestore
  .document("users/{userId}/inbox/{messageId}")
  .onCreate(async (snapshot, context) => {
    try {
      const userId = context.params.userId;
      const messageData = snapshot.data();
      
      if (messageData.fromNotification) return;

      // Get user's language preference
      const userSnap = await db.collection("users").doc(userId).get();
      const userData = userSnap.data();
      
      if (!userData) {
        console.log("User not found:", userId);
        return;
      }
      
      // Get FCM tokens using utility function
      const fcmTokens = await getFcmTokens(userId, userData);
      
      if (fcmTokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        // Still add to notifications even if no FCM tokens
      }
      
      const lang: string = userData.language || "en";
      
      // Prepare notification content
      const messageTitle = messageData.title || "New Message";
      const messageBody = messageData.body || "You have received a new message";
      
      // Translate if needed
      const translatedTitle = 
        lang === "en" ? messageTitle : await translateText(messageTitle, lang);
      const translatedBody = 
        lang === "en" ? messageBody : await translateText(messageBody, lang);

      // Add to user's notifications collection using utility function
      await addUserNotification(userId, {
        type: "inbox_message",
        title: translatedTitle,
        body: translatedBody,
        link: "/inbox",
        data: { messageId: snapshot.id }
      });
      
      // Send FCM notification if tokens are available
      if (fcmTokens.length > 0) {
        const result = await sendFcmNotifications(
          fcmTokens,
          {
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
          },
          userId,
          userData
        );
        
        console.log(`✅ Notification processing complete for user ${userId}: ${result.successCount} successful, ${result.errorCount} failed`);
      }
      
      console.log(`✅ New message notification processed for user ${userId}`);
    } catch (error) {
      console.error("❌ Error sending new message notification:", error);
    }
  }); 