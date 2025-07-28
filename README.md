# Flysky Network WebView Mobile Apps

This repository contains the Flysky Network web application along with WebView builds for Android and iOS using Capacitor.

## Project Structure

- `/src` - The React web application source code
- `/android` - Android WebView application
- `/ios` - iOS WebView application 
- `/dist` - Built web application ready for deployment

## Prerequisites

- Node.js 16+ and npm
- For Android:
  - Android Studio 4.2+
  - Android SDK with API level 31+
  - Java Development Kit (JDK) 11+
- For iOS:
  - Xcode 13+
  - CocoaPods
  - macOS machine

## Getting Started

### Web Application

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Build the web application:
   ```
   npm run build
   ```

### Building the Android App

1. After building the web application, sync the Capacitor project:
   ```
   npx cap sync android
   ```

2. Open Android Studio:
   ```
   npx cap open android
   ```

3. In Android Studio:
   - Ensure you have a valid Firebase configuration file (`google-services.json`) in the `/android/app/` directory
   - Update the application ID in `build.gradle` if needed
   - Build and run the application on a device or emulator

4. Build an APK or App Bundle:
   - In Android Studio, select `Build > Build Bundle(s) / APK(s) > Build APK`
   - Or for release: `Build > Generate Signed Bundle / APK`

### Building the iOS App

1. After building the web application, sync the Capacitor project:
   ```
   npx cap sync ios
   ```

2. Open Xcode:
   ```
   npx cap open ios
   ```

3. In Xcode:
   - Make sure you have a valid Team selected for signing
   - Ensure you have a valid Firebase configuration file (`GoogleService-Info.plist`) in the Xcode project
   - Update the Bundle ID if needed
   - Add Push Notification capability in the Signing & Capabilities tab

4. Build and run the application on a device or simulator:
   - Select a device/simulator from the dropdown
   - Click the Run button (or press Cmd+R)

5. For distribution:
   - Choose a real device as the build target
   - Select `Product > Archive`
   - Follow the distribution workflow in the Organizer window

## Features

- **Firebase Integration**: Push notifications work on both platforms
- **Responsive Design**: The web app is optimized for mobile devices
- **Offline Support**: App can function without constant internet connection
- **Native Look & Feel**: Status bar and navigation styling match native apps

## Configuration

Capacitor configuration is managed in `capacitor.config.ts`. You can modify settings like:
- App name and ID
- Status bar appearance
- Splash screen settings
- Background color
- Deep linking

## Troubleshooting

- **White screen on app launch**: Check the web build output and ensure all paths are relative
- **Push notifications not working**: Verify Firebase configuration and ensure proper permissions
- **Styling issues**: Check the responsive design in the web application
- **Build errors**: Ensure all native dependencies are properly installed

## Updating the App

To update the app after making changes to the web application:

1. Build the web app: `npm run build`
2. Copy the changes to native projects: `npx cap copy`
3. Sync the plugins if you've added new ones: `npx cap sync`
4. Open the native IDEs to build and test: `npx cap open android` or `npx cap open ios` 
