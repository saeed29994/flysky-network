const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');

// 🔹 إنشاء مجلد api
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir);
}

// 🔹 كتابة ملف addReferral.js
const addReferralContent = `const admin = require('firebase-admin');

// ✅ تهيئة Firebase Admin باستخدام المتغير البيئي
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
    ),
  });
}

// ✅ Endpoint الأساسي
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('🚀 Welcome to the FlySky Referral Server! API is ready!');
  }

  if (req.method === 'POST') {
    const { referrerCode, newUserEmail } = req.body;

    if (!referrerCode || !newUserEmail) {
      return res.status(400).json({ error: 'referrerCode and newUserEmail are required.' });
    }

    try {
      const usersRef = admin.firestore().collection('users');
      const refSnap = await usersRef.where('referralCode', '==', referrerCode).get();

      if (refSnap.empty) {
        return res.status(404).json({ error: 'Referrer not found.' });
      }

      const refDoc = refSnap.docs[0];
      await refDoc.ref.update({
        referralList: admin.firestore.FieldValue.arrayUnion({
          email: newUserEmail,
          status: 'Pending',
          timestamp: Date.now(),
        }),
        referrals: admin.firestore.FieldValue.increment(1),
      });

      return res.status(200).json({ message: 'Referral added successfully!' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // ⚠️ طلبات غير مدعومة
  res.status(405).json({ error: 'Method not allowed' });
}
`;

fs.writeFileSync(path.join(apiDir, 'addReferral.js'), addReferralContent);

// 🔹 كتابة ملف vercel.json
const vercelJsonContent = `{
  "version": 2,
  "builds": [
    {
      "src": "api/*.js",
      "use": "@vercel/node"
    }
  ]
}`;

fs.writeFileSync(path.join(__dirname, 'vercel.json'), vercelJsonContent);

console.log('✅ الملفات جاهزة! 🚀');
