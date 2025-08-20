# 🔥 Firebase Production Setup Guide for GaterLink

## 📋 Prerequisites

- Firebase account (Google account)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 18+ installed
- Access to Firebase Console

## 🚀 Step-by-Step Setup Process

### Step 1: Firebase Authentication

```bash
# Login to Firebase
firebase login

# Or if you're on a remote server/CI environment:
firebase login:ci
```

### Step 2: Create Firebase Project

#### Option A: Via Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it: `gaterlink-prod` or `gaterlink-app`
4. Enable Google Analytics (optional but recommended)
5. Select analytics account or create new one

#### Option B: Via CLI
```bash
firebase projects:create gaterlink-prod --display-name "GaterLink Production"
```

### Step 3: Initialize Firebase in Project

```bash
# In the project root directory
firebase init

# Select the following services:
# ◉ Firestore
# ◉ Functions
# ◉ Storage
# ◉ Emulators (optional, for local testing)

# When prompted:
# - Use existing project: gaterlink-prod
# - Keep existing files for rules and indexes
# - Functions language: TypeScript
# - Use ESLint: Yes
# - Install dependencies: Yes
```

### Step 4: Configure Firebase Services

#### 4.1 Enable Authentication
1. Go to Firebase Console → Authentication
2. Click "Get started"
3. Enable providers:
   - ✅ Email/Password
   - ✅ Phone (optional)
   - ✅ Google (optional)
   - ✅ Apple (for iOS, optional)

#### 4.2 Create Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose production mode
4. Select location (us-central1 recommended)
5. Click "Enable"

#### 4.3 Set up Cloud Storage
1. Go to Firebase Console → Storage
2. Click "Get started"
3. Start in production mode
4. Select location (same as Firestore)
5. Click "Done"

### Step 5: Deploy Security Rules and Indexes

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Storage rules
firebase deploy --only storage
```

### Step 6: Configure Environment Variables

#### 6.1 Get Firebase Config
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click "Add app" → Web app icon
4. Register app with nickname "GaterLink Web"
5. Copy the configuration

#### 6.2 Update App Configuration

Update `/workspace/src/config/firebase.ts` with your production config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Step 7: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript functions
npm run build

# Deploy functions
npm run deploy

# Or deploy from root:
firebase deploy --only functions
```

### Step 8: Set up Custom Claims for Admin Users

Run this in Firebase Console → Firestore → Create first admin user:

```javascript
// In Cloud Functions or Admin SDK script
const admin = require('firebase-admin');
admin.initializeApp();

// Set custom claims for admin user
admin.auth().setCustomUserClaims('USER_UID_HERE', {
  role: 'admin',
  permissions: ['all']
});
```

### Step 9: Configure iOS App

1. Go to Firebase Console → Project Settings → Your apps
2. Click "Add app" → iOS
3. Enter iOS bundle ID: `com.gaterlink.app`
4. Download `GoogleService-Info.plist`
5. Place in `/workspace/ios/GaterLinkNative/`
6. Add to Xcode project

### Step 10: Configure Android App

1. Go to Firebase Console → Project Settings → Your apps
2. Click "Add app" → Android
3. Enter Android package name: `com.gaterlink.app`
4. Download `google-services.json`
5. Place in `/workspace/android/app/`

### Step 11: Enable Firebase Services

#### Cloud Messaging (Push Notifications)
```bash
# iOS: Upload APNs certificates
# Android: FCM is automatically enabled
```

#### Analytics
```bash
# Automatically enabled with app configuration
```

#### Crashlytics
```bash
# Enable in Firebase Console → Crashlytics
```

### Step 12: Test Deployment

```bash
# Run the deployment script
./scripts/deploy-production.sh

# Or manually deploy everything
firebase deploy
```

## 🔐 Security Checklist

- [ ] Firestore rules deployed and tested
- [ ] Storage rules deployed and tested
- [ ] Authentication providers configured
- [ ] API keys restricted in Google Cloud Console
- [ ] Custom claims set for admin users
- [ ] Environment variables secured
- [ ] SSL certificates configured
- [ ] CORS settings configured

## 📊 Monitoring Setup

1. **Firebase Console Monitoring**
   - Performance Monitoring
   - Crashlytics
   - Analytics
   - Cloud Functions logs

2. **Set up Alerts**
   - Budget alerts
   - Error rate alerts
   - Performance degradation alerts

## 🚨 Common Issues and Solutions

### Issue: Functions deployment fails
```bash
# Solution: Check Node version
node --version  # Should be 18.x

# Update functions dependencies
cd functions && npm update
```

### Issue: Firestore rules invalid
```bash
# Solution: Test rules in Firebase Console
# Go to Firestore → Rules → Test rules
```

### Issue: Authentication not working
```bash
# Solution: Check authorized domains
# Firebase Console → Authentication → Settings → Authorized domains
```

## 📝 Production Checklist

### Before Going Live:
- [ ] All security rules tested
- [ ] Functions deployed and tested
- [ ] Authentication flows verified
- [ ] Push notifications tested
- [ ] Performance optimized
- [ ] Error tracking enabled
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team access configured

### After Going Live:
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Verify backup processes
- [ ] User feedback collection

## 🔗 Important URLs

- **Firebase Console**: https://console.firebase.google.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Status**: https://status.firebase.google.com

## 📞 Support

For Firebase support:
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase
- GitHub Issues: https://github.com/firebase/firebase-js-sdk/issues

## 🎯 Next Steps

1. Complete all items in the production checklist
2. Run comprehensive testing
3. Set up staging environment (optional)
4. Configure CI/CD pipeline
5. Prepare for app store submission

---

**Note**: Keep this document updated as you make changes to the Firebase configuration.