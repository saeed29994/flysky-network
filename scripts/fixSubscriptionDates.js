#!/usr/bin/env node

/**
 * Fix Subscription Dates Script
 * Recalculates subscription end dates based on actual plan durations from Firebase
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccount = JSON.parse(readFileSync(join(__dirname, '../firebaseConfig.cjs'), 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixSubscriptionDates() {
  console.log('🔧 Starting subscription date fix...\n');
  
  try {
    // First, get all plans to understand durations
    const plansSnapshot = await db.collection('plans').get();
    const plansData = {};
    
    plansSnapshot.forEach(doc => {
      const data = doc.data();
      plansData[doc.id] = {
        id: doc.id,
        name: data.name,
        durationDays: data.durationDays || 30,
        price: data.price
      };
    });
    
    console.log('📋 Available plans:', plansData);
    console.log('');
    
    // Get all users with membership data
    const usersSnapshot = await db.collection('users').get();
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const membership = userData.membership;
        
        if (!membership || !membership.planName) {
          continue; // Skip users without membership
        }
        
        const planId = membership.planName;
        const plan = plansData[planId];
        
        if (!plan) {
          console.log(`⚠️ Plan ${planId} not found in plans collection for user ${userDoc.id}`);
          continue;
        }
        
        // Get subscription start date
        let subscriptionStart = membership.subscriptionStart;
        if (!subscriptionStart) {
          // If no start date, use purchase date or current time
          subscriptionStart = membership.purchaseDate?.seconds || Math.floor(Date.now() / 1000);
        }
        
        // Calculate correct subscription end date
        const correctSubscriptionEnd = subscriptionStart + (plan.durationDays * 24 * 60 * 60);
        
        // Check if the current end date is incorrect
        const currentEnd = membership.subscriptionEnd;
        const needsFix = !currentEnd || Math.abs(currentEnd - correctSubscriptionEnd) > 3600; // More than 1 hour difference
        
        if (needsFix) {
          console.log(`🔧 Fixing user ${userDoc.id}:`);
          console.log(`   Plan: ${plan.name} (${plan.durationDays} days)`);
          console.log(`   Start: ${new Date(subscriptionStart * 1000).toLocaleString()}`);
          console.log(`   Old End: ${currentEnd ? new Date(currentEnd * 1000).toLocaleString() : 'None'}`);
          console.log(`   New End: ${new Date(correctSubscriptionEnd * 1000).toLocaleString()}`);
          
          // Update the user's membership data
          await userDoc.ref.update({
            'membership.subscriptionStart': subscriptionStart,
            'membership.subscriptionEnd': correctSubscriptionEnd,
            'membership.isActive': correctSubscriptionEnd > Math.floor(Date.now() / 1000)
          });
          
          fixedCount++;
          console.log(`   ✅ Fixed!\n`);
        } else {
          console.log(`✅ User ${userDoc.id} subscription dates are correct\n`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${userDoc.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Subscription date fix completed!`);
    console.log(`   Fixed: ${fixedCount} users`);
    console.log(`   Errors: ${errorCount} users`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixSubscriptionDates();
