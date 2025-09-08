# In-App Purchase Testing Guide

This guide provides instructions for testing in-app purchases in both Android and iOS environments.

## Prerequisites

1. You have set up your app with the RevenueCat plugin
2. You have configured products in both Google Play Console and App Store Connect
3. You have updated your app code with the IAP implementation

## Android Testing

### Test Environment Setup

1. **Create Test Accounts**:
   - Go to Google Play Console > Setup > License Testing
   - Add the email addresses you want to use for testing
   - These accounts will be able to make purchases without being charged

2. **Publish to Internal Testing Track**:
   - Create a new release in the internal testing track
   - Upload your signed APK/AAB
   - Add your testers to the internal testing track

3. **Install from Play Store**:
   - Have testers install the app from the Play Store (not via direct APK)
   - This is crucial as IAP only works with Play Store installed apps

### Testing Process

1. **Test Account Login**:
   - Make sure testers are logged into their test Google account on the device
   - The account must be added to license testing

2. **Basic Purchase Flow**:
   - Open the app and navigate to the membership page
   - Select a plan and tap "Purchase Now"
   - Verify that the Google Play purchase dialog appears
   - Complete the purchase flow
   - Verify that the membership status updates correctly

3. **Restore Purchases**:
   - Log out of the app
   - Log back in with the same account
   - Tap "Restore Purchases"
   - Verify that the membership is correctly restored

4. **Error Handling**:
   - Test cancelling a purchase
   - Test network interruptions during purchase
   - Verify appropriate error messages are displayed

## iOS Testing

### Test Environment Setup

1. **Create Sandbox Testers**:
   - Go to App Store Connect > Users and Access > Sandbox > Testers
   - Create new sandbox tester accounts
   - These accounts will be used for testing purchases without actual charges

2. **TestFlight Setup**:
   - Upload your app to TestFlight
   - Add external testers or use internal testing
   - Make sure your app has the "In-App Purchases" capability enabled

3. **Device Setup**:
   - Log out of the production Apple ID on the test device
   - Log in with the sandbox tester account
   - Do not use the sandbox account for any other purposes

### Testing Process

1. **Basic Purchase Flow**:
   - Open the app and navigate to the membership page
   - Select a plan and tap "Purchase Now"
   - Verify that the App Store purchase dialog appears
   - Complete the purchase with the sandbox account
   - Verify that the membership status updates correctly

2. **Restore Purchases**:
   - Delete and reinstall the app
   - Log in with the same user account
   - Tap "Restore Purchases"
   - Verify that the membership is correctly restored

3. **Error Handling**:
   - Test cancelling a purchase
   - Test network interruptions
   - Verify appropriate error messages are displayed

## RevenueCat Dashboard Verification

After completing test purchases:

1. Log in to your RevenueCat dashboard
2. Navigate to the Customers section
3. Search for your test user
4. Verify that purchases are correctly recorded
5. Check that entitlements are properly assigned

## Common Issues and Troubleshooting

### Android Issues

1. **"Item not found" error**:
   - Ensure product IDs in the app match exactly with Google Play Console
   - Verify that the app's package name matches the one in Google Play Console
   - Make sure the app is installed from the Play Store

2. **"Purchase failed" error**:
   - Verify the test account is added to license testing
   - Check that the Google Play Store app is updated
   - Clear Google Play Store cache and data

### iOS Issues

1. **"Cannot connect to iTunes Store" error**:
   - Make sure you're signed in with a sandbox tester account
   - Verify the sandbox account has never been used for real purchases
   - Check your internet connection

2. **Products not loading**:
   - Verify product IDs match exactly with App Store Connect
   - Ensure products are "Approved" in App Store Connect
   - Check that the app's bundle ID matches the one in App Store Connect

## Final Verification Checklist

- [ ] All membership plans can be purchased
- [ ] Membership status updates correctly in the app
- [ ] Firebase database records are updated with purchase information
- [ ] Restore purchases functionality works correctly
- [ ] Appropriate error handling for all edge cases
- [ ] UI elements update correctly after purchase (buttons, status indicators)
- [ ] RevenueCat dashboard shows correct purchase data
