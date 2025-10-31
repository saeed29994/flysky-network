import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.fsncrew.app',
  appName: 'Flysky Network',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#000000",
      overlaysWebView: true,
      show: true
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
      // Add Android-specific FCM configuration
      android: {
        defaultChannelId: "default",
        defaultChannelName: "Default Channel",
        defaultChannelDescription: "Default notification channel",
        defaultChannelImportance: 4,
        defaultChannelSound: "default",
        defaultChannelVibrationPattern: [0, 250, 250, 250],
        defaultChannelLightColor: "#FF231F7C",
      }
    },
    AppleSignIn: {
      // Apple Sign In configuration
      // This plugin doesn't require specific configuration
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true
  },
  server: {
    hostname: "localhost",
    androidScheme: "https",
    iosScheme: "https"
  }
};

export default config;
