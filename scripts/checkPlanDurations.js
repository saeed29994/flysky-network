#!/usr/bin/env node

/**
 * Check Plan Durations Script
 * Shows the duration settings for all plans in Firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase config
const firebaseConfig = JSON.parse(readFileSync(join(__dirname, '../firebaseConfig.cjs'), 'utf8'));

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPlanDurations() {
  console.log('🔍 Checking plan durations in Firebase...\n');
  
  try {
    const plansSnapshot = await getDocs(collection(db, 'plans'));
    
    if (plansSnapshot.empty) {
      console.log('❌ No plans found in Firebase plans collection');
      return;
    }
    
    console.log('📋 Plan durations:');
    console.log('==================');
    
    plansSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nPlan ID: ${doc.id}`);
      console.log(`Name: ${data.name || 'N/A'}`);
      console.log(`Duration: ${data.durationDays || 'Not set'} days`);
      console.log(`Price: $${data.price || 'N/A'}`);
      console.log(`Features: ${data.features ? data.features.length : 0} features`);
      
      // Calculate what the subscription end would be if purchased now
      if (data.durationDays) {
        const now = Math.floor(Date.now() / 1000);
        const subscriptionEnd = now + (data.durationDays * 24 * 60 * 60);
        console.log(`If purchased now, would expire: ${new Date(subscriptionEnd * 1000).toLocaleString()}`);
      }
    });
    
    console.log('\n✅ Plan check completed!');
    
  } catch (error) {
    console.error('❌ Error checking plans:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkPlanDurations();
