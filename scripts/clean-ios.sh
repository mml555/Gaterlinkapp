#!/bin/bash

echo "🧹 Cleaning iOS build..."

# Clean derived data
echo "Removing Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean build folder
echo "Cleaning build folder..."
cd ios
rm -rf build/

# Clean pods
echo "Cleaning CocoaPods..."
rm -rf Pods/
rm -rf Podfile.lock

# Clean cache
echo "Cleaning npm cache..."
cd ..
npm cache clean --force

# Clean watchman
echo "Cleaning watchman..."
watchman watch-del-all 2>/dev/null || true

# Clean metro cache
echo "Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*

echo "✅ Clean complete!"
echo "Now run: npm install && cd ios && pod install"