const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3001;

console.log('➡️ Initializing server...');

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('✅ Backend server is running. Use POST /verify-payment to test payment verification.');
});

app.post('/verify-payment', (req, res) => {
  console.log('✅ Received verify-payment POST:', req.body);
  const { txId, currency, amount, userEmail } = req.body;
  if (!txId || !currency || !amount || !userEmail) {
    console.warn('❌ Missing required fields.');
    return res.status(400).json({ success: false, message: '❌ Missing required fields.' });
  }
  res.status(200).json({ success: true, message: '✅ Payment verified successfully (dummy response).', data: { txId, currency, amount, userEmail } });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});