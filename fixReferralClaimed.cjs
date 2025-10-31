const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // تأكد أن الملف بجانب هذا السكربت

// ✅ تهيئة Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixReferralClaimed() {
  const usersSnapshot = await db.collection("users").get();

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const referralList = userData.referralList || [];

    let updated = false;

    const updatedList = referralList.map((ref) => {
      if (ref.status === "Verified" && ref.claimed === undefined) {
        updated = true;
        return { ...ref, claimed: false };
      }
      return ref;
    });

    if (updated) {
      await doc.ref.update({ referralList: updatedList });
      console.log(`✅ Updated referralList for user ${doc.id}`);
    }
  }

  console.log("🎉 Referral fix complete.");
}

fixReferralClaimed().catch(console.error);
