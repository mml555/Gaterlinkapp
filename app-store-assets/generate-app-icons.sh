#!/bin/bash

# App Icon Generator Script for GaterLink
# This script generates all required app icon sizes for iOS and Android

set -e

echo "🎨 Starting App Icon Generation for GaterLink..."
echo "=============================================="

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

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    print_error "ImageMagick is not installed. Please install it first:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Check if source icon exists
SOURCE_ICON="app-icon-1024.png"
if [ ! -f "$SOURCE_ICON" ]; then
    print_warning "Source icon not found. Creating a placeholder..."
    
    # Create a placeholder icon with GaterLink branding
    convert -size 1024x1024 \
        -background '#007AFF' \
        -fill white \
        -gravity center \
        -font Arial-Bold \
        -pointsize 400 \
        label:'GL' \
        -bordercolor '#005ACC' \
        -border 50 \
        "$SOURCE_ICON"
    
    print_status "Created placeholder icon. Replace $SOURCE_ICON with your actual icon."
fi

# Create directories
mkdir -p ios/AppIcon.appiconset
mkdir -p android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
mkdir -p android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}-v26

# iOS Icon Sizes
print_status "Generating iOS icons..."

# iPhone Notification
convert "$SOURCE_ICON" -resize 40x40 ios/AppIcon.appiconset/Icon-App-20x20@2x.png
convert "$SOURCE_ICON" -resize 60x60 ios/AppIcon.appiconset/Icon-App-20x20@3x.png

# iPhone Settings
convert "$SOURCE_ICON" -resize 58x58 ios/AppIcon.appiconset/Icon-App-29x29@2x.png
convert "$SOURCE_ICON" -resize 87x87 ios/AppIcon.appiconset/Icon-App-29x29@3x.png

# iPhone Spotlight
convert "$SOURCE_ICON" -resize 80x80 ios/AppIcon.appiconset/Icon-App-40x40@2x.png
convert "$SOURCE_ICON" -resize 120x120 ios/AppIcon.appiconset/Icon-App-40x40@3x.png

# iPhone App
convert "$SOURCE_ICON" -resize 120x120 ios/AppIcon.appiconset/Icon-App-60x60@2x.png
convert "$SOURCE_ICON" -resize 180x180 ios/AppIcon.appiconset/Icon-App-60x60@3x.png

# iPad Notification
convert "$SOURCE_ICON" -resize 20x20 ios/AppIcon.appiconset/Icon-App-20x20@1x.png
convert "$SOURCE_ICON" -resize 40x40 ios/AppIcon.appiconset/Icon-App-20x20@2x-1.png

# iPad Settings
convert "$SOURCE_ICON" -resize 29x29 ios/AppIcon.appiconset/Icon-App-29x29@1x.png
convert "$SOURCE_ICON" -resize 58x58 ios/AppIcon.appiconset/Icon-App-29x29@2x-1.png

# iPad Spotlight
convert "$SOURCE_ICON" -resize 40x40 ios/AppIcon.appiconset/Icon-App-40x40@1x.png
convert "$SOURCE_ICON" -resize 80x80 ios/AppIcon.appiconset/Icon-App-40x40@2x-1.png

# iPad App
convert "$SOURCE_ICON" -resize 76x76 ios/AppIcon.appiconset/Icon-App-76x76@1x.png
convert "$SOURCE_ICON" -resize 152x152 ios/AppIcon.appiconset/Icon-App-76x76@2x.png

# iPad Pro App
convert "$SOURCE_ICON" -resize 167x167 ios/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png

# App Store
convert "$SOURCE_ICON" -resize 1024x1024 ios/AppIcon.appiconset/Icon-App-1024x1024.png

# Generate Contents.json for iOS
cat > ios/AppIcon.appiconset/Contents.json << 'EOF'
{
  "images" : [
    {
      "filename" : "Icon-App-20x20@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-20x20@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-29x29@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-29x29@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-40x40@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-40x40@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-60x60@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "filename" : "Icon-App-60x60@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "filename" : "Icon-App-20x20@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-20x20@2x-1.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "Icon-App-29x29@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-29x29@2x-1.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "Icon-App-40x40@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-40x40@2x-1.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "Icon-App-76x76@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "76x76"
    },
    {
      "filename" : "Icon-App-76x76@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76"
    },
    {
      "filename" : "Icon-App-83.5x83.5@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5"
    },
    {
      "filename" : "Icon-App-1024x1024.png",
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

print_status "iOS icons generated successfully!"

# Android Icon Sizes
print_status "Generating Android icons..."

# Standard icons
convert "$SOURCE_ICON" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert "$SOURCE_ICON" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert "$SOURCE_ICON" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert "$SOURCE_ICON" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert "$SOURCE_ICON" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Round icons (same as standard for now)
cp android/app/src/main/res/mipmap-mdpi/ic_launcher.png android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-hdpi/ic_launcher.png android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-xhdpi/ic_launcher.png android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
cp android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# Adaptive icons foreground (with padding for Android 8+)
convert "$SOURCE_ICON" -resize 108x108 -gravity center -extent 108x108 android/app/src/main/res/mipmap-mdpi-v26/ic_launcher_foreground.png
convert "$SOURCE_ICON" -resize 162x162 -gravity center -extent 162x162 android/app/src/main/res/mipmap-hdpi-v26/ic_launcher_foreground.png
convert "$SOURCE_ICON" -resize 216x216 -gravity center -extent 216x216 android/app/src/main/res/mipmap-xhdpi-v26/ic_launcher_foreground.png
convert "$SOURCE_ICON" -resize 324x324 -gravity center -extent 324x324 android/app/src/main/res/mipmap-xxhdpi-v26/ic_launcher_foreground.png
convert "$SOURCE_ICON" -resize 432x432 -gravity center -extent 432x432 android/app/src/main/res/mipmap-xxxhdpi-v26/ic_launcher_foreground.png

# Create adaptive icon background
for size in mdpi-v26 hdpi-v26 xhdpi-v26 xxhdpi-v26 xxxhdpi-v26; do
    convert -size 108x108 xc:'#007AFF' android/app/src/main/res/mipmap-$size/ic_launcher_background.png
done

# Create adaptive icon XML
cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cp android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml

print_status "Android icons generated successfully!"

# Generate Play Store icon
convert "$SOURCE_ICON" -resize 512x512 android/play-store-icon.png
print_status "Play Store icon generated!"

# Generate notification icons (monochrome)
print_status "Generating notification icons..."
mkdir -p android/app/src/main/res/drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}

for size in 24:mdpi 36:hdpi 48:xhdpi 72:xxhdpi 96:xxxhdpi; do
    IFS=':' read -r pixels dpi <<< "$size"
    convert "$SOURCE_ICON" -resize ${pixels}x${pixels} -colorspace Gray android/app/src/main/res/drawable-$dpi/ic_notification.png
done

# Summary
echo ""
echo "📊 Icon Generation Summary:"
echo "=========================="
echo "✅ iOS icons: 19 sizes generated"
echo "✅ Android icons: 15 sizes generated"
echo "✅ Adaptive icons: Created for Android 8+"
echo "✅ Notification icons: 5 sizes generated"
echo "✅ Store icons: App Store and Play Store"
echo ""
echo "📁 Output Locations:"
echo "- iOS: ios/AppIcon.appiconset/"
echo "- Android: android/app/src/main/res/"
echo "- Play Store: android/play-store-icon.png"
echo ""
print_warning "Remember to:"
echo "1. Replace the placeholder icon with your actual design"
echo "2. Copy iOS icons to Xcode project"
echo "3. Verify Android icons in Android Studio"
echo "4. Test on actual devices"