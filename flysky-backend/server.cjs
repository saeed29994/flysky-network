const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const NOWPAYMENTS_API_KEY = '4PNFSYX-ZJ8MV33-MV5J0G1-P7MTWWK';

app.post('/create-payment', async (req, res) => {
  const { amountUSD, orderId, payCurrency } = req.body;

  try {
    const response = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: amountUSD,
        price_currency: 'usd',
        pay_currency: payCurrency, // ← مرن حسب الطلب
        order_id: orderId,
        order_description: `Membership purchase: ${orderId}`,
        ipn_callback_url: 'https://your-site.com/callback',
      },
      {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ payment_url: response.data.payment_url });
  } catch (error) {
    console.error('Error creating payment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
