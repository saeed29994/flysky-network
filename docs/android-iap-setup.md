# Google Play Store In-App Purchase Setup Guide

This guide explains how to set up in-app purchases for your Android app in the Google Play Console.

## Prerequisites

1. A Google Play Developer account ($25 one-time fee)
2. Your app must be published on Google Play (at least as a draft)
3. A Google Payments merchant account

## Steps to Configure In-App Purchases

### 1. Create a Google Play Developer Account

If you don't have one already, sign up at [play.google.com/apps/publish](https://play.google.com/apps/publish).

### 2. Set Up Your Merchant Account

1. Go to your Google Play Console
2. Navigate to **Setup > Account details > Payments profile**
3. Follow the steps to create a merchant account if you don't have one

### 3. Create In-App Products

1. Go to your Google Play Console
2. Select your app
3. Navigate to **Monetize > Products > In-app products**
4. Click **Create product**

For each membership plan, create a product with the following details:

#### First Class (Lifetime)
- **Product ID**: `io.fsncrew.app.first_lifetime`
- **Name**: First Class (Lifetime)
- **Description**: Lifetime access to premium features with highest mining rate (6000 FSN/12h)
- **Price**: $199 USD
- **Product type**: One-time purchase (Managed product)
- **Bonus**: 1,500,000 FSN tokens

#### First Class (6 Months)
- **Product ID**: `io.fsncrew.app.first_6months`
- **Name**: First Class (6 Months)
- **Description**: 6 months of premium access with highest mining rate (6000 FSN/12h)
- **Price**: $120 USD
- **Product type**: One-time purchase (Managed product)
- **Bonus**: 1,000,000 FSN tokens

#### Business Class
- **Product ID**: `io.fsncrew.app.business_monthly`
- **Name**: Business Class
- **Description**: Monthly business membership with advanced mining (3000 FSN/12h)
- **Price**: $15 USD
- **Product type**: Subscription
- **Subscription period**: Monthly
- **Bonus**: 100,000 FSN tokens
- **Free trial period**: (Optional)
- **Grace period**: Recommended 3 days

### 4. Configure License Testing

To test purchases without actual charges:

1. Go to **Setup > License Testing**
2. Add the email addresses of your testers
3. Save changes

### 5. Create a RevenueCat Account

1. Sign up at [revenuecat.com](https://www.revenuecat.com/)
2. Create a new project
3. Connect your Google Play account
4. Get your API keys
5. Update the API keys in your app's `iapConfig.ts` file

### 6. Important Notes

- Google takes a 15-30% commission on all in-app purchases
- Prices must comply with Google Play pricing guidelines
- You must clearly communicate subscription terms to users
- You must provide a privacy policy
- Real purchases can only be tested on a published app (can be internal test track)

### 7. Testing Your Integration

1. Publish your app to an internal test track
2. Add test users to the track
3. Have testers install the app from the Play Store
4. Use license testing accounts to make test purchases

### 8. Going Live

1. Ensure all products are in "Active" status
2. Publish your app update to production
3. Monitor purchase analytics in both Google Play Console and RevenueCat dashboard
