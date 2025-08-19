# Gaterlink App Icon Setup

## Current Status

✅ **SVG Icon Created**: The Gaterlink icon has been successfully created and saved as `assets/gaterlink-icon.svg`

✅ **Basic PNG Icons**: Placeholder PNG icons have been created for immediate use

✅ **App Configuration**: `app.json` has been updated with the new icon paths and Gaterlink branding

## Next Steps for Production Icons

The current PNG icons are minimal placeholders. For production use, you need to convert the SVG to high-quality PNG icons.

### Option 1: Online Converters (Recommended)

1. **Convertio.co** (https://convertio.co/svg-png/)
   - Upload `assets/gaterlink-icon.svg`
   - Set output size to 1024x1024
   - Download and save as `assets/icon.png`

2. **CloudConvert** (https://cloudconvert.com/svg-to-png)
   - Upload the SVG file
   - Set dimensions to 1024x1024
   - Download the PNG

### Option 2: Image Editing Software

1. **Adobe Illustrator**
   - Open `assets/gaterlink-icon.svg`
   - Export as PNG at 1024x1024
   - Save as `assets/icon.png`

2. **Sketch**
   - Import the SVG
   - Export as PNG at 1024x1024

3. **GIMP (Free)**
   - Open the SVG file
   - Scale to 1024x1024
   - Export as PNG

### Option 3: Command Line Tools

If you have ImageMagick installed:
```bash
convert assets/gaterlink-icon.svg -resize 1024x1024 assets/icon.png
```

If you have rsvg-convert installed:
```bash
rsvg-convert -w 1024 -h 1024 assets/gaterlink-icon.svg > assets/icon.png
```

## Required Icon Sizes

Create these PNG files from the SVG:

1. **`assets/icon.png`** - 1024x1024 (main app icon)
2. **`assets/adaptive-icon.png`** - 1024x1024 (Android adaptive icon)
3. **`assets/favicon.png`** - 32x32 (web favicon)
4. **`assets/splash-icon.png`** - 1024x1024 (splash screen)

## Icon Design Details

The Gaterlink icon features:
- **Primary Color**: `#e4ff79` (bright green)
- **Secondary Color**: `#006d32` (dark green)
- **Design**: Gate/lock mechanism with gradient background
- **Style**: Modern, clean, and recognizable at small sizes

## App Configuration

The `app.json` has been updated with:
- App name: "Gaterlink"
- Icon paths pointing to the new assets
- Gaterlink brand colors for splash screen and adaptive icons
- Proper bundle identifiers for iOS and Android

## Testing

After creating the high-quality PNG icons:

1. **iOS Simulator**: Run `npx expo run:ios` to see the icon in the simulator
2. **Android Emulator**: Run `npx expo run:android` to see the icon in the emulator
3. **Web**: Run `npx expo start --web` to see the favicon

## Troubleshooting

If icons don't appear correctly:
1. Clear the Expo cache: `npx expo start --clear`
2. Rebuild the app: `npx expo run:ios` or `npx expo run:android`
3. Check that PNG files are valid and have the correct dimensions
4. Verify file paths in `app.json` are correct

## Files Created

- `assets/gaterlink-icon.svg` - Original SVG icon
- `assets/icon.svg` - Simplified SVG version
- `assets/icon.png` - Main app icon (placeholder)
- `assets/adaptive-icon.png` - Android adaptive icon (placeholder)
- `assets/favicon.png` - Web favicon (placeholder)
- `assets/splash-icon.png` - Splash screen icon (placeholder)
- `convert-svg-to-png.html` - Web-based converter tool
- `ICON_SETUP.md` - This documentation file
