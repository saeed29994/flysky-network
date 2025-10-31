// test-api.js

const axios = require('axios');

const testReferral = async () => {
  try {
    const response = await axios.post('https://flysky-referral-api.onrender.com/addReferral', {
      referrerCode: 'WSGoELnM', // ✅ كود المحيل
      newUserEmail: 'test@email.com' // ✅ بريد المستخدم الجديد
    });

    console.log('✅ Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ Error Response:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
};

testReferral();
