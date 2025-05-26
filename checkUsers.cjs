const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('❌ No users found in Firestore.');
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`✅ User [${doc.id}]:`);
    console.log(`  Full Name: ${data.fullName}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Balance: ${data.balance}`);
    console.log(`  Locked in Staking: ${data.lockedFromStaking}`);
    console.log(`  Referral Reward: ${data.referralReward}`);
    console.log('-----------------------------------------');
  });

  console.log('🎉 Finished reading all users.');
}

checkUsers().catch(error => {
  console.error('🔥 Error reading users:', error);
});
