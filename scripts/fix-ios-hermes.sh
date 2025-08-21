#!/bin/bash

# Fix iOS Hermes sandbox issues
echo "🔧 Fixing iOS Hermes sandbox issues..."

# Clean everything
echo "🧹 Cleaning build artifacts..."
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf build
rm -rf Pods
rm -rf Podfile.lock

# Reinstall pods
echo "📦 Reinstalling CocoaPods..."
pod install --repo-update

echo "✅ Fix completed! Try running npm run ios again."
