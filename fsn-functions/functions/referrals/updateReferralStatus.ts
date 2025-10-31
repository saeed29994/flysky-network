import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendFCM } from "./sendPushNotification";

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
      body: `You’ve earned a ${reward} FSN bonus for verifying a referral.`,
      type: "referral_bonus",
      amount: reward,
      claimed: false,
      timestamp: Date.now(),
    };
    await userRef.update({
      inbox: admin.firestore.FieldValue.arrayUnion(inboxEntry),
    });

    // 👇 إرسال إشعار FCM
    await sendFCM(
      userId,
      "🎉 Referral Verified!",
      `You earned ${reward} FSN for verifying a referral. Claim your bonus now!`
    );

    console.log("✅ Referral bonus handled for:", userId);
  });
