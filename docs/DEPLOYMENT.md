# 🚀 GaterLink App - Deployment Guide

*Last Updated: January 2024*

## 📋 Overview

This guide provides step-by-step instructions for deploying the GaterLink App to various environments, including development, staging, and production.

## 🛠 Prerequisites

### Required Tools
- **Node.js** 18+ 
- **Xcode** 14.0+ (for iOS builds)
- **CocoaPods** (for iOS dependencies)
- **Firebase CLI** (for Firebase deployment)
- **Git** (for version control)

### Required Accounts
- **Apple Developer Account** (for App Store deployment)
- **Firebase Project** (for backend services)
- **GitHub Account** (for code repository)

## 🔧 Environment Setup

### 1. Development Environment

```bash
# Clone the repository
git clone https://github.com/mml555/Gaterlinkapp.git
cd Gaterlinkapp

# Install dependencies
npm install

# Install iOS dependencies
cd ios && pod install && cd ..

# Create environment file
cp .env.example .env
```

### 2. Environment Variables

Create a `.env` file with the following variables:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# App Configuration
APP_ENV=development
API_BASE_URL=https://api-dev.gaterlinkapp.com
APP_VERSION=1.0.0
BUILD_NUMBER=1
```

### 3. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy Firebase services
firebase deploy
```

## 📱 iOS Deployment

### 1. Development Build

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Or build for device
npx react-native run-ios --device
```

### 2. Release Build

#### Step 1: Update App Configuration

```bash
# Update app version in app.json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

#### Step 2: Build for Release

```bash
# Clean build folder
cd ios
rm -rf build/
rm -rf DerivedData/

# Install pods
pod install

# Build for release
xcodebuild -workspace GaterLinkNative.xcworkspace \
  -scheme GaterLinkNative \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath GaterLinkNative.xcarchive \
  archive
```

#### Step 3: Code Signing

1. **Open Xcode:**
   ```bash
   open ios/GaterLinkNative.xcworkspace
   ```

2. **Configure Signing:**
   - Select your team in "Signing & Capabilities"
   - Update Bundle Identifier if needed
   - Ensure "Automatically manage signing" is enabled

3. **Archive the App:**
   - Select "Any iOS Device" as target
   - Go to Product → Archive
   - Wait for the archive to complete

#### Step 4: Upload to App Store Connect

1. **Open Organizer:**
   - In Xcode, go to Window → Organizer
   - Select your archived app

2. **Upload to App Store:**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Choose "Upload"
   - Follow the upload process

### 3. TestFlight Distribution

1. **Upload Build:**
   - Follow the App Store Connect upload process
   - Wait for processing to complete

2. **Configure TestFlight:**
   - Go to App Store Connect → TestFlight
   - Add internal testers
   - Configure external testing if needed

3. **Submit for Review:**
   - Provide test information
   - Submit for beta review

## 🔥 Firebase Deployment

### 1. Authentication Setup

```bash
# Enable Authentication methods
firebase auth:import users.json
firebase auth:export users.json
```

### 2. Firestore Database

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 3. Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Doors - read access for authenticated users
    match /doors/{doorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Requests - users can create and read their own
    match /requests/{requestId} {
      allow read, write: if request.auth != null && 
        (resource.data.requesterId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🌐 API Deployment

### 1. Backend API Setup

```bash
# Clone API repository (if separate)
git clone https://github.com/mml555/gaterlink-api.git
cd gaterlink-api

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
```

### 2. Environment Configuration

```bash
# Production environment
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_url
FIREBASE_PROJECT_ID=your_project_id
JWT_SECRET=your_jwt_secret
```

### 3. Database Migration

```bash
# Run database migrations
npm run migrate

# Seed initial data
npm run seed
```

### 4. Deploy to Cloud Platform

#### Option A: Heroku
```bash
# Create Heroku app
heroku create gaterlink-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your_database_url

# Deploy
git push heroku main
```

#### Option B: Google Cloud Platform
```bash
# Deploy to Cloud Run
gcloud run deploy gaterlink-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Option C: AWS
```bash
# Deploy to AWS Lambda
serverless deploy
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy GaterLink App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint
      - name: Type check
        run: npm run type-check

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install iOS dependencies
        run: |
          cd ios
          pod install
      - name: Build iOS
        run: |
          cd ios
          xcodebuild -workspace GaterLinkNative.xcworkspace \
            -scheme GaterLinkNative \
            -configuration Release \
            -destination generic/platform=iOS \
            -archivePath GaterLinkNative.xcarchive \
            archive

  deploy-firebase:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

### 2. Environment Secrets

Configure the following secrets in GitHub:

- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `APPLE_DEVELOPER_CERTIFICATE`: Apple developer certificate
- `APPLE_DEVELOPER_KEY`: Apple developer key
- `APPLE_TEAM_ID`: Apple team ID

## 📊 Monitoring & Analytics

### 1. Firebase Analytics

```bash
# Enable Analytics
firebase analytics:enable

# View analytics data
firebase analytics:data:export
```

### 2. Crash Reporting

```bash
# Enable Crashlytics
firebase crashlytics:enable

# View crash reports
firebase crashlytics:list
```

### 3. Performance Monitoring

```bash
# Enable Performance Monitoring
firebase performance:enable

# View performance data
firebase performance:data:export
```

## 🔒 Security Checklist

### Pre-Deployment
- [ ] **Environment Variables**: All sensitive data in environment variables
- [ ] **API Keys**: Rotated and secured
- [ ] **Firebase Rules**: Properly configured
- [ ] **SSL/TLS**: HTTPS enabled for all endpoints
- [ ] **Authentication**: Firebase Auth properly configured
- [ ] **Database**: Proper access controls in place

### Post-Deployment
- [ ] **Monitoring**: Analytics and crash reporting enabled
- [ ] **Backup**: Database backup strategy in place
- [ ] **Logging**: Application logs being collected
- [ ] **Alerts**: Error and performance alerts configured
- [ ] **Documentation**: Deployment documentation updated

## 🚨 Troubleshooting

### Common Issues

#### 1. iOS Build Failures
```bash
# Clean and rebuild
cd ios
rm -rf build/
rm -rf DerivedData/
pod install
xcodebuild clean
```

#### 2. Firebase Connection Issues
```bash
# Check Firebase configuration
firebase projects:list
firebase use your-project-id
firebase apps:sdkconfig
```

#### 3. Environment Variable Issues
```bash
# Verify environment variables
echo $FIREBASE_API_KEY
echo $NODE_ENV
```

#### 4. Pod Installation Issues
```bash
# Update CocoaPods
sudo gem update cocoapods
pod repo update
pod install --repo-update
```

### Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **React Native Documentation**: https://reactnative.dev/docs
- **Apple Developer Documentation**: https://developer.apple.com/documentation
- **GitHub Actions Documentation**: https://docs.github.com/en/actions

## 📞 Deployment Support

For deployment assistance:

- **Email**: deploy-support@gaterlinkapp.com
- **Slack**: #deployment channel
- **Documentation**: [Internal Wiki](https://wiki.gaterlinkapp.com/deployment)

---

*This deployment guide is updated regularly. Last updated: January 2024*
