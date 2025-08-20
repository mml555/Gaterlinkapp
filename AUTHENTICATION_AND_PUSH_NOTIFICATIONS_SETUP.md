# Authentication and Push Notifications Setup Guide

## Overview

This guide provides comprehensive instructions for setting up authentication providers and push notifications for the Gaterlink app.

## 1. Authentication Providers Configuration

### 1.1 Email/Password Authentication

The app is already configured with Firebase Authentication for email/password authentication. The following features are implemented:

#### Features Implemented:
- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ Password reset functionality
- ✅ Email verification
- ✅ Custom claims for role-based access
- ✅ User profile management
- ✅ Session persistence

#### Configuration Files:
- `src/config/firebase.ts` - Firebase configuration
- `src/services/firebaseAuthService.ts` - Authentication service
- `functions/src/auth.ts` - Backend authentication functions

#### Custom Claims Structure:
```typescript
interface CustomClaims {
  role: UserRole;           // ADMIN, MANAGER, CUSTOMER
  siteId?: string;          // Associated site ID
  permissions?: string[];   // Custom permissions
  isActive: boolean;        // User active status
  lastLogin?: number;       // Last login timestamp
}
```

### 1.2 Role-Based Access Control

#### User Roles:
- **ADMIN**: Full system access, user management, site management
- **MANAGER**: Site-specific management, access control, emergency management
- **CUSTOMER**: Basic access, door access, equipment reservations

#### Permission Management:
```typescript
// Set user role (Admin/Manager only)
await setUserRole(userId, role, siteId);

// Update user permissions (Admin only)
await updateUserPermissions(userId, permissions);

// Deactivate/Reactivate user (Admin/Manager)
await deactivateUser(userId);
await reactivateUser(userId);
```

### 1.3 Firebase Console Configuration

#### Enable Authentication Providers:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password provider
3. Configure password policy (minimum 8 characters recommended)
4. Enable email verification (optional but recommended)

#### Security Rules:
```javascript
// Firestore security rules for user data
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
  }
}
```

## 2. Push Notifications Configuration

### 2.1 Firebase Cloud Messaging (FCM) Setup

#### Features Implemented:
- ✅ FCM token management
- ✅ Push notification sending
- ✅ Notification channels (Android)
- ✅ Background/foreground message handling
- ✅ Notification actions
- ✅ Badge management
- ✅ Sound and vibration support

#### Configuration Files:
- `src/services/pushNotificationService.ts` - Push notification service
- `functions/src/notifications.ts` - Backend notification functions

### 2.2 iOS Push Notifications Setup

#### Prerequisites:
- Apple Developer Account
- iOS App ID with Push Notifications capability
- APNs Authentication Key or Certificate

#### Setup Steps:

1. **Create APNs Authentication Key:**
   ```
   Apple Developer Console → Certificates, Identifiers & Profiles → Keys → +
   - Key Name: Gaterlink Push Notifications
   - Key Services: Apple Push Notifications service (APNs)
   - Download .p8 file
   ```

2. **Configure Firebase Console:**
   ```
   Firebase Console → Project Settings → Cloud Messaging → Apple apps
   - Upload APNs Authentication Key (.p8 file)
   - Enter Key ID and Team ID
   - Save configuration
   ```

3. **Update iOS Project:**
   ```swift
   // AppDelegate.swift
   import UserNotifications
   import Firebase
   import FirebaseMessaging
   
   @main
   class AppDelegate: UIResponder, UIApplicationDelegate {
     func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
       FirebaseApp.configure()
       
       // Request notification permission
       UNUserNotificationCenter.current().delegate = self
       let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
       UNUserNotificationCenter.current().requestAuthorization(
         options: authOptions,
         completionHandler: { _, _ in }
       )
       application.registerForRemoteNotifications()
       
       return true
     }
   }
   
   extension AppDelegate: UNUserNotificationCenterDelegate {
     func userNotificationCenter(_ center: UNUserNotificationCenter,
                               willPresent notification: UNNotification,
                               withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
       completionHandler([[.alert, .sound]])
     }
   }
   
   extension AppDelegate: MessagingDelegate {
     func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
       // Send FCM token to your server
     }
   }
   ```

