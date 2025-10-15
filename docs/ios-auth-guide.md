# iOS Authentication Guide

## Overview

The iOS app uses Firebase email/password authentication only. Google Sign-in has been disabled for iOS to simplify the authentication flow and avoid potential issues with URL schemes and callbacks.

## Authentication Flow

1. Users can sign in using email and password
2. Firebase handles the authentication process directly
3. Google Sign-in buttons are hidden on iOS devices

## Applying Changes

To apply the authentication changes to your iOS app:

1. Sync Capacitor with the latest changes:
```
npx cap sync ios
```

2. Copy updated web assets to the iOS platform:
```
npx cap copy ios
```

3. Open the iOS project in Xcode:
```
npx cap open ios
```

4. Build and run the app on a simulator or physical device

## Troubleshooting

If you encounter authentication issues:

1. Verify Firebase is properly configured in AppDelegate.swift
2. Check that FirebaseApp.configure() is called in didFinishLaunchingWithOptions
3. Ensure Info.plist contains the correct bundle ID matching your Firebase project
4. Confirm that the GoogleService-Info.plist file is properly included in the app bundle

## Development Notes

- Google Sign-in functionality is disabled on iOS through platform detection
- The app automatically hides Google Sign-in buttons on iOS devices
- Email/password authentication works without any URL scheme handling
