// getAccessToken.cjs
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// تحميل بيانات العميل من الملف
const credentials = require('./client_secret_3676998780-s2ab8f49qhg4l9n3no7bu5924rokveo8.apps.googleusercontent.com.json');
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// الخطوات للحصول على الرابط ومن ثم إدخال الكود
const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n🔗 افتح هذا الرابط في المتصفح للحصول على الكود:\n');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n📥 أدخل الكود هنا: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('❌ فشل الحصول على التوكن:', err);
      return;
    }
    oAuth2Client.setCredentials(token);
    fs.writeFileSync('access_token.json', JSON.stringify(token));
    console.log('✅ تم حفظ التوكن بنجاح في access_token.json');
  });
});
