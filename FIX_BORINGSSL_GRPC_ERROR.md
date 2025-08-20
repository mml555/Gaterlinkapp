# Fix for BoringSSL-GRPC Compilation Error

## Error Description
```
BoringSSL-GRPC unsupported option '-G' for target 'arm64-apple-ios15.1-simulator'
```

This error occurs when building for iOS simulator with newer Xcode versions due to incompatible compiler flags in the BoringSSL-GRPC pod.

## Solution

### Step 1: Update Podfile
The Podfile has been updated with a fix for this issue. The fix removes the unsupported `-G` compiler flag from BoringSSL-GRPC build settings.

### Step 2: Clean and Reinstall Pods

Run these commands in your terminal:

```bash
# Navigate to your project
cd /Users/mendell/Gaterlinkapp

# Clean everything
cd ios
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/GaterLinkNative-*
rm -rf Pods
rm -rf Podfile.lock

# Reinstall pods
pod install --repo-update
```

### Step 3: Clean Build in Xcode

1. Open `GaterLinkNative.xcworkspace` in Xcode
2. Go to Product → Clean Build Folder (Shift+Cmd+K)
3. Close Xcode completely

### Step 4: Additional Fixes (if needed)

If the issue persists, try these additional steps:

#### Option A: Update Firebase/gRPC Dependencies
```bash
cd /Users/mendell/Gaterlinkapp
npm update firebase
cd ios
pod update Firebase/Core Firebase/Auth Firebase/Firestore gRPC-Core BoringSSL-GRPC
```

#### Option B: Manual Xcode Configuration
1. Open `GaterLinkNative.xcworkspace` in Xcode
2. Select the Pods project in the navigator
3. Find BoringSSL-GRPC target
4. Go to Build Settings
5. Search for "Other C Flags" and "Other C++ Flags"
6. Remove any `-G` flags manually

#### Option C: Use Rosetta for Intel Build (M1/M2 Macs)
If you're on an Apple Silicon Mac:
```bash
# Install Rosetta if not already installed
softwareupdate --install-rosetta

# Run pod install with Rosetta
arch -x86_64 pod install
```

### Step 5: Build the Project

After applying the fixes:
1. Open `GaterLinkNative.xcworkspace` in Xcode
2. Select your simulator target
3. Build the project (Cmd+B)

## Alternative Solutions

### 1. Downgrade Firebase (if update doesn't work)
In `package.json`:
```json
"firebase": "^11.0.0"
```

Then in `ios/Podfile`:
```ruby
pod 'Firebase/Core', '~> 9.0'
pod 'Firebase/Auth', '~> 9.0'
pod 'Firebase/Firestore', '~> 9.0'
```

### 2. Use Different Build Configuration
Add to your Podfile's post_install block:
```ruby
installer.pods_project.build_configurations.each do |config|
  config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
end
```

### 3. Update Xcode Command Line Tools
```bash
xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## Prevention

To avoid this issue in the future:
1. Keep Firebase and gRPC dependencies up to date
2. Use consistent Xcode versions across the team
3. Commit the updated Podfile with the fix
4. Document the Xcode version being used

## Verification

After fixing, verify that:
1. The project builds successfully for simulator
2. The project builds successfully for device
3. Firebase services work correctly in the app

## Related Issues

This error is often related to:
- Xcode 15+ compatibility with older gRPC versions
- Firebase SDK version mismatches
- Apple Silicon (M1/M2) architecture issues
- CocoaPods cache corruption