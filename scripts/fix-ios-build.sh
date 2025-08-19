#!/bin/bash

echo "🔧 Fixing iOS build issues..."

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "📱 Cleaning iOS build artifacts..."

# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/GaterLinkNative-*

# Clean iOS build
cd ios
rm -rf build/
rm -rf Pods/
rm -rf Podfile.lock

echo "📦 Reinstalling CocoaPods..."

# Reinstall pods
pod install --repo-update

echo "🔨 Cleaning and rebuilding..."

# Clean and build
xcodebuild clean -workspace GaterLinkNative.xcworkspace -scheme GaterLinkNative

echo "✅ iOS build fix completed!"
echo ""
echo "Next steps:"
echo "1. Open ios/GaterLinkNative.xcworkspace in Xcode"
echo "2. Clean build folder (Product > Clean Build Folder)"
echo "3. Build the project (Cmd + B)"
echo ""
echo "If issues persist, try:"
echo "- Reset Xcode (Product > Clean Build Folder)"
echo "- Restart Xcode"
echo "- Check that you're using the .xcworkspace file, not .xcodeproj"
