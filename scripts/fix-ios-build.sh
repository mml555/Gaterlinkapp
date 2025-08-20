#!/bin/bash

echo "🔧 Fixing iOS build issues..."

# Stop Metro bundler if running
echo "📱 Stopping Metro bundler..."
pkill -f "react-native start" || true
pkill -f "npx react-native start" || true

# Clear Watchman cache
echo "🧹 Clearing Watchman cache..."
watchman watch-del-all || true

# Clear React Native cache
echo "🗑️ Clearing React Native cache..."
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/.rncache

# Clear Metro cache
echo "📦 Clearing Metro cache..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID || true

# Clean node_modules and reinstall
echo "📦 Reinstalling node_modules..."
rm -rf node_modules
rm -rf package-lock.json
npm install

# Clean iOS build
echo "🍎 Cleaning iOS build..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock

# Reinstall pods
echo "📱 Reinstalling CocoaPods..."
pod install --repo-update

cd ..

# Clean and rebuild
echo "🔨 Building iOS project..."
npx react-native run-ios --simulator="iPhone 15"

echo "✅ iOS build fix completed!"
