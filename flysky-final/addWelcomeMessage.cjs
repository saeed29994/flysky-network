
// addWelcomeMessage.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود الملف

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ✏️ ضع UID هنا للمستخدم الحالي
const targetUid = 'u2W7zJsnkSfr8a05GH1EM68OgiG3';

const run = async () => {
  if (!targetUid) {
    console.error("❌ Please provide a valid UID.");
    return;
  }

  const inboxRef = db.collection('users').doc(targetUid).collection('inbox');
  const newMessageRef = inboxRef.doc();

  const message = {
    title: "🎉 Welcome to FlySky Network!",
    body: "You’ve earned a 500 FSN welcome bonus. Click below to claim your reward.",
    type: "welcome_bonus",
    amount: 500,
    claimed: false,
    read: false,
    archived: false,
    deleted: false,
    timestamp: Date.now()
  };

  await newMessageRef.set(message);

  console.log(`✅ Welcome message added to ${targetUid}/inbox/${newMessageRef.id}`);
};

run().catch((err) => {
  console.error("❌ Error adding message:", err);
});
