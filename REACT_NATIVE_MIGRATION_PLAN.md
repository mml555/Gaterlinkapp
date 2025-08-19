# React Native Migration Plan: 0.81.0 → 0.75.x

## 📊 Project Overview
- **Current Version:** React Native 0.81.0
- **Target Version:** React Native 0.75.x (Latest Stable)
- **Primary Goal:** Fix Xcode 16 compatibility issues
- **Estimated Time:** 2-3 days
- **Risk Level:** Medium

## 🎯 Migration Objectives
1. ✅ **Fix C++ compilation errors** (main issue)
2. ✅ **Ensure Xcode 16.1+ compatibility**
3. ✅ **Maintain all existing functionality**
4. ✅ **Update dependencies to compatible versions**
5. ✅ **Improve build performance and stability**

---

## 📋 Phase 1: Pre-Migration Setup

### 1.1 Environment Requirements
**Before starting, ensure you have:**
- ✅ **Node.js 20.19.4+** (React Native 0.81+ requirement)
- ✅ **Xcode 16.1+** (already have 16.4)
- ✅ **CocoaPods 1.15.0+**
- ✅ **React Native CLI latest**

**Check current versions:**
```bash
node --version          # Should be 20.19.4+
xcodebuild -version     # Should be 16.1+
pod --version          # Should be 1.15.0+
npx react-native --version
```

### 1.2 Create Backup
```bash
# Create a backup branch
git checkout -b backup-before-rn-migration
git push origin backup-before-rn-migration

# Create project backup
cp -r . ../GaterLinkNative-backup-$(date +%Y%m%d)
```

### 1.3 Update Global Tools
```bash
# Update React Native CLI
npm install -g @react-native-community/cli@latest

# Update CocoaPods
sudo gem install cocoapods

# Clear npm cache
npm cache clean --force
```

---

## 📋 Phase 2: Dependency Analysis & Planning