4. **Update Info.plist:**
   ```xml
   <key>UIBackgroundModes</key>
   <array>
     <string>remote-notification</string>
   </array>
   ```

### 2.3 Android Push Notifications Setup

#### Prerequisites:
- Google Cloud Console project
- Firebase project linked to Google Cloud Console

#### Setup Steps:

1. **Download google-services.json:**
   ```
   Firebase Console → Project Settings → Your apps → Android
   - Download google-services.json
   - Place in android/app/ directory
   ```

2. **Update Android Manifest:**
   ```xml
   <!-- android/app/src/main/AndroidManifest.xml -->
   <manifest>
     <uses-permission android:name="android.permission.INTERNET" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     <uses-permission android:name="android.permission.VIBRATE" />
     <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
     
     <application>
       <!-- FCM Service -->
       <service
         android:name=".MyFirebaseMessagingService"
         android:exported="false">
         <intent-filter>
           <action android:name="com.google.firebase.MESSAGING_EVENT" />
         </intent-filter>
       </service>
       
       <!-- Default notification icon -->
       <meta-data
         android:name="com.google.firebase.messaging.default_notification_icon"
         android:resource="@drawable/ic_notification" />
       
       <!-- Default notification color -->
       <meta-data
         android:name="com.google.firebase.messaging.default_notification_color"
         android:resource="@color/notification_color" />
     </application>
   </manifest>
   ```

3. **Create Notification Channels:**
   ```kotlin
   // MainApplication.kt
   import android.app.NotificationChannel
   import android.app.NotificationManager
   import android.os.Build
   
   class MainApplication : Application() {
     override fun onCreate() {
       super.onCreate()
       createNotificationChannels()
     }
     
     private fun createNotificationChannels() {
       if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
         val channels = listOf(
           NotificationChannel(
             "emergency-alerts",
             "Emergency Alerts",
             NotificationManager.IMPORTANCE_HIGH
           ).apply {
             description = "Critical emergency notifications"
             enableVibration(true)
             enableLights(true)
           },
           NotificationChannel(
             "hold-notifications",
             "Hold Notifications",
             NotificationManager.IMPORTANCE_DEFAULT
           ).apply {
             description = "Hold and access notifications"
             enableVibration(true)
           },
           NotificationChannel(
             "equipment-updates",
             "Equipment Updates",
             NotificationManager.IMPORTANCE_LOW
           ).apply {
             description = "Equipment status and reservation updates"
             enableVibration(false)
           }
         )
         
         val notificationManager = getSystemService(NotificationManager::class.java)
         channels.forEach { channel ->
           notificationManager.createNotificationChannel(channel)
         }
       }
     }
   }
   ```

### 2.4 Notification Types and Channels

#### Emergency Notifications:
- **Channel**: `emergency-alerts`
- **Priority**: High
- **Sound**: Emergency sound
- **Vibration**: Yes
- **Lights**: Yes
- **Auto-clear**: No

#### Hold Notifications:
- **Channel**: `hold-notifications`
- **Priority**: Normal
- **Sound**: Default
- **Vibration**: Yes
- **Actions**: View Details, Extend

#### Equipment Notifications:
- **Channel**: `equipment-updates`
- **Priority**: Low
- **Sound**: Default
- **Vibration**: No
- **Actions**: View Details, Reserve

#### Access Request Notifications:
- **Channel**: `access-requests`
- **Priority**: Normal
- **Sound**: Default
- **Vibration**: Yes
- **Actions**: Approve, Deny

### 2.5 Backend Notification Functions

#### Send Push Notification:
```typescript
await sendPushNotification(
  { siteId: 'site123', role: UserRole.MANAGER },
  {
    title: 'Emergency Alert',
    body: 'Fire alarm activated in Building A',
    data: { type: 'emergency', emergencyId: 'emergency123' },
    priority: 'high',
    sound: 'emergency',
    channelId: 'emergency-alerts'
  }
);
```

#### Send Emergency Notification:
```typescript
await sendEmergencyNotification({
  emergency: {
    id: 'emergency123',
    type: 'fire',
    severity: 'high',
    description: 'Fire alarm activated'
  },
  siteId: 'site123'
});
```

