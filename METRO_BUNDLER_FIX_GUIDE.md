# Metro Bundler Connection Fix Guide

## Problem Summary
Your React Native app is showing "Unable to load script" error because the device cannot connect to the Metro bundler running on localhost:8081.

## Current Status
✅ **Metro bundler is running correctly** on port 8081  
✅ **JavaScript bundle is being served** correctly  
❌ **Device cannot connect** to the bundler  

## Solutions

### 1. For Physical Android Device (USB Connection)

#### Step 1: Enable USB Debugging
1. Go to Settings > About Phone
2. Tap "Build Number" 7 times to enable Developer Options
3. Go to Settings > Developer Options
4. Enable "USB Debugging"

#### Step 2: Connect Device and Set Up Port Forwarding
```bash
# Check if device is connected
adb devices

# If device shows up, set up port forwarding
adb reverse tcp:8081 tcp:8081

# Restart the app on your device
# Shake the device and select "Reload" or press R+R
```

#### Step 3: Alternative - Use Device IP
If USB port forwarding doesn't work:

1. **Find your computer's IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Start Metro with your IP:**
   ```bash
   npx react-native start --host 192.168.1.XXX
   ```

3. **On your device:**
   - Shake the device
   - Go to "Dev Settings" > "Debug server host & port for device"
   - Enter: `192.168.1.XXX:8081` (replace with your actual IP)

### 2. For Android Emulator

#### Step 1: Start Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd [emulator_name]
```

#### Step 2: Run the App
```bash
# In a new terminal
npx react-native run-android
```

### 3. For iOS Simulator (Recommended for macOS)

#### Step 1: Fix iOS Build Issues First
The iOS build is failing due to leveldb library issues. Try these fixes:

```bash
# Clean iOS build
cd ios
rm -rf build
rm -rf Pods
pod install
cd ..

# Try running again
npx react-native run-ios
```

#### Step 2: Alternative - Open in Xcode
```bash
# Open the workspace in Xcode
open ios/GaterLinkNative.xcworkspace
```

Then build and run directly from Xcode.

### 4. General Troubleshooting Steps

#### Clear All Caches
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear React Native cache
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

#### Check Network Configuration
```bash
# Check if port 8081 is accessible
curl http://localhost:8081/status

# Check if firewall is blocking the port
sudo lsof -i :8081
```

#### Restart Development Environment
```bash
# Kill all Metro processes
lsof -ti:8081 | xargs kill -9

# Restart Metro
npx react-native start
```

### 5. Quick Fix Commands

Run these commands in sequence:

```bash
# 1. Kill existing Metro processes
lsof -ti:8081 | xargs kill -9

# 2. Clear Metro cache and restart
npx react-native start --reset-cache

# 3. In a new terminal, run the app
npx react-native run-android
# OR
npx react-native run-ios
```

### 6. For Physical Device - Manual Connection

If automatic connection fails:

1. **On your device:**
   - Open the React Native app
   - Shake the device
   - Select "Dev Settings"
   - Go to "Debug server host & port for device"
   - Enter your computer's IP address: `192.168.1.XXX:8081`

2. **Find your computer's IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Make sure both devices are on the same WiFi network**

### 7. Emergency Fallback

If nothing works, try this nuclear option:

```bash
# 1. Stop all processes
pkill -f "react-native"
pkill -f "metro"

# 2. Clean everything
rm -rf node_modules
rm -rf ios/build
rm -rf android/app/build
rm -rf android/.gradle

# 3. Reinstall everything
npm install
cd ios && pod install && cd ..

# 4. Start fresh
npx react-native start --reset-cache

# 5. In new terminal
npx react-native run-android
# OR
npx react-native run-ios
```

## Common Issues and Solutions

### Issue: "Metro bundler not found"
**Solution:** Start Metro first with `npx react-native start`

### Issue: "Device not found"
**Solution:** 
- For Android: Enable USB debugging and run `adb devices`
- For iOS: Make sure simulator is running

### Issue: "Port 8081 already in use"
**Solution:** 
```bash
lsof -ti:8081 | xargs kill -9
```

### Issue: "Network timeout"
**Solution:** 
- Check firewall settings
- Try using device IP instead of localhost
- Ensure both devices are on same network

## Next Steps

1. **Try the iOS simulator first** (easiest on macOS)
2. **If iOS fails**, try Android emulator
3. **For physical device**, use USB connection with port forwarding
4. **If all fails**, use the emergency fallback method

## Verification

To verify the fix worked:
1. Metro bundler should show "Loading dependency graph, done."
2. Device should load the app without the red error screen
3. You should see your app's main screen

## Need More Help?

If these steps don't resolve the issue, the problem might be:
- Network configuration issues
- Firewall blocking connections
- React Native version compatibility issues
- Device-specific problems

Consider checking the React Native troubleshooting guide: https://reactnative.dev/docs/troubleshooting