### 2.1 Current Dependencies Status
| Package | Current | Target | Status | Notes |
|---------|---------|---------|---------|-------|
| react-native | 0.81.0 | **0.75.5** | ⚠️ Major | Core upgrade |
| react | 19.1.0 | **18.3.1** | ⚠️ Downgrade | RN 0.75 uses React 18 |
| @react-navigation/* | 7.x | 7.x | ✅ Compatible | Should work |
| react-native-paper | 5.14.5 | 5.14.5 | ✅ Compatible | Should work |
| @reduxjs/toolkit | 2.8.2 | 2.8.2 | ✅ Compatible | Should work |

### 2.2 React Native Associated Packages (Must Update)
```json
{
  "@react-native/metro-config": "0.75.5",
  "@react-native/babel-preset": "0.75.5",
  "@react-native/eslint-config": "0.75.5",
  "@react-native/typescript-config": "0.75.5",
  "@react-native-community/cli": "14.1.0",
  "@react-native-community/cli-platform-android": "14.1.0",
  "@react-native-community/cli-platform-ios": "14.1.0"
}
```

### 2.3 Native Dependencies Assessment
| Package | Current | Compatibility | Action |
|---------|---------|---------------|--------|
| react-native-gesture-handler | 2.28.0 | ✅ Compatible | Keep |
| react-native-reanimated | 3.19.1 | ✅ Compatible | Keep |
| react-native-safe-area-context | 5.6.1 | ✅ Compatible | Keep |
| react-native-screens | 4.14.1 | ✅ Compatible | Keep |
| react-native-vector-icons | 10.3.0 | ✅ Compatible | Keep |
| react-native-camera-kit | 15.1.0 | ⚠️ Check | May need update |
| react-native-permissions | 5.4.2 | ⚠️ Check | May need update |
| react-native-push-notification | 8.1.1 | ⚠️ Check | May need update |

---

## 📋 Phase 3: Migration Execution

### 3.1 Update React Native CLI and Tools
```bash
# Update global CLI
npm install -g @react-native-community/cli@latest

# Verify version
npx react-native --version
```

### 3.2 Use React Native Upgrade Helper
1. **Visit:** https://react-native-community.github.io/upgrade-helper/
2. **Select:** From 0.81.0 → To 0.75.5
3. **Download** the generated diff file
4. **Review** all changes carefully

### 3.3 Update package.json Dependencies
```bash
# First, create a new branch for the migration
git checkout -b react-native-0.75-migration

# Update core React Native dependencies
npm install react-native@0.75.5 react@18.3.1
```

**Updated package.json (core sections):**
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.75.5"
  },
  "devDependencies": {
    "@react-native/babel-preset": "0.75.5",
    "@react-native/eslint-config": "0.75.5",
    "@react-native/metro-config": "0.75.5",
    "@react-native/typescript-config": "0.75.5",
    "@react-native-community/cli": "14.1.0",
    "@react-native-community/cli-platform-android": "14.1.0",
    "@react-native-community/cli-platform-ios": "14.1.0"
  }
}
```

### 3.4 Run React Native Upgrade
```bash
# Run the upgrade command
npx react-native upgrade

# This will show conflicts - we'll resolve them manually
```

### 3.5 iOS Configuration Updates

#### 3.5.1 Update ios/Podfile
```ruby
# Update minimum iOS version
platform :ios, '13.4'  # React Native 0.75 requirement

# Update post_install hook for Xcode 16 compatibility
post_install do |installer|
  # React Native post install
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false
  )

  # Xcode 16 compatibility fixes
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
      config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'
    end
  end
end
```

#### 3.5.2 Update iOS Build Settings
1. **Update Xcode project settings:**
   - iOS Deployment Target: 13.4+
   - C++ Language Dialect: C++20
   - C++ Standard Library: libc++

### 3.6 Android Configuration Updates

#### 3.6.1 Update android/build.gradle
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = "1.9.22"
    }
}
```

#### 3.6.2 Update android/gradle.properties
```properties
# React Native 0.75 requirements
newArchEnabled=false
hermesEnabled=true
```

### 3.7 Update Metro Configuration
```javascript
// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {};

module.exports = mergeConfig(defaultConfig, config);
```

---

## 📋 Phase 4: Code Updates & Breaking Changes

### 4.1 Import Statement Updates
**Before (Deprecated):**
```javascript
import { Alert } from 'react-native/Libraries/Alert/Alert';
```

**After (Correct):**
```javascript
import { Alert } from 'react-native';
```

### 4.2 TypeScript Configuration
Update `tsconfig.json`:
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json"
}
```

### 4.3 ESLint Configuration
Update `.eslintrc.js`:
```javascript
module.exports = {
  root: true,
  extends: '@react-native',
};
```

---

## 📋 Phase 5: Native Dependencies Update

### 5.1 iOS Pod Updates
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 5.2 Update Problematic Dependencies
```bash
# Update camera permissions (if needed)
npm install react-native-permissions@latest

# Update camera kit (if needed)  
npm install react-native-camera-kit@latest

# Update push notifications (if needed)
npm install react-native-push-notification@latest
```

---

## 📋 Phase 6: Testing & Validation

### 6.1 Clean Build Environment
```bash
# Clean everything
npx react-native clean

# iOS clean
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
pod install
cd ..

# Android clean
cd android
./gradlew clean
cd ..

# Clear Metro cache
npx react-native start --reset-cache
```

### 6.2 Build Tests
```bash
# Test iOS build
npx react-native run-ios --simulator="iPhone 16 Pro"

# Test Android build
npx react-native run-android
```

### 6.3 Functionality Testing Checklist
- [ ] **Authentication flow** (login, register, logout)
- [ ] **Navigation** (all screens accessible)
- [ ] **Camera permissions** and QR scanning
- [ ] **Push notifications** setup
- [ ] **Biometric authentication** (if implemented)
- [ ] **Data persistence** (AsyncStorage, Redux Persist)
- [ ] **Firebase integration**
- [ ] **API calls** and error handling

---

## 📋 Phase 7: Troubleshooting Common Issues

### 7.1 Build Failures
**C++ Compilation Errors:**
```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Update CocoaPods
cd ios && pod install && cd ..
```

**Metro Bundler Issues:**
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force
```

### 7.2 Common Fixes

**Jest Configuration Update:**
```json
{
  "jest": {
    "preset": "@react-native/jest-preset"
  }
}
```

**Flipper Integration (if issues):**
```ruby
# In ios/Podfile - disable Flipper if causing issues
# use_flipper!()  # Comment out this line
```

---

## 📋 Phase 8: Post-Migration Optimization

### 8.1 Performance Monitoring
- Test app startup time
- Monitor bundle size
- Check memory usage
- Validate smooth animations

### 8.2 Update Documentation
- Update README.md with new requirements
- Update development setup guide
- Document any new scripts or commands

---

## 🚨 Rollback Plan

If migration fails:

```bash
# Restore from backup branch
git checkout main
git reset --hard backup-before-rn-migration

# Restore node_modules
rm -rf node_modules
npm install

# Restore iOS pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

---

## ✅ Success Criteria

Migration is successful when:
- [ ] **App builds successfully** on both iOS and Android
- [ ] **All existing features work** as before
- [ ] **No C++ compilation errors**
- [ ] **Xcode 16 compatibility** confirmed
- [ ] **Performance maintained** or improved
- [ ] **All tests pass**

---

## 📞 Support Resources

- **React Native Upgrade Helper:** https://react-native-community.github.io/upgrade-helper/
- **React Native Releases:** https://github.com/facebook/react-native/releases
- **Community Forums:** https://github.com/facebook/react-native/discussions
- **Stack Overflow:** react-native tag

---

**Next Steps:** Ready to begin Phase 1? Let me know and I'll help execute each phase step by step!
