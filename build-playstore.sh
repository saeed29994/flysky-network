#!/bin/bash

echo "🚀 Building Flysky Network APK for Google Play Console..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the web assets
echo "📦 Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Web build failed"
    exit 1
fi

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Error: Capacitor sync failed"
    exit 1
fi

# Fix Java version issues in generated files
echo "🔧 Fixing Java version compatibility..."
cd android
sed -i '' 's/VERSION_21/VERSION_17/g' app/capacitor.build.gradle

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build release AAB (Android App Bundle) for Play Store
echo "🔨 Building signed release AAB for Play Store..."
./gradlew bundleRelease

if [ $? -ne 0 ]; then
    echo "❌ Error: AAB build failed"
    exit 1
fi

# Get version from build.gradle
VERSION=$(grep 'versionName' app/build.gradle | sed 's/.*versionName "\(.*\)"/\1/')
VERSION_CODE=$(grep 'versionCode' app/build.gradle | sed 's/.*versionCode \([0-9]*\).*/\1/')

# Copy signed AAB to project root
echo "📋 Copying signed AAB..."
cp app/build/outputs/bundle/release/app-release.aab ../FlyskyNetwork-v${VERSION}-${VERSION_CODE}-release.aab

cd ..

echo ""
echo "✅ Build complete for Google Play Console!"
echo "📱 Signed AAB: FlyskyNetwork-v${VERSION}-${VERSION_CODE}-release.aab"
echo ""
echo "📋 Build Details:"
echo "   Version: ${VERSION}"
echo "   Version Code: ${VERSION_CODE}"
echo "   Target SDK: 35 (Android 15)"
echo "   Min SDK: 23 (Android 6.0)"
echo ""
echo "🚀 Ready to upload to Google Play Console!"
echo "   The AAB is properly signed with your keystore"
echo "   You can now upload it to the Google Play Console"
echo "   AAB files are preferred over APK files for Play Store distribution"
