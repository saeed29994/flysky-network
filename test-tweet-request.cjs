const axios = require('axios');

async function sendTestTweet() {
  try {
    const response = await axios.post('http://localhost:5678/webhook-test/verify-tweet', {
      username: 'fsncrew', // 👈 اسم مستخدم تويتر
      tweet: 'Check out this banner! https://2u.pw/Np639' // 👈 نص التغريدة
    });

    console.log('✅ Response from webhook:', response.data);
  } catch (error) {
    console.error('❌ Error sending request:', error.response?.data || error.message);
  }
}

sendTestTweet();
