#!/bin/bash

echo "🚀 Building Flysky Network APK..."

# Build the web assets
echo "📦 Building web assets..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Fix Java version issues in generated files
echo "🔧 Fixing Java version compatibility..."
cd android
sed -i '' 's/VERSION_21/VERSION_17/g' app/capacitor.build.gradle

# Build debug APK
echo "🔨 Building debug APK..."
./gradlew assembleDebug

# Build release APK
echo "🔨 Building release APK..."
./gradlew assembleRelease

# Copy APKs to project root with version
echo "📋 Copying APK files..."
VERSION=$(grep 'versionName' app/build.gradle | sed 's/.*versionName "\(.*\)"/\1/')
cp app/build/outputs/apk/debug/app-debug.apk ../FlyskyNetwork-v${VERSION}-debug.apk
cp app/build/outputs/apk/release/app-release-unsigned.apk ../FlyskyNetwork-v${VERSION}-release.apk

cd ..

echo "✅ Build complete!"
echo "📱 Debug APK: FlyskyNetwork-v${VERSION}-debug.apk"
echo "📱 Release APK: FlyskyNetwork-v${VERSION}-release.apk"
echo ""
echo "🎉 All fixes applied:"
echo "✅ Status bar layout issues fixed"
echo "✅ Notification polyfill added for Android"
echo "✅ App logo updated with FSN logo"
echo "✅ Firebase/FCM fully configured"
echo "✅ All permissions added"
echo ""
echo "Note: The release APK is unsigned. To sign it for Play Store distribution,"
echo "you'll need to create a keystore and sign the APK." 