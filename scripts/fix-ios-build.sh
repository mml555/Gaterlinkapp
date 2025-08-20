#!/bin/bash

echo "🧹 Cleaning iOS build and fixing Firebase module issues..."

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "📱 Cleaning Xcode derived data..."
# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/GaterLinkNative-*

echo "🗂️ Cleaning iOS build artifacts..."
# Clean iOS build artifacts
cd ios
rm -rf build/
rm -rf Pods/
rm -rf Podfile.lock

echo "📦 Reinstalling CocoaPods..."
# Reinstall pods
pod install --repo-update

echo "🔧 Cleaning React Native cache..."
# Clean React Native cache
cd ..
npx react-native clean

echo "✅ iOS build cleanup completed!"
echo "🚀 You can now try building in Xcode again."
echo ""
echo "If you still encounter issues, try:"
echo "1. Clean build folder in Xcode (Product > Clean Build Folder)"
echo "2. Reset iOS Simulator (Device > Erase All Content and Settings)"
echo "3. Restart Xcode"
