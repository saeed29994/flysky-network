const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function addMembershipFieldToUsers() {
  const usersSnapshot = await db.collection('users').get();

  const batch = db.batch();
  let updatedCount = 0;

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.membership) {
      const ref = db.collection('users').doc(doc.id);
      batch.update(ref, {
        membership: {
          plan: 'economy',
          planName: 'economy',
          miningEarnings: 0,
          miningStartTime: null,
        },
      });
      console.log(`🔧 Added membership to: ${data.email}`);
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ Updated ${updatedCount} user(s) with membership.`);
  } else {
    console.log('✅ No users needed updating.');
  }
}

addMembershipFieldToUsers().catch((err) => {
  console.error('❌ Error:', err);
});