#### Send Hold Notification:
```typescript
await sendHoldNotification({
  hold: {
    id: 'hold123',
    areaId: 'Building A - Floor 2',
    reason: 'Maintenance work',
    siteId: 'site123'
  },
  affectedUsers: ['user1', 'user2', 'user3']
});
```

## 3. Testing and Validation

### 3.1 Authentication Testing

#### Test User Registration:
```typescript
const result = await firebaseAuthService.register({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: UserRole.CUSTOMER
});
```

#### Test Role Assignment:
```typescript
await setUserRole('user123', UserRole.MANAGER, 'site123');
```

#### Test Custom Claims:
```typescript
const claims = await getUserClaims('user123');
console.log('User claims:', claims.customClaims);
```

### 3.2 Push Notification Testing

#### Test FCM Token Generation:
```typescript
const token = await pushNotificationService.getFCMToken();
console.log('FCM Token:', token);
```

#### Test Local Notification:
```typescript
pushNotificationService.showLocalNotification({
  id: 'test123',
  title: 'Test Notification',
  body: 'This is a test notification',
  data: { type: 'test' },
  priority: 'normal'
});
```

#### Test Backend Notification:
```typescript
await sendPushNotification(
  { userIds: ['user123'] },
  {
    title: 'Test Notification',
    body: 'This is a test notification from backend',
    data: { type: 'test' }
  }
);
```

## 4. Security Considerations

### 4.1 Authentication Security
- ✅ Password complexity requirements
- ✅ Rate limiting on login attempts
- ✅ Session timeout management
- ✅ Secure token storage
- ✅ Input validation and sanitization

### 4.2 Push Notification Security
- ✅ FCM token validation
- ✅ Notification payload validation
- ✅ User permission checks
- ✅ Rate limiting on notifications
- ✅ Secure token transmission

### 4.3 Data Protection
- ✅ User data encryption
- ✅ Secure API endpoints
- ✅ Audit logging
- ✅ GDPR compliance measures

## 5. Monitoring and Analytics

### 5.1 Authentication Metrics
- User registration rate
- Login success/failure rates
- Password reset requests
- Session duration
- Role distribution

### 5.2 Push Notification Metrics
- FCM token registration rate
- Notification delivery rate
- Notification open rate
- Channel performance
- User engagement

### 5.3 Error Monitoring
- Authentication failures
- Notification delivery failures
- Token validation errors
- Rate limit violations

## 6. Deployment Checklist

### 6.1 Pre-Deployment
- [ ] Firebase project configured
- [ ] Authentication providers enabled
- [ ] FCM API key configured
- [ ] iOS APNs key uploaded
- [ ] Android google-services.json added
- [ ] Security rules configured
- [ ] Environment variables set

### 6.2 Post-Deployment
- [ ] Authentication flow tested
- [ ] Push notifications tested
- [ ] Role-based access verified
- [ ] Error monitoring configured
- [ ] Analytics tracking enabled
- [ ] Performance monitoring active

## 7. Troubleshooting

### 7.1 Common Authentication Issues
- **User registration fails**: Check Firebase console settings
- **Login timeout**: Verify network connectivity
- **Custom claims not updating**: Check admin permissions
- **Session persistence issues**: Verify AsyncStorage configuration

### 7.2 Common Push Notification Issues
- **FCM token not generated**: Check Firebase configuration
- **Notifications not received**: Verify device permissions
- **iOS notifications not working**: Check APNs configuration
- **Android notifications not working**: Verify google-services.json

### 7.3 Debug Commands
```bash
# Check Firebase configuration
firebase projects:list
firebase use gaterlink-app

# Deploy functions
firebase deploy --only functions

# Test authentication
firebase auth:export users.json

# Check FCM tokens
firebase firestore:get /users/user123
```

## 8. Support and Resources

### 8.1 Documentation
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/)

### 8.2 Tools
- Firebase Console
- Firebase CLI
- Postman (for API testing)
- FCM Testing Tool

### 8.3 Contact
For technical support or questions about this setup, please refer to the project documentation or contact the development team.
