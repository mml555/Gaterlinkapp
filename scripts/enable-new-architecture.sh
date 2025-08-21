#!/bin/bash

# Enable React Native New Architecture
# This script updates the necessary configuration files to enable the New Architecture

echo "🚀 Enabling React Native New Architecture..."

# Update package.json to enable Hermes
echo "📦 Updating package.json..."
if [ -f "package.json" ]; then
    # Use jq to update the react-native section
    if command -v jq &> /dev/null; then
        jq '.react-native.hermes = true' package.json > package.json.tmp && mv package.json.tmp package.json
        echo "✅ Hermes enabled in package.json"
    else
        echo "⚠️  jq not found, please manually set 'hermes': true in package.json"
    fi
else
    echo "❌ package.json not found"
    exit 1
fi

# Update metro.config.js to enable New Architecture
echo "🔧 Updating metro.config.js..."
if [ -f "metro.config.js" ]; then
    # Check if New Architecture is already enabled
    if grep -q "newArchEnabled" metro.config.js; then
        echo "✅ New Architecture already enabled in metro.config.js"
    else
        # Create backup
        cp metro.config.js metro.config.js.backup
        
        # Add New Architecture configuration
        cat >> metro.config.js << 'EOF'

// Enable New Architecture
const newArchEnabled = process.env.RCT_NEW_ARCH_ENABLED === '1';
const hermesEnabled = process.env.HERMES_ENABLED === '1';

module.exports = {
  ...module.exports,
  resolver: {
    ...module.exports.resolver,
    unstable_enableSymlinks: true,
  },
  transformer: {
    ...module.exports.transformer,
    unstable_allowRequireContext: true,
  },
};
EOF
        echo "✅ New Architecture configuration added to metro.config.js"
    fi
else
    echo "❌ metro.config.js not found"
fi

# Update iOS Podfile
echo "🍎 Updating iOS Podfile..."
if [ -f "ios/Podfile" ]; then
    # Check if New Architecture is already enabled
    if grep -q "RCT_NEW_ARCH_ENABLED" ios/Podfile; then
        echo "✅ New Architecture already enabled in Podfile"
    else
        # Create backup
        cp ios/Podfile ios/Podfile.backup
        
        # Add New Architecture configuration
        sed -i '' 's/use_frameworks! :linkage => :static/use_frameworks! :linkage => :static\n  $RCTNewArchEnabled = true/' ios/Podfile
        echo "✅ New Architecture enabled in Podfile"
    fi
else
    echo "❌ ios/Podfile not found"
fi

# Update Android build.gradle
echo "🤖 Updating Android build.gradle..."
if [ -f "android/app/build.gradle" ]; then
    # Check if New Architecture is already enabled
    if grep -q "newArchEnabled" android/app/build.gradle; then
        echo "✅ New Architecture already enabled in build.gradle"
    else
        # Create backup
        cp android/app/build.gradle android/app/build.gradle.backup
        
        # Add New Architecture configuration
        sed -i '' 's/android {/android {\n    buildFeatures {\n        newArchEnabled true\n    }/' android/app/build.gradle
        echo "✅ New Architecture enabled in build.gradle"
    fi
else
    echo "❌ android/app/build.gradle not found"
fi

# Update MainApplication.kt for Android
echo "📱 Updating MainApplication.kt..."
if [ -f "android/app/src/main/java/com/gaterlinknative/MainApplication.kt" ]; then
    # Check if New Architecture is already enabled
    if grep -q "newArchEnabled" android/app/src/main/java/com/gaterlinknative/MainApplication.kt; then
        echo "✅ New Architecture already enabled in MainApplication.kt"
    else
        # Create backup
        cp android/app/src/main/java/com/gaterlinknative/MainApplication.kt android/app/src/main/java/com/gaterlinknative/MainApplication.kt.backup
        
        # Add New Architecture configuration
        sed -i '' 's/override fun isNewArchEnabled(): Boolean = false/override fun isNewArchEnabled(): Boolean = true/' android/app/src/main/java/com/gaterlinknative/MainApplication.kt
        echo "✅ New Architecture enabled in MainApplication.kt"
    fi
else
    echo "❌ MainApplication.kt not found"
fi

echo ""
echo "🎉 New Architecture configuration complete!"
echo ""
echo "Next steps:"
echo "1. Clean and rebuild the project:"
echo "   npm run start:clean"
echo "   cd ios && pod install && cd .."
echo "   npx react-native run-ios"
echo "   npx react-native run-android"
echo ""
echo "2. Test the app thoroughly to ensure everything works correctly"
echo ""
echo "3. If you encounter issues, you can revert using the backup files:"
echo "   - package.json.backup"
echo "   - metro.config.js.backup"
echo "   - ios/Podfile.backup"
echo "   - android/app/build.gradle.backup"
echo "   - android/app/src/main/java/com/gaterlinknative/MainApplication.kt.backup"
