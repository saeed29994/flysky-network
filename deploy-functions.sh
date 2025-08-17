#!/bin/bash

echo "🚀 Deploying Firebase Cloud Functions..."

# Deploy only the functions that exist and are needed
firebase deploy --only functions:sendManualNotification,functions:processScheduledNotifications,functions:sendInternationalizedAdminNotification,functions:notifyMiningComplete,functions:notifyNewMessage,functions:notifyReferralBonus,functions:sendDailyReminders

echo "✅ Deployment completed!"
echo "🔧 The sendManualNotification function is kept for future use"
echo "🌍 The sendInternationalizedAdminNotification function handles all current notifications"
echo "📊 Functions deployed: sendManualNotification, processScheduledNotifications, sendInternationalizedAdminNotification, notifyMiningComplete, notifyNewMessage, notifyReferralBonus, sendDailyReminders"
