import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { translateText } from "../src/utils/translateText";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const notifyNewMessage = functions.firestore
  .document("users/{userId}/inbox/{messageId}")
  .onCreate(async (snapshot, context) => {
    try {
      const userId = context.params.userId;
      const messageData = snapshot.data();
      
      // Skip if this message was already created by a notification process
      if (messageData.fromNotification) return;

      // Get user's language preference
      const userSnap = await db.collection("users").doc(userId).get();
      const userData = userSnap.data();
      
      if (!userData) {
        console.log("User not found:", userId);
        return;
      }
      
      const fcmTokens: string[] = userData.fcmTokens || [];
      const lang: string = userData.language || "en";
      
      // Prepare notification content
      const messageTitle = messageData.title || "New Message";
      const messageBody = messageData.body || "You have received a new message";
      
      // Translate if needed
      const translatedTitle = 
        lang === "en" ? messageTitle : await translateText(messageTitle, lang);
      const translatedBody = 
        lang === "en" ? messageBody : await translateText(messageBody, lang);

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
    } catch (error) {
      console.error("Error sending new message notification:", error);
    }
  }); 