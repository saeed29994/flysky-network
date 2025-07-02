import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();

export const checkReferralBonuses = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    const beforeVerified = (beforeData.referralList || []).filter((r: any) => r.status === "Verified").length;
    const afterVerified = (afterData.referralList || []).filter((r: any) => r.status === "Verified").length;

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
