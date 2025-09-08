# In-App Purchase Implementation

This document provides an overview of the in-app purchase (IAP) implementation for the Flysky Network app.

## Architecture Overview

The IAP system is built using:
- **RevenueCat SDK**: For cross-platform purchase management
- **Capacitor**: For native integration
- **Firebase**: For server-side verification and user membership storage

### Files Structure

```
src/
├── services/
│   └── IAPService.ts       # Core IAP functionality
├── utils/
│   └── iapConfig.ts        # IAP configuration and product IDs
├── components/
│   └── SubscribeModal.tsx  # UI for initiating purchases
```

## Setup Instructions

### 1. RevenueCat Setup

1. Create an account at [revenuecat.com](https://www.revenuecat.com/)
2. Create a new project
3. Connect your Google Play and App Store accounts
4. Get your API keys and update them in `src/utils/iapConfig.ts`

### 2. Google Play Setup

Follow the instructions in [android-iap-setup.md](./android-iap-setup.md) to:
1. Configure your Google Play Developer account
2. Set up your products with the correct IDs
3. Configure test accounts

### 3. App Store Setup

Follow the instructions in [ios-iap-setup.md](./ios-iap-setup.md) to:
1. Configure your App Store Connect account
2. Set up your products with the correct IDs
3. Configure sandbox test accounts

## Implementation Details

### Product IDs

The following product IDs are defined in `iapConfig.ts`:

| Plan | Android Product ID | iOS Product ID | Price | Bonus |
|------|-------------------|---------------|-------|-------|
| First Class (Lifetime) | io.fsncrew.app.first_lifetime | io.fsncrew.app.first_lifetime | $1990 | 1,500,000 FSN |
| First Class (6 Months) | io.fsncrew.app.first_6months | io.fsncrew.app.first_6months | $120 | 1,000,000 FSN |
| Business Class | io.fsncrew.app.business_monthly | io.fsncrew.app.business_monthly | $15/month | 100,000 FSN |

### Purchase Flow

1. User selects a membership plan in the MembershipPage
2. SubscribeModal opens with plan details
3. User clicks "Purchase Now"
4. IAPService initiates the purchase through RevenueCat
5. On successful purchase:
   - RevenueCat validates the receipt with Apple/Google
   - IAPService updates the user's membership in Firebase
   - UI updates to reflect the new membership status

### Restore Purchases Flow

1. User clicks "Restore Purchases" in the SubscribeModal
2. IAPService calls RevenueCat's restore method
3. RevenueCat validates previously purchased products
4. If valid purchases are found, IAPService updates the user's membership in Firebase
5. UI updates to reflect the restored membership

## Firebase Integration

The IAP system updates two Firebase collections:

1. **users/{userId}**: Updates the membership field with:
   - planName: The purchased plan ID
   - subscriptionEnd: Timestamp when the subscription ends
   - purchaseDate: Timestamp of the purchase
   - platform: 'ios' or 'android'
   - isActive: Boolean indicating if the membership is active

2. **purchases/{userId}_{timestamp}**: Creates a record of each purchase with:
   - userId: The user's ID
   - planId: The purchased plan ID
   - purchaseDate: Timestamp of the purchase
   - subscriptionEnd: Timestamp when the subscription ends
   - platform: 'ios' or 'android'
   - receiptInfo: Details about the purchase receipt

## Testing

Refer to [iap-testing-guide.md](./iap-testing-guide.md) for detailed testing instructions for both platforms.

## Troubleshooting

### Common Issues

1. **Products not loading**:
   - Verify product IDs match exactly in both app and store console
   - Check that the app is properly signed and using the correct bundle ID/package name

2. **Purchase successful but membership not updated**:
   - Check Firebase rules to ensure write permissions
   - Verify the user is authenticated
   - Check for errors in the console logs

3. **Restore purchases not working**:
   - Verify the user is using the same account that made the original purchase
   - Check that the purchase hasn't been refunded or cancelled

## Future Improvements

1. Implement subscription management UI
2. Add server-side receipt validation
3. Implement promotional offers and discounts
4. Add analytics for purchase conversion tracking
