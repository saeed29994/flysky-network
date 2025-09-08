# Apple App Store In-App Purchase Setup Guide

This guide explains how to set up in-app purchases for your iOS app in App Store Connect.

## Prerequisites

1. An Apple Developer account ($99/year)
2. Your app must be registered in App Store Connect
3. Xcode installed on your Mac

## Steps to Configure In-App Purchases

### 1. Create an App Record in App Store Connect

If you haven't already:
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to **Apps**
3. Click the **+** button to create a new app or select your existing app

### 2. Set Up App Store Capabilities in Xcode

1. Open your project in Xcode
2. Select your target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **In-App Purchase**
6. Make sure your app is properly signed with your developer account

### 3. Create In-App Purchase Products

1. In App Store Connect, select your app
2. Go to **Features > In-App Purchases**
3. Click the **+** button to add a new in-app purchase

For each membership plan, create a product with the following details:

#### First Class (Lifetime)
- **Type**: Non-Consumable
- **Reference Name**: First Class (Lifetime)
- **Product ID**: `io.fsncrew.app.first_lifetime`
- **Price**: $1990 USD
- **Description**: Lifetime access to premium features with highest mining rate (6000 FSN/12h) + 1,500,000 FSN bonus
- Fill in all required metadata (description, review information)

#### First Class (6 Months)
- **Type**: Non-Renewable Subscription
- **Reference Name**: First Class (6 Months)
- **Product ID**: `io.fsncrew.app.first_6months`
- **Price**: $120 USD
- **Duration**: 6 Months
- **Description**: 6 months of premium access with highest mining rate (6000 FSN/12h) + 1,000,000 FSN bonus
- Fill in all required metadata (description, review information)

#### Business Class
- **Type**: Auto-Renewable Subscription
- **Reference Name**: Business Class
- **Product ID**: `io.fsncrew.app.business_monthly`
- **Subscription Group**: Create a new group or use existing
- **Price**: $15 USD
- **Duration**: 1 Month
- **Description**: Monthly business membership with advanced mining (3000 FSN/12h) + 100,000 FSN bonus
- Fill in all required metadata (description, review information)

### 4. Create a Subscription Group (for Auto-Renewable Subscriptions)

For the Business Monthly Membership:
1. Create a subscription group if you don't have one
2. Set up subscription localization details
3. Configure subscription display name

### 5. Set Up Sandbox Testing

1. Go to **Users and Access > Sandbox > Testers**
2. Click **+** to add a sandbox tester
3. Fill in the required information
4. Save the tester account

### 6. Create a RevenueCat Account

1. Sign up at [revenuecat.com](https://www.revenuecat.com/)
2. Create a new project
3. Connect your App Store account
4. Get your API keys
5. Update the API keys in your app's `iapConfig.ts` file

### 7. App Store Review Information

For each in-app purchase, you'll need to provide:
- Screenshot of the purchase in your app
- Review notes explaining how to test the purchase
- Contact information for the reviewer

### 8. Important Notes

- Apple takes a 15-30% commission on all in-app purchases
- You must use Apple's payment system for digital goods and services
- You cannot mention alternative payment methods in your app
- You must clearly communicate subscription terms to users
- You must provide a privacy policy
- Real purchases can only be tested with sandbox accounts

### 9. Testing Your Integration

1. Build and run your app on a device or simulator
2. Log out of your personal Apple ID on the device
3. Log in with a sandbox tester account
4. Make test purchases in your app

### 10. Going Live

1. Ensure all products are in "Ready to Submit" status
2. Submit your app update for review
3. Monitor purchase analytics in both App Store Connect and RevenueCat dashboard

### 11. App Store Guidelines Compliance

Make sure your app complies with:
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [In-App Purchase Requirements](https://developer.apple.com/in-app-purchase/)
- [Auto-Renewable Subscription Guidelines](https://developer.apple.com/app-store/subscriptions/)
