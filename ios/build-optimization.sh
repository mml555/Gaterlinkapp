#!/bin/bash

# iOS Build Optimization Script for GaterLink
# This script optimizes the iOS build for production

set -e

echo "🎯 Starting iOS Build Optimization..."
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Navigate to iOS directory
cd "$(dirname "$0")"

# Step 1: Clean build artifacts
print_status "Step 1: Cleaning build artifacts..."
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/GaterLinkNative-*
xcodebuild clean -workspace GaterLinkNative.xcworkspace -scheme GaterLinkNative

# Step 2: Update CocoaPods
print_status "Step 2: Updating CocoaPods..."
pod repo update
pod install --repo-update

# Step 3: Configure build settings for optimization
print_status "Step 3: Configuring build optimizations..."

# Create xcconfig file for optimizations
cat > OptimizationSettings.xcconfig << 'EOF'
// Build optimizations
SWIFT_OPTIMIZATION_LEVEL = -O
GCC_OPTIMIZATION_LEVEL = s
ENABLE_BITCODE = NO
DEAD_CODE_STRIPPING = YES
STRIP_INSTALLED_PRODUCT = YES
STRIP_SWIFT_SYMBOLS = YES
COPY_PHASE_STRIP = YES

// Link-time optimizations
OTHER_LDFLAGS = $(inherited) -ObjC -lc++
LD_RUNPATH_SEARCH_PATHS = $(inherited) @executable_path/Frameworks
ENABLE_NS_ASSERTIONS = NO

// Asset optimization
ASSETCATALOG_COMPILER_OPTIMIZATION = space
COMPRESS_PNG_FILES = YES
REMOVE_CVS_FROM_RESOURCES = YES
REMOVE_GIT_FROM_RESOURCES = YES
REMOVE_HEADERS_FROM_EMBEDDED_BUNDLES = YES

// Swift settings
SWIFT_COMPILATION_MODE = wholemodule
SWIFT_DISABLE_SAFETY_CHECKS = YES
SWIFT_ENFORCE_EXCLUSIVE_ACCESS = compile-time

// Debug symbols
DEBUG_INFORMATION_FORMAT = dwarf-with-dsym
DEPLOYMENT_POSTPROCESSING = YES
GENERATE_PROFILING_CODE = NO
VALIDATE_PRODUCT = YES

// Architecture
ARCHS = arm64
VALID_ARCHS = arm64
ONLY_ACTIVE_ARCH = NO
BUILD_ACTIVE_RESOURCES_ONLY = NO
EOF

# Step 4: Optimize images
print_status "Step 4: Optimizing images..."
if command -v imageoptim-cli &> /dev/null; then
    find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs imageoptim-cli
else
    print_warning "imageoptim-cli not installed. Install with: npm install -g imageoptim-cli"
fi

# Step 5: Configure Metro bundler for production
print_status "Step 5: Configuring Metro bundler..."
cat > ../metro.config.production.js << 'EOF'
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  
  // Production optimizations
  config.transformer.minifierConfig = {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    ie8: false,
  };
  
  config.transformer.optimizationSizeLimit = 250000; // 250KB
  
  return config;
})();
EOF

# Step 6: Build JavaScript bundle
print_status "Step 6: Building optimized JavaScript bundle..."
cd ..
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios \
  --config metro.config.production.js \
  --minify true \
  --reset-cache

# Step 7: Archive and export IPA
print_status "Step 7: Building release archive..."
cd ios

# Create export options plist
cat > ExportOptions.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>thinning</key>
    <string>&lt;thin-for-all-variants&gt;</string>
</dict>
</plist>
EOF

# Build archive
xcodebuild archive \
  -workspace GaterLinkNative.xcworkspace \
  -scheme GaterLinkNative \
  -configuration Release \
  -archivePath build/GaterLinkNative.xcarchive \
  -allowProvisioningUpdates \
  -xcconfig OptimizationSettings.xcconfig \
  DEVELOPMENT_TEAM=YOUR_TEAM_ID \
  CODE_SIGN_STYLE=Automatic

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/GaterLinkNative.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist \
  -allowProvisioningUpdates

# Step 8: Analyze build size
print_status "Step 8: Analyzing build size..."
if [ -f "build/GaterLinkNative.ipa" ]; then
    IPA_SIZE=$(du -h build/GaterLinkNative.ipa | cut -f1)
    print_status "IPA Size: $IPA_SIZE"
    
    # Extract and analyze app bundle
    unzip -q build/GaterLinkNative.ipa -d build/extracted
    APP_SIZE=$(du -sh build/extracted/Payload/*.app | cut -f1)
    print_status "App Bundle Size: $APP_SIZE"
    
    # Show largest files
    echo "Largest files in bundle:"
    find build/extracted/Payload/*.app -type f -exec du -h {} \; | sort -rh | head -10
fi

# Step 9: Generate size report
print_status "Step 9: Generating size report..."
cat > build/size-report.txt << EOF
iOS Build Size Report
=====================
Date: $(date)
IPA Size: ${IPA_SIZE:-N/A}
App Bundle Size: ${APP_SIZE:-N/A}

Optimization Settings Applied:
- Swift whole module optimization
- Dead code stripping
- Asset compression
- Console log removal
- Symbol stripping
EOF

print_status "Build optimization complete!"
echo ""
echo "📊 Build Summary:"
echo "=================="
echo "✅ Build artifacts cleaned"
echo "✅ Dependencies updated"
echo "✅ JavaScript bundle optimized"
echo "✅ Native code optimized"
echo "✅ IPA generated at: build/GaterLinkNative.ipa"
echo ""
echo "📱 Next Steps:"
echo "1. Test on real devices"
echo "2. Profile performance"
echo "3. Submit to TestFlight"
echo "4. Monitor crash reports"