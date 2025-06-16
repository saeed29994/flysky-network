const { google } = require('google-auth-library');

console.log('🔍 google:', google);

const client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID_HERE',
  'YOUR_CLIENT_SECRET_HERE'
);

console.log('✅ مكتبة Google تعمل بنجاح.');
