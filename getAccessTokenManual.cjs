const axios = require('axios');
const qs = require('qs');

// بيانات OAuth الخاصة بك
const client_id = '3676998780-s2ab8f49qhg4l9n3no7bu5924rokveo8.apps.googleusercontent.com';
const client_secret = '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';
const redirect_uri = 'urn:ietf:wg:oauth:2.0:oob';

// STEP 1: اذهب لهذا الرابط وافتحه في المتصفح للحصول على كود يدوي
const auth_url = `https://accounts.google.com/o/oauth2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=https://www.googleapis.com/auth/firebase.messaging&response_type=code`;

console.log("🔑 افتح هذا الرابط في المتصفح:");
console.log(auth_url);
console.log("\nثم الصق الكود هنا:");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('OAuth Code: ', async (code) => {
  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('\n✅ Access Token:\n', response.data.access_token);
    console.log('\n⏳ Expires In:', response.data.expires_in, 'seconds');
  } catch (err) {
    console.error('❌ Error retrieving access token:', err.response?.data || err.message);
  }

  readline.close();
});
