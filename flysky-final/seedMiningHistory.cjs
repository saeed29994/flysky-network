const admin = require("firebase-admin");
const { format } = require("date-fns");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const seedMiningHistory = async () => {
  const usersSnap = await db.collection("users").get();
  const today = format(new Date(), "yyyy-MM-dd");

  for (const doc of usersSnap.docs) {
    const uid = doc.id;
    const historyRef = db.doc(`users/${uid}/miningHistory/${today}`);
    const historySnap = await historyRef.get();

    if (!historySnap.exists) {
      await historyRef.set({
        amount: 0,
        date: today,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Initialized miningHistory for ${uid}`);
    } else {
      console.log(`⚠️ Already exists for ${uid}`);
    }
  }

  console.log("🎉 Done seeding mining history.");
};

seedMiningHistory().catch(console.error);
