#!/bin/bash

# Gaterlink Authentication and Push Notifications Setup Script
# This script helps configure authentication providers and push notifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Firebase CLI
check_firebase_cli() {
    if ! command_exists firebase; then
        print_error "Firebase CLI is not installed. Please install it first:"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI is installed"
}

# Function to check if user is logged into Firebase
check_firebase_login() {
    if ! firebase projects:list >/dev/null 2>&1; then
        print_error "You are not logged into Firebase. Please login first:"
        echo "firebase login"
        exit 1
    fi
    print_success "Firebase login verified"
}

# Function to setup Firebase project
setup_firebase_project() {
    print_status "Setting up Firebase project..."
    
    # Check if firebase.json exists
    if [ ! -f "firebase.json" ]; then
        print_error "firebase.json not found. Please run 'firebase init' first."
        exit 1
    fi
    
    # Get current project
    CURRENT_PROJECT=$(firebase use --json | grep -o '"current":"[^"]*"' | cut -d'"' -f4)
    print_success "Current Firebase project: $CURRENT_PROJECT"
    
    # Enable required APIs
    print_status "Enabling required Firebase APIs..."
    gcloud services enable firebase.googleapis.com --project="$CURRENT_PROJECT"
    gcloud services enable firestore.googleapis.com --project="$CURRENT_PROJECT"
    gcloud services enable cloudfunctions.googleapis.com --project="$CURRENT_PROJECT"
    gcloud services enable cloudmessaging.googleapis.com --project="$CURRENT_PROJECT"
    
    print_success "Firebase APIs enabled"
}

# Function to setup authentication
setup_authentication() {
    print_status "Setting up authentication..."
    
    # Check if auth functions are deployed
    if [ ! -f "functions/src/auth.ts" ]; then
        print_error "Authentication functions not found. Please ensure functions/src/auth.ts exists."
        exit 1
    fi
    
    print_success "Authentication functions found"
    print_status "Deploying authentication functions..."
    
    # Deploy auth functions
    firebase deploy --only functions:onUserCreated,functions:onUserDeleted,functions:onUserUpdated,functions:setUserRole,functions:getUserClaims,functions:updateUserPermissions,functions:deactivateUser,functions:reactivateUser
    
    print_success "Authentication functions deployed"
}

# Function to setup push notifications
setup_push_notifications() {
    print_status "Setting up push notifications..."
    
    # Check if notification functions are deployed
    if [ ! -f "functions/src/notifications.ts" ]; then
        print_error "Notification functions not found. Please ensure functions/src/notifications.ts exists."
        exit 1
    fi
    
    print_success "Notification functions found"
    print_status "Deploying notification functions..."
    
    # Deploy notification functions
    firebase deploy --only functions:sendPushNotification,functions:sendEmergencyNotification,functions:sendHoldNotification,functions:sendEquipmentNotification,functions:sendAccessRequestNotification
    
    print_success "Notification functions deployed"
}

# Function to setup iOS push notifications
setup_ios_push_notifications() {
    print_status "Setting up iOS push notifications..."
    
    # Check if iOS project exists
    if [ ! -d "ios" ]; then
        print_warning "iOS project not found. Skipping iOS setup."
        return
    fi
    
    print_status "iOS project found"
    
    # Check if GoogleService-Info.plist exists
    if [ ! -f "ios/GaterLinkNative/GoogleService-Info.plist" ]; then
        print_warning "GoogleService-Info.plist not found. Please download it from Firebase Console."
        echo "Firebase Console → Project Settings → Your apps → iOS → Download GoogleService-Info.plist"
    else
        print_success "GoogleService-Info.plist found"
    fi
    
    # Check if APNs key is configured
    print_status "Checking APNs configuration..."
    echo "Please ensure you have:"
    echo "1. APNs Authentication Key (.p8 file) uploaded to Firebase Console"
    echo "2. Key ID and Team ID configured"
    echo "3. Push Notifications capability enabled in Xcode"
    
    print_success "iOS push notification setup instructions provided"
}

