# QR Scanner Testing Guide

## Overview

This guide provides comprehensive testing instructions for the QR Scanner implementation in the GaterLink app. The scanner uses `react-native-camera-kit` for camera functionality and includes both real camera scanning and test mode for development.

## Prerequisites

- iOS Simulator or physical iOS device
- Android Emulator or physical Android device
- Test QR code images (generated in `/test-qr-codes/`)

## Test Setup

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
cd ios && pod install && cd ..
```

### 2. Generate Test QR Codes
```bash
node scripts/test-qr-scanner.js
```

This generates QR code images in `/test-qr-codes/`:
- `front_door.png` - qr_code_1_1234567890
- `back_gate.png` - qr_code_2_1234567891
- `garage_door.png` - qr_code_3_1234567892
- `side_entrance.png` - qr_code_4_1234567893
- `invalid_qr_code.png` - invalid_qr_code

## Testing Checklist

### ✅ Camera Permission Testing

#### iOS
- [ ] App requests camera permission on first launch
- [ ] Permission denied shows proper UI with "Grant Permission" button
- [ ] Permission granted enables camera
- [ ] Settings button works (opens device settings)

#### Android
- [ ] App requests camera permission on first launch
- [ ] Permission denied shows proper UI
- [ ] Permission granted enables camera
- [ ] Settings integration works

### ✅ QR Code Scanning Testing

#### Valid QR Codes
Test each of these QR codes and verify they work correctly:

1. **Front Door** (`qr_code_1_1234567890`)
   - [ ] Scans successfully
   - [ ] Shows processing indicator
   - [ ] Navigates to door details screen
   - [ ] No error messages

2. **Back Gate** (`qr_code_2_1234567891`)
   - [ ] Scans successfully
   - [ ] Shows processing indicator
   - [ ] Navigates to door details screen
   - [ ] No error messages

3. **Garage Door** (`qr_code_3_1234567892`)
   - [ ] Scans successfully
   - [ ] Shows processing indicator
   - [ ] Navigates to door details screen
   - [ ] No error messages

4. **Side Entrance** (`qr_code_4_1234567893`)
   - [ ] Scans successfully
   - [ ] Shows processing indicator
   - [ ] Navigates to door details screen
   - [ ] No error messages

#### Invalid QR Codes
Test error handling:

5. **Invalid QR Code** (`invalid_qr_code`)
   - [ ] Scans but shows error message
   - [ ] Displays "Invalid QR code" alert
   - [ ] Does not navigate to door details
   - [ ] Scanner resets after error

### ✅ Test Mode Testing

#### Development Mode
- [ ] Test mode is enabled by default in development
- [ ] Shows list of test QR codes
- [ ] "Simulate Scan" buttons work
- [ ] Toggle switch works to disable/enable test mode

#### Test QR Code Simulation
- [ ] Front Door simulation works
- [ ] Back Gate simulation works
- [ ] Garage Door simulation works
- [ ] Side Entrance simulation works
- [ ] Invalid QR simulation shows error

### ✅ Performance Testing

#### Camera Performance
- [ ] Camera opens within 2 seconds
- [ ] QR detection is responsive (< 500ms)
- [ ] No memory leaks during scanning
- [ ] Battery usage is reasonable
- [ ] Camera frame rate is smooth

#### UI Performance
- [ ] Loading indicators work properly
- [ ] Error messages display correctly
- [ ] Navigation is smooth
- [ ] No UI freezing during scanning

### ✅ Error Handling Testing

#### Network Errors
- [ ] Offline mode handles gracefully
- [ ] Network timeouts show proper messages
- [ ] Retry functionality works

#### Camera Errors
- [ ] Camera hardware errors handled
- [ ] Permission errors show proper UI
- [ ] Camera unavailable shows fallback

#### QR Code Errors
- [ ] Empty QR codes rejected
- [ ] Malformed QR codes rejected
- [ ] Invalid format shows error
- [ ] Duplicate scans prevented

### ✅ Security Testing

#### Input Validation
- [ ] All QR code inputs validated
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Malicious QR codes rejected

#### Data Security
- [ ] No sensitive data logged
- [ ] QR code data sanitized
- [ ] Secure communication with backend
- [ ] Access control enforced

## Testing Commands

### Run iOS Tests
```bash
npm run ios
```

### Run Android Tests
```bash
npm run android
```

### Clean and Rebuild
```bash
npx react-native clean
cd ios && pod install && cd ..
npm run ios
```

### Generate Test QR Codes
```bash
node scripts/test-qr-scanner.js
```

## Test Scenarios

### Scenario 1: First-Time User
1. Install app
2. Navigate to QR Scanner
3. Grant camera permission
4. Scan valid QR code
5. Verify navigation to door details

### Scenario 2: Permission Denied
1. Install app
2. Navigate to QR Scanner
3. Deny camera permission
4. Verify error UI shows
5. Test "Grant Permission" button
6. Test "Open Settings" button

### Scenario 3: Invalid QR Code
1. Open QR Scanner
2. Scan invalid QR code
3. Verify error message
4. Verify scanner resets
5. Test with valid QR code after

### Scenario 4: Test Mode
1. Open QR Scanner in development
2. Verify test mode is active
3. Test each simulated QR code
4. Toggle test mode off/on
5. Verify camera works when test mode disabled

### Scenario 5: Performance Test
1. Open QR Scanner
2. Scan multiple QR codes rapidly
3. Monitor memory usage
4. Check for performance degradation
5. Verify no crashes or freezes

## Expected Results

### Successful Scan
- Camera opens quickly
- QR code detected within 500ms
- Processing indicator shows
- Navigation to door details screen
- No error messages

### Failed Scan
- Error message displayed
- Scanner resets after error
- User can try again
- No navigation occurs

### Permission Issues
- Clear error message
- Options to grant permission
- Settings integration works
- Graceful degradation

## Troubleshooting

### Common Issues

#### Camera Not Working
1. Check camera permissions
2. Verify device camera availability
3. Restart the app
4. Check device settings

#### QR Code Not Scanning
1. Ensure QR code is within frame
2. Check lighting conditions
3. Verify QR code format
4. Try test mode for validation

#### Permission Issues
1. Grant camera permissions in settings
2. Restart the app after permission grant
3. Check device-specific permission settings

#### Performance Issues
1. Check device memory usage
2. Verify no background processes
3. Test on different devices
4. Monitor battery usage

### Debug Mode
- Enable test mode for development
- Use console logs for debugging
- Check error messages in UI
- Verify door service connectivity

## Test Report Template

### Test Environment
- Device: [iOS/Android] [Device Model]
- OS Version: [Version]
- App Version: [Version]
- Test Date: [Date]

### Test Results
- [ ] Camera Permission: PASS/FAIL
- [ ] Valid QR Codes: PASS/FAIL
- [ ] Invalid QR Codes: PASS/FAIL
- [ ] Test Mode: PASS/FAIL
- [ ] Performance: PASS/FAIL
- [ ] Error Handling: PASS/FAIL
- [ ] Security: PASS/FAIL

### Issues Found
- [List any issues found during testing]

### Recommendations
- [List any recommendations for improvements]

## Conclusion

The QR Scanner implementation provides a robust, secure, and user-friendly solution for door access control. Follow this testing guide to ensure all functionality works correctly across different devices and scenarios.

For additional support or questions, refer to the main QR Scanner implementation documentation.
