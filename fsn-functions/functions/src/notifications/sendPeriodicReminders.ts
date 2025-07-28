import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { translateText } from "../utils/translateText";

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();

// Scheduled function to run once a day
export const sendDailyReminders = functions.pubsub
  .schedule('0 12 * * *') // Run at 12:00 PM every day
  .timeZone('UTC')
  .onRun(async () => {
    try {
      const now = admin.firestore.Timestamp.now();
      const oneDayAgo = new Date(now.toMillis() - 24 * 60 * 60 * 1000);
      
      // Get users who haven't mined in the last 24 hours
      const usersRef = db.collection('users');
      const usersSnap = await usersRef.get();
      
      // Counter for logging
      let miningRemindersCount = 0;
      let stakingRemindersCount = 0;
      
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Skip users without FCM tokens
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
          continue;
        }
        
        const lang = userData.language || 'en';
        const userTimezone = userData.timezone || 'UTC';
        
        // Check mining activity
        if (!userData.lastMiningTime || 
            userData.lastMiningTime.toMillis() < oneDayAgo.getTime()) {
          
          // User hasn't mined in over 24 hours, send reminder
          await sendMiningReminder(userId, fcmTokens, lang);
          miningRemindersCount++;
        }
        
        // Check staking activity - optional based on plan
        if (userData.plan && 
            (userData.plan === 'business' || 
             userData.plan === 'first-6' || 
             userData.plan === 'first-lifetime')) {
          
          // Check if user has any active staking
          // Use the correct subcollection path: users/{userId}/staking
          const stakingQuery = await db.collection("users").doc(userId).collection("staking")
            .where('status', '==', 'active')
            .limit(1)
            .get();
          
          if (stakingQuery.empty) {
            // No active staking found, send reminder
            await sendStakingReminder(userId, fcmTokens, lang);
            stakingRemindersCount++;
          }
        }
      }
      
      console.log(`✅ Sent ${miningRemindersCount} mining reminders and ${stakingRemindersCount} staking reminders`);
      return null;
    } catch (error) {
      console.error('Error sending periodic reminders:', error);
      return null;
    }
  });

// Helper function to send mining reminder
async function sendMiningReminder(userId: string, fcmTokens: string[], lang: string): Promise<void> {
  try {
    const defaultTitle = "⛏️ Daily Mining Reminder";
    const defaultBody = "Don't forget to mine today to earn your daily FSN rewards!";
    
    const translatedTitle = 
      lang === "en" ? defaultTitle : await translateText(defaultTitle, lang);
    const translatedBody = 
      lang === "en" ? defaultBody : await translateText(defaultBody, lang);
    
    await db.collection("users").doc(userId).collection("notifications").add({
      type: "mining_reminder",
      title: translatedTitle,
      body: translatedBody,
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      link: "/mining"
    });
    
    // Send FCM notifications
    const messaging = admin.messaging();
    
    for (const token of fcmTokens) {
      await messaging
        .send({
          token,
          notification: {
            title: translatedTitle,
            body: translatedBody,
          },
          data: {
            type: "mining_reminder"
          },
          webpush: {
            fcmOptions: {
              link: "https://fsncrew.io/mining",
            },
          },
        })
        .catch((err) => {
          console.error("Failed to send mining reminder:", err);
          
          // Remove invalid tokens
          if (err.code === 'messaging/registration-token-not-registered') {
            const userRef = db.collection("users").doc(userId);
            userRef.update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
            });
          }
        });
    }
  } catch (error) {
    console.error("Error in sendMiningReminder:", error);
  }
}

// Helper function to send staking reminder
async function sendStakingReminder(userId: string, fcmTokens: string[], lang: string): Promise<void> {
  try {
    const defaultTitle = "💰 Staking Opportunity";
    const defaultBody = "Boost your FSN rewards by staking your tokens today!";
    
    const translatedTitle = 
      lang === "en" ? defaultTitle : await translateText(defaultTitle, lang);
    const translatedBody = 
      lang === "en" ? defaultBody : await translateText(defaultBody, lang);
    
    await db.collection("users").doc(userId).collection("notifications").add({
      type: "staking_reminder",
      title: translatedTitle,
      body: translatedBody,
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      link: "/staking"
    });
    
    // Send FCM notifications
    const messaging = admin.messaging();
    
    for (const token of fcmTokens) {
      await messaging
        .send({
          token,
          notification: {
            title: translatedTitle,
            body: translatedBody,
          },
          data: {
            type: "staking_reminder"
          },
          webpush: {
            fcmOptions: {
              link: "https://fsncrew.io/staking",
            },
          },
        })
        .catch((err) => {
          console.error("Failed to send staking reminder:", err);
          
          // Remove invalid tokens
          if (err.code === 'messaging/registration-token-not-registered') {
            const userRef = db.collection("users").doc(userId);
            userRef.update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
            });
          }
        });
    }
  } catch (error) {
    console.error("Error in sendStakingReminder:", error);
  }
} 