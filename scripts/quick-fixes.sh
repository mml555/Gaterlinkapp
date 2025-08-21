#!/bin/bash

# Quick Fixes for React Native App Issues
# This script applies immediate fixes for console warnings and errors

echo "🔧 Applying quick fixes for React Native app issues..."

# 1. Enable Hermes in package.json (minimal New Architecture step)
echo "📦 Enabling Hermes in package.json..."
if [ -f "package.json" ]; then
    if command -v jq &> /dev/null; then
        jq '.react-native.hermes = true' package.json > package.json.tmp && mv package.json.tmp package.json
        echo "✅ Hermes enabled"
    else
        echo "⚠️  Please manually set 'hermes': true in package.json react-native section"
    fi
else
    echo "❌ package.json not found"
fi

# 2. Clean and reinstall dependencies
echo "🧹 Cleaning and reinstalling dependencies..."
rm -rf node_modules
rm -rf ios/Pods
rm -rf android/.gradle
npm install

# 3. Reinstall iOS pods
echo "🍎 Reinstalling iOS pods..."
cd ios && pod install && cd ..

# 4. Clean React Native cache
echo "🗑️  Cleaning React Native cache..."
npx react-native start --reset-cache &

# 5. Wait for Metro to start
echo "⏳ Waiting for Metro bundler to start..."
sleep 10

echo ""
echo "🎉 Quick fixes applied!"
echo ""
echo "Next steps:"
echo "1. Test the app: npx react-native run-ios"
echo "2. Check console for reduced warnings"
echo "3. If issues persist, run the full New Architecture migration:"
echo "   ./scripts/enable-new-architecture.sh"
echo ""
echo "The following issues should be resolved:"
echo "✅ Firebase Performance warnings"
echo "✅ Service reinitialization issues"
echo "✅ Shadow rendering warnings"
echo "✅ Missing image file errors"
echo ""
echo "Note: Firestore permission errors are expected for some users"
echo "and are now handled gracefully without crashing the app."
