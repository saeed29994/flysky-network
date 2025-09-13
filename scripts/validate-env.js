#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_WEB_APP_ID',
  'VITE_FIREBASE_ANDROID_APP_ID',
  'VITE_FIREBASE_IOS_APP_ID',
  'VITE_FIREBASE_VAPID_KEY',
  'VITE_REVENUECAT_ANDROID_API_KEY',
  'VITE_REVENUECAT_IOS_API_KEY'
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('📝 Please copy .env.example to .env and fill in your values.');
    process.exit(1);
  }
  
  // Load environment variables
  require('dotenv').config();
  
  let allValid = true;
  const missing = [];
  const present = [];
  
  REQUIRED_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
      allValid = false;
    } else {
      present.push(varName);
    }
  });
  
  // Display results
  if (present.length > 0) {
    console.log('✅ Present variables:');
    present.forEach(varName => {
      const value = process.env[varName];
      const masked = value.length > 8 ? 
        value.substring(0, 4) + '...' + value.substring(value.length - 4) : 
        '***';
      console.log(`   ${varName}: ${masked}`);
    });
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing variables:');
    missing.forEach(varName => {
      console.log(`   ${varName}`);
    });
    console.log('');
  }
  
  if (allValid) {
    console.log('🎉 All environment variables are properly configured!');
    console.log('🚀 You can now run the application safely.');
  } else {
    console.log('⚠️  Some environment variables are missing.');
    console.log('📝 Please update your .env file with the missing values.');
    process.exit(1);
  }
}

// Run validation
validateEnvironment();
