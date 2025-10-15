// In-App Purchase Configuration

// RevenueCat API Key
export const REVENUECAT_API_KEY = {
  android: import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY,
  ios: import.meta.env.VITE_REVENUECAT_IOS_API_KEY,
};

// Product IDs for each platform
export const PRODUCT_IDS = {
  // Android product IDs (Google Play)
  android: {
    'first-lifetime': 'firstclass_lifetime',
    'first-6': 'io.fsncrew.app.first_6months:firsclass-6',
    'business': 'io.fsncrew.app.business_monthly:bussiness-monthly',
  },
  // iOS product IDs (App Store)
  ios: {
    'first-lifetime': 'io.fsncrew.app.firstclass_lifetimee',
    'first-6': 'io.fsncrew.app.first_6months_subscription',
    'business': 'io.fsncrew.app.business_monthly_subscription',
  }
};

// Subscription types
export enum SubscriptionType {
  LIFETIME = 'lifetime',
  MONTHLY = 'monthly',
  SIX_MONTHS = 'six_months',
}

// Mapping plan IDs to subscription types
export const PLAN_SUBSCRIPTION_TYPE = {
  'first-lifetime': SubscriptionType.LIFETIME,
  'first-6': SubscriptionType.SIX_MONTHS,
  'business': SubscriptionType.MONTHLY,
};

// Entitlement IDs for RevenueCat
export const ENTITLEMENT_IDS = {
  premium: 'premium_membership',
};
