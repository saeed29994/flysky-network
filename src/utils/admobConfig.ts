// AdMob Configuration
// Replace these with your actual AdMob App IDs and Ad Unit IDs from Google AdMob Console

export const AdMobConfig = {
  // AdMob App IDs (required for both platforms)
  // Get these from: https://apps.admob.com/v2/apps
  appId: {
    android: 'ca-app-pub-3940256099942544~3347511713', // Test App ID - Replace with your real Android App ID
    ios: 'ca-app-pub-8961382213660927~7930046231', // Your iOS App ID
  },

  // Rewarded Ad Unit IDs (for Watch to Earn)
  // Get these from: https://apps.admob.com/v2/apps -> Your App -> Ad Units
  rewardedAdUnitId: {
    android: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Ad - Replace with your real Android Rewarded Ad Unit ID
    ios: 'ca-app-pub-8961382213660927/8828252405', // Your iOS Rewarded Ad Unit ID
  },

  // Test Mode (set to false in production)
  // When true, uses test ads even if real IDs are provided
  testMode: true, // Set to false when ready for production
};

// Helper function to get the correct ad unit ID based on platform
export const getRewardedAdUnitId = (platform: string): string => {
  if (platform === 'ios') {
    return AdMobConfig.rewardedAdUnitId.ios;
  }
  return AdMobConfig.rewardedAdUnitId.android;
};

// Helper function to get the correct app ID based on platform
export const getAppId = (platform: string): string => {
  if (platform === 'ios') {
    return AdMobConfig.appId.ios;
  }
  return AdMobConfig.appId.android;
};

