const fs = require('fs');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // ← ضع هنا مسار ملف serviceAccount

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ اقرأ بيانات المستخدمين من users.json
const usersData = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));

// ✅ بيانات افتراضية لكل مستخدم
const stakingEntries = [
  {
    amount: 1000,
    duration: '1 month',
    endDate: '2025-05-19',
    expectedReturn: 1050,
    status: 'active',
  },
  {
    amount: 600,
    duration: '6 months',
    endDate: '2025-10-18',
    expectedReturn: 630,
    status: 'active',
  },
];

const transactions = [
  {
    type: 'stake',
    amount: 1000,
    date: '2025-04-30',
  },
  {
    type: 'reward',
    amount: 200,
    date: '2025-04-25',
  },
];

async function seedUsers() {
  let processedCount = 0;

  for (const user of usersData) {
    const userRef = db.collection('users').doc(user.uid);
    const userSnap = await userRef.get();

    const userData = {
      fullName: user.fullName,
      email: user.email,
      balance: user.balance,
      lockedFromStaking: stakingEntries.reduce((sum, e) => sum + e.amount, 0),
      stakingEntries: stakingEntries,
      transactions: transactions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (userSnap.exists) {
        await userRef.update(userData);
        console.log(`✅ Updated existing user ${user.uid}`);
      } else {
        await userRef.set(userData);
        console.log(`✅ Created new user ${user.uid}`);
      }
      processedCount++;
    } catch (error) {
      console.error(`🔥 Error processing user ${user.uid}:`, error);
    }
  }

  console.log(`🎉 Finished processing ${processedCount} users.`);
}

seedUsers();
