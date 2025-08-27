import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const updateReferralStatus = functions.firestore
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
      let referrerRef: admin.firestore.DocumentReference | null = null;
      let referrerData: admin.firestore.DocumentData | null = null;

      // First try to find by referral code
      const referralCodeQuery = await db.collection("users")
        .where("referralCode", "==", referredBy)
        .limit(1)
        .get();

      if (!referralCodeQuery.empty) {
        referrerRef = referralCodeQuery.docs[0].ref;
        referrerData = referralCodeQuery.docs[0].data();
        console.log(`✅ Found referrer by referral code: ${referrerRef.id}`);
      } else {
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
      const referralList = (referrerData.referralList as any[]) || [];
      const userEmail = afterData.email;

      // Find the specific referral entry for this user
      const referralIndex = referralList.findIndex((ref: any) => ref.email === userEmail);
      
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
      const verifiedCount = referralList.filter((r: any) => r.status === "Verified").length;
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
          const token = tokenDoc.data()!.token;
          
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
        } else {
          console.log("⚠️ No FCM token found for referrer");
        }
      } catch (error) {
        console.error("❌ Error sending FCM notification:", error);
      }

      console.log(`🎉 Referral verification process completed successfully for user ${userId}`);

    } catch (error) {
      console.error(`❌ Error updating referral status for user ${userId}:`, error);
    }
  });
