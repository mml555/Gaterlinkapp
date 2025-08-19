#!/bin/bash

echo "�� Cleaning iOS build artifacts..."

# Clean Xcode derived data
echo "Cleaning Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/GaterLinkNative-*

# Clean iOS build folder
echo "Cleaning iOS build folder..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock

# Clean React Native cache
echo "Cleaning React Native cache..."
cd ..
rm -rf node_modules
npm cache clean --force

# Reinstall dependencies
echo "Reinstalling Node.js dependencies..."
npm install

# Reinstall iOS dependencies
echo "Reinstalling iOS dependencies..."
cd ios
pod install --repo-update

echo "✅ iOS cleanup complete!"
echo "You can now try building the app again."
