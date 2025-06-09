// addMembershipField.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// تحميل مفتاح الخدمة
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

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
    const ref = db.collection('users').doc(doc.id);

    if (!data.membership) {
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
    console.log(`✅ Membership field added to ${updatedCount} user(s).`);
  } else {
    console.log('✅ All users already have membership.');
  }
}

addMembershipFieldToUsers().catch((err) => {
  console.error('❌ Error updating users:', err);
});
