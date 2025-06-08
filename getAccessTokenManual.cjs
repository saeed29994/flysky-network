const axios = require('axios');
const qs = require('qs');
const fs = require('fs');

const credentials = JSON.parse(
  fs.readFileSync('client_secret_3676998780-cgahhfcq14motvqkqqct8m65ubdsg3mt.apps.googleusercontent.com.json')
);

const { client_id, client_secret, redirect_uris } = credentials.web;
const code = '4/0AUJR-x5oamTEvk7w-uErOeYTTMOKNip_2o5u05MqEC6v6J-I_1wvlojxzZjJwIxaZe62uw';

const data = {
  code,
  client_id,
  client_secret,
  redirect_uri: redirect_uris[0],
  grant_type: 'authorization_code',
};

axios
  .post('https://oauth2.googleapis.com/token', qs.stringify(data), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  .then((res) => {
    console.log('✅ Access Token:', res.data);
  })
  .catch((err) => {
    console.error('❌ Error retrieving access token', err.response.data);
  });
