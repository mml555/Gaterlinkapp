#!/bin/bash

# iOS Build Fix Script for GaterLinkNative
# This script applies all necessary fixes for iOS build issues

echo "🔧 Starting iOS build fix process..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS for iOS development"
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    sudo gem install cocoapods
fi

# Navigate to project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📦 Installing npm dependencies..."
npm install --legacy-peer-deps

echo "🧹 Cleaning previous build artifacts..."
cd ios
rm -rf Pods Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf build

echo "📱 Installing CocoaPods dependencies..."
pod install

echo "🔨 Building the project..."
cd ..

# Option 1: Build with React Native CLI
echo "Building with React Native CLI..."
npx react-native run-ios --simulator="iPhone 16"

# If the above fails, you can uncomment and use xcodebuild directly:
# cd ios
# xcodebuild -workspace GaterLinkNative.xcworkspace \
#   -scheme GaterLinkNative \
#   -configuration Debug \
#   -sdk iphonesimulator \
#   -destination 'platform=iOS Simulator,name=iPhone 16' \
#   build

echo "✅ Build fix process completed!"
echo "If the build still fails, please check ios-build-fixes.md for troubleshooting steps."