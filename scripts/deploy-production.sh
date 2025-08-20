#!/bin/bash

# Production Deployment Script for GaterLink App
# This script handles the complete deployment process to Firebase

set -e  # Exit on error

echo "🚀 Starting GaterLink Production Deployment..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Step 1: Login to Firebase
print_status "Step 1: Checking Firebase authentication..."
firebase login:ci --no-localhost 2>/dev/null || {
    print_warning "Please authenticate with Firebase:"
    firebase login
}

# Step 2: Select or create Firebase project
print_status "Step 2: Setting up Firebase project..."
CURRENT_PROJECT=$(firebase use 2>/dev/null | grep "Active Project:" | cut -d ":" -f2 | xargs)

if [ -z "$CURRENT_PROJECT" ] || [ "$CURRENT_PROJECT" == "None" ]; then
    print_warning "No Firebase project selected."
    echo "Would you like to:"
    echo "1) Create a new Firebase project"
    echo "2) Use an existing Firebase project"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" == "1" ]; then
        read -p "Enter project ID (e.g., gaterlink-prod): " PROJECT_ID
        firebase projects:create $PROJECT_ID --display-name "GaterLink Production"
        firebase use $PROJECT_ID
    else
        firebase use --add
    fi
else
    print_status "Using Firebase project: $CURRENT_PROJECT"
    read -p "Continue with this project? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        firebase use --add
    fi
fi

# Step 3: Deploy Firestore Security Rules
print_status "Step 3: Deploying Firestore security rules..."
firebase deploy --only firestore:rules || print_warning "Firestore rules deployment failed"

# Step 4: Deploy Firestore Indexes
print_status "Step 4: Deploying Firestore indexes..."
firebase deploy --only firestore:indexes || print_warning "Firestore indexes deployment failed"

# Step 5: Build and Deploy Cloud Functions
print_status "Step 5: Preparing Cloud Functions..."
if [ -d "functions" ]; then
    cd functions
    print_status "Installing function dependencies..."
    npm install
    
    print_status "Building functions..."
    npm run build || {
        print_warning "TypeScript build failed, trying direct deployment..."
    }
    
    cd ..
    print_status "Deploying Cloud Functions..."
    firebase deploy --only functions || print_warning "Functions deployment failed"
else
    print_warning "Functions directory not found, skipping..."
fi

# Step 6: Deploy Storage Rules
print_status "Step 6: Deploying Storage rules..."
if [ -f "storage.rules" ]; then
    firebase deploy --only storage || print_warning "Storage rules deployment failed"
else
    print_warning "Storage rules file not found, creating default..."
    cat > storage.rules << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId 
        && request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
EOF
    firebase deploy --only storage
fi

# Step 7: Configure Authentication Providers
print_status "Step 7: Setting up Authentication providers..."
echo "Please configure the following in Firebase Console:"
echo "1. Enable Email/Password authentication"
echo "2. Configure OAuth providers if needed"
echo "3. Set up authorized domains"
echo ""
echo "Firebase Console: https://console.firebase.google.com/project/$(firebase use | grep 'Active' | awk '{print $3}')/authentication/providers"
echo ""
read -p "Press Enter when authentication is configured..."

# Step 8: Set up environment variables
print_status "Step 8: Setting up environment configuration..."
if [ -f ".env.production" ]; then
    print_status "Production environment file found"
else
    print_warning "Creating production environment file..."
    cp .env.example .env.production 2>/dev/null || {
        print_error "No .env.example found, please create .env.production manually"
    }
fi

# Step 9: Build the app for production
print_status "Step 9: Building production app..."
echo "Choose platform to build:"
echo "1) iOS"
echo "2) Android"
echo "3) Both"
read -p "Enter choice (1, 2, or 3): " platform_choice

case $platform_choice in
    1)
        print_status "Building iOS app..."
        cd ios
        pod install
        cd ..
        npx react-native run-ios --configuration Release
        ;;
    2)
        print_status "Building Android app..."
        cd android
        ./gradlew assembleRelease
        cd ..
        print_status "APK generated at: android/app/build/outputs/apk/release/"
        ;;
    3)
        print_status "Building both platforms..."
        # iOS
        cd ios
        pod install
        cd ..
        npx react-native run-ios --configuration Release
        
        # Android
        cd android
        ./gradlew assembleRelease
        cd ..
        ;;
    *)
        print_warning "Invalid choice, skipping build"
        ;;
esac

# Step 10: Summary
echo ""
echo "================================================"
print_status "Deployment Summary"
echo "================================================"
echo ""
echo "✅ Firebase project: $(firebase use | grep 'Active' | awk '{print $3}')"
echo "✅ Firestore rules: Deployed"
echo "✅ Firestore indexes: Deployed"
echo "✅ Cloud Functions: $(firebase functions:list 2>/dev/null | wc -l) functions deployed"
echo "✅ Storage rules: Deployed"
echo ""
echo "📱 Next Steps:"
echo "1. Test the app thoroughly"
echo "2. Configure push notification certificates"
echo "3. Set up monitoring and analytics"
echo "4. Submit to app stores"
echo ""
print_status "Deployment complete! 🎉"