# Function to setup Android push notifications
setup_android_push_notifications() {
    print_status "Setting up Android push notifications..."
    
    # Check if Android project exists
    if [ ! -d "android" ]; then
        print_warning "Android project not found. Skipping Android setup."
        return
    fi
    
    print_status "Android project found"
    
    # Check if google-services.json exists
    if [ ! -f "android/app/google-services.json" ]; then
        print_warning "google-services.json not found. Please download it from Firebase Console."
        echo "Firebase Console → Project Settings → Your apps → Android → Download google-services.json"
    else
        print_success "google-services.json found"
    fi
    
    # Check if notification channels are configured
    print_status "Checking notification channels configuration..."
    if [ -f "android/app/src/main/java/com/gaterlinknative/MainApplication.kt" ]; then
        print_success "MainApplication.kt found - notification channels should be configured"
    else
        print_warning "MainApplication.kt not found. Please ensure notification channels are configured."
    fi
    
    print_success "Android push notification setup instructions provided"
}

# Function to setup security rules
setup_security_rules() {
    print_status "Setting up Firestore security rules..."
    
    # Check if firestore.rules exists
    if [ ! -f "firestore.rules" ]; then
        print_warning "firestore.rules not found. Creating basic rules..."
        
        cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Site memberships
    match /siteMemberships/{membershipId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'MANAGER']);
    }
    
    // Access requests
    match /accessRequests/{requestId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'MANAGER']);
    }
    
    // Emergencies
    match /emergencies/{emergencyId} {
      allow read, write: if request.auth != null;
    }
    
    // Holds
    match /holds/{holdId} {
      allow read, write: if request.auth != null;
    }
    
    // Equipment
    match /equipment/{equipmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Reservations
    match /reservations/{reservationId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'MANAGER']);
    }
  }
}
EOF
        print_success "Basic firestore.rules created"
    else
        print_success "firestore.rules found"
    fi
    
    # Deploy security rules
    print_status "Deploying Firestore security rules..."
    firebase deploy --only firestore:rules
    
    print_success "Security rules deployed"
}

# Function to setup indexes
setup_indexes() {
    print_status "Setting up Firestore indexes..."
    
    # Check if firestore.indexes.json exists
    if [ ! -f "firestore.indexes.json" ]; then
        print_warning "firestore.indexes.json not found. Creating basic indexes..."
        
        cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "siteMemberships",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "siteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "role",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "accessRequests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "siteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "emergencies",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "siteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "holds",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "siteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "expiresAt",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
        print_success "Basic firestore.indexes.json created"
    else
        print_success "firestore.indexes.json found"
    fi
    
    # Deploy indexes
    print_status "Deploying Firestore indexes..."
    firebase deploy --only firestore:indexes
    
    print_success "Indexes deployed"
}

# Function to run tests
run_tests() {
    print_status "Running authentication and notification tests..."
    
    # Check if test files exist
    if [ -f "__tests__/auth.test.ts" ]; then
        print_status "Running authentication tests..."
        npm test -- --testPathPattern=auth.test.ts
    fi
    
    if [ -f "__tests__/notifications.test.ts" ]; then
        print_status "Running notification tests..."
        npm test -- --testPathPattern=notifications.test.ts
    fi
    
    print_success "Tests completed"
}

# Function to show final instructions
show_final_instructions() {
    print_success "Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure iOS push notifications in Firebase Console"
    echo "2. Configure Android push notifications in Firebase Console"
    echo "3. Test authentication flow"
    echo "4. Test push notifications"
    echo "5. Review security rules"
    echo ""
    echo "For detailed instructions, see: AUTHENTICATION_AND_PUSH_NOTIFICATIONS_SETUP.md"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Gaterlink Auth & Push Notifications Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_firebase_cli
    check_firebase_login
    
    # Run setup steps
    setup_firebase_project
    setup_authentication
    setup_push_notifications
    setup_ios_push_notifications
    setup_android_push_notifications
    setup_security_rules
    setup_indexes
    
    # Run tests if available
    if command_exists npm; then
        run_tests
    fi
    
    # Show final instructions
    show_final_instructions
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
