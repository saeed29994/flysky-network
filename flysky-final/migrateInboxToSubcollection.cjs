
// migrateInboxToSubcollection.js

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} = require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.cjs');
 // تأكد من إنشاء هذا الملف

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrateInbox = async () => {
  const usersSnap = await getDocs(collection(db, "users"));
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const inboxArray = userData.inbox;

    if (!Array.isArray(inboxArray)) {
      console.log(`⏭️ No array inbox for user ${userId}`);
      continue;
    }

    console.log(`🔄 Migrating inbox for user: ${userId} (${inboxArray.length} messages)`);

    const batch = writeBatch(db);
    inboxArray.forEach((msg, index) => {
      const msgRef = doc(db, `users/${userId}/inbox`, `msg_${index + 1}`);
      batch.set(msgRef, {
        ...msg,
        archived: msg.archived || false,
        deleted: msg.deleted || false,
      });
    });

    const userRef = doc(db, "users", userId);
    batch.update(userRef, { inbox: null });

    await batch.commit();
    console.log(`✅ Migration completed for user ${userId}`);
  }
};

migrateInbox()
  .then(() => console.log("🎉 All inboxes migrated successfully."))
  .catch((err) => console.error("❌ Error during migration:", err));
