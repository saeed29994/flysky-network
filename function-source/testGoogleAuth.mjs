import { OAuth2Client } from 'google-auth-library';

console.log('🔍 OAuth2Client:', OAuth2Client);

const client = new OAuth2Client(
  'test-client-id',
  'test-client-secret'
);

console.log('✅ مكتبة Google تعمل بنجاح.');
