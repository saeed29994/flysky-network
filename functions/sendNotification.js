const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.sendNotification = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { title, body, tokens } = req.body;

    if (!title || !body || !tokens || !Array.isArray(tokens)) {
      return res.status(400).send('Invalid request');
    }

    const message = {
      notification: { title, body },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      return res.status(200).send(`Successfully sent to ${response.successCount} devices.`);
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).send('Error sending notification');
    }
  });
});
