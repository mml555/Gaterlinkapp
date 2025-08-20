# React Native Camera Kit Fix

## Problem Description
The app was encountering a runtime error when trying to use the QR scanner:
```
TurboModuleRegistry.getEnforcing(...): 'RNCameraKitModule' could not be found. 
Verify that a module by this name is registered in the native binary.
```

## Root Cause
The issue was caused by using an outdated API for `react-native-camera-kit` version 15.1.0. The library underwent significant changes in its API structure between major versions.

## Solution Implemented

### 1. **Fixed Import Statement**
Updated the import from default import to named import:
```typescript
// Before (incorrect for v15.x)
import Camera from 'react-native-camera-kit';

// After (correct for v15.x)
import { Camera, CameraType } from 'react-native-camera-kit';
```

### 2. **Updated Event Handler Interface**
Modified the QR code read handler to match the new event structure:
```typescript
// Before
const handleQRCodeRead = async (event: { data: string }) => {
  const qrData = event.data;

// After
const handleQRCodeRead = async (event: { nativeEvent: { codeStringValue: string } }) => {
  const qrData = event.nativeEvent.codeStringValue;
```

### 3. **Updated Error Handler Interface**
Fixed the error handler to match the new API:
```typescript
// Before
const handleScanError = (error: any) => {
  console.error('Camera scan error:', error);

// After  
const handleScanError = (event: { nativeEvent: { errorMessage: string } }) => {
  console.error('Camera scan error:', event.nativeEvent.errorMessage);
```

### 4. **Updated Camera Props**
Changed camera type from string to enum:
```typescript
// Before
cameraType="back"

// After
cameraType={CameraType.Back}
```

### 5. **Reinstalled Dependencies**
- Ran `pod install` to ensure proper iOS autolinking
- Verified that `rncamerakit_specs.h` was properly included in the build

## Key Changes Summary

| Component | Old API | New API (v15.x) |
|-----------|---------|-----------------|
| Import | `import Camera from 'react-native-camera-kit'` | `import { Camera, CameraType } from 'react-native-camera-kit'` |
| QR Data Access | `event.data` | `event.nativeEvent.codeStringValue` |
| Error Access | `error` | `event.nativeEvent.errorMessage` |
| Camera Type | `"back"` | `CameraType.Back` |

## Files Modified
- `src/screens/main/QRScannerScreen.tsx` - Updated Camera usage and event handlers

## How to Test
1. Build the iOS app in Xcode
2. Navigate to QR Scanner screen
3. Grant camera permissions when prompted
4. Verify that the camera view loads properly
5. Test QR code scanning functionality

## API Version Compatibility
- ✅ **react-native-camera-kit v15.1.0** - Uses the new API structure
- ❌ **react-native-camera-kit v13.x and below** - Used the old API structure

## Notes
- The new API provides better type safety with TypeScript
- Event structure is more consistent with React Native patterns
- The module is now properly autolinked for iOS builds
- All Firebase and Camera Kit module conflicts have been resolved

## Additional Resources
- [React Native Camera Kit GitHub](https://github.com/teslamotors/react-native-camera-kit)
- [Migration Guide for v15.x](https://github.com/teslamotors/react-native-camera-kit/blob/main/MIGRATION.md)
