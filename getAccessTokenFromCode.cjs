const fs = require('fs');
const { google } = require('googleapis');

// تحميل بيانات الاعتماد من ملف JSON الصحيح
const credentials = JSON.parse(
  fs.readFileSync('client_secret_3676998780-cgahhfcq14motvqkqqct8m65ubdsg3mt.apps.googleusercontent.com.json')
);

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// أدخل الكود الذي حصلت عليه من الرابط هنا
const code = '4/0AUJR-x7fVSb8WHuw3fAGWRTezoF6EXF0W1_upXf9k5CgSbCIneqFCfjAg0P9Jz_xxynZ9A';

oAuth2Client.getToken(code, (err, token) => {
  if (err) {
    console.error('❌ Error retrieving access token', err);
    return;
  }
  console.log('✅ Access Token:', token);
});
