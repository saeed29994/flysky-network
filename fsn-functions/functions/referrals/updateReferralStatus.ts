import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const updateReferralStatus = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    const beforeList = beforeData?.referralList || [];
    const afterList = afterData?.referralList || [];

    const newlyVerified = afterList.find((ref: any) => {
      return ref.status === "Verified" &&
        !beforeList.some((b: any) => b.email === ref.email && b.status === "Verified");
    });

    if (!newlyVerified) return;

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const user = userSnap.data();
    if (!user) return;

    // 👇 تحديد عدد الإحالات المتحققة
    const verifiedCount = (afterList || []).filter((r: any) => r.status === "Verified").length;

    // 👇 المكافأة حسب العدد
    const reward = verifiedCount < 10 ? 100 : verifiedCount < 20 ? 200 : 300;

    // 👇 إضافة الرسالة إلى البريد
    const inboxEntry = {
      title: "🎉 Referral Bonus Unlocked!",
      body: `You've earned a ${reward} FSN bonus for verifying a referral.`,
      type: "referral_bonus",
      amount: reward,
      claimed: false,
      timestamp: Date.now(),
    };
    await userRef.update({
      inbox: admin.firestore.FieldValue.arrayUnion(inboxEntry),
    });

    // 👇 إرسال إشعار FCM using the new internationalized system
    try {
      // Get user's FCM token
      const tokenDoc = await admin.firestore().collection('userTokens').doc(userId).get();
      if (tokenDoc.exists && tokenDoc.data()?.token) {
        const token = tokenDoc.data()!.token;
        
        // Send FCM notification directly
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
        
        console.log("✅ FCM notification sent for referral bonus:", userId);
      } else {
        console.log("⚠️ No FCM token found for user:", userId);
      }
    } catch (error) {
      console.error("❌ Error sending FCM notification:", error);
    }

    console.log("✅ Referral bonus handled for:", userId);
  });
