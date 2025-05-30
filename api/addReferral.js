import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
