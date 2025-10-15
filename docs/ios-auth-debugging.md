# iOS Authentication Debugging Guide

## Common iOS Authentication Issues

This guide addresses common issues with Firebase authentication on iOS using Capacitor.

## Prerequisites

Before troubleshooting, ensure:

1. Firebase is properly configured in your project
2. GoogleService-Info.plist is in the correct location
3. URL schemes are properly registered in Info.plist
4. Capacitor Firebase Authentication plugin is installed

## Debugging Steps

### 1. Verify URL Scheme Configuration

Ensure the URL scheme in Info.plist matches the REVERSED_CLIENT_ID from GoogleService-Info.plist.

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
        </array>
    </dict>
</array>
```

### 2. Check Capacitor Configuration

In `capacitor.config.ts`, ensure the iOS scheme is set to "https":

```typescript
server: {
  hostname: "localhost",
  androidScheme: "https",
  iosScheme: "https" // Not "capacitor"
}
```

### 3. Verify AppDelegate Implementation

Ensure AppDelegate.swift includes:

```swift
// Required imports
import FirebaseCore
import FirebaseAuth
import GoogleSignIn

// In didFinishLaunchingWithOptions:
if let clientID = FirebaseApp.app()?.options.clientID {
    GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
}

// Handle URL opening
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if GIDSignIn.sharedInstance.handle(url) {
        return true
    }
    return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
}
```

### 4. Common Error Patterns and Solutions

#### "Missing idToken" Error

Problem: The authentication completes but idToken is missing.
Solution: Ensure you're using the latest version of Capacitor Firebase Authentication plugin.

#### Authentication Popup Not Showing

Problem: The sign-in prompt doesn't appear.
Solution: 
- Verify URL schemes are correctly configured
- Check for console errors related to opening URLs
- Ensure iOS app has a valid bundle ID matching Firebase configuration

#### Authentication Returns but App Doesn't Respond

Problem: The authentication flow completes in Safari but doesn't return to the app.
Solution:
- Verify URL scheme handling in AppDelegate.swift
- Check that the REVERSED_CLIENT_ID in Info.plist is correct
- Test using the iOS simulator first, then a physical device

### 5. Testing Authentication

To validate your setup:

1. Add extensive logging around authentication calls
2. Enable verbose logging in Xcode Console
3. Test on both simulator and physical device
4. Check Xcode logs for authentication flow issues

### 6. Specific Platform Issues

#### iOS 14+
- Ensure App Tracking Transparency permissions are correctly handled
- Use the latest version of Firebase SDK and Google Sign In

#### iOS Simulator vs Device
- Authentication flows can behave differently on simulator vs device
- Always test on a physical device before deployment

### 7. Advanced Debugging

If issues persist:

1. Use Xcode debugging tools to trace authentication calls
2. Enable Firebase debugging (`FirebaseOptions.shared.debugEnabled = true`)
3. Check the Apple Developer portal for any issues with your app ID
4. Verify all certificates and provisioning profiles

## Resources

- [Capacitor Firebase Authentication Documentation](https://github.com/capawesome-team/capacitor-firebase)
- [Google Sign In for iOS Documentation](https://developers.google.com/identity/sign-in/ios)
- [Firebase iOS Authentication](https://firebase.google.com/docs/auth/ios/start)
