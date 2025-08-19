# GaterLink 

A comprehensive door access management system built with React Native CLI, designed to provide seamless access control, real-time communication, and secure authentication for iOS users.

## 🚀 Features

- **Authentication**: Firebase Authentication with email/password
- **Door Management**: Control and monitor door access
- **Access Requests**: Manage temporary and permanent access requests
- **Real-time Chat**: Communicate with team members
- **QR Code Scanning**: Scan QR codes for door access
- **Biometric Authentication**: Fingerprint and Face ID support
- **Push Notifications**: Real-time notifications for access events

## 📱 Platform Support

- **iOS**: Native iOS app with Xcode
- **Android**: Native Android app (coming soon)

## 🛠 Tech Stack

- **React Native**: 0.81.0
- **TypeScript**: Full type safety
- **Firebase**: Authentication, Firestore, Analytics
- **Redux Toolkit**: State management
- **React Navigation**: Navigation system
- **React Native Paper**: Material Design components
- **React Native Vector Icons**: Icon library

## 🚀 Getting Started

### Prerequisites
- iOS 15.0+
- React Native 0.81.0+
- Node.js 18+
- Xcode 14.0+
- CocoaPods

### Project Setup
```bash
# Install Node.js (if not already installed)
brew install node

# Install Xcode from App Store
# Install CocoaPods
sudo gem install cocoapods
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GaterLinkNative
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Update `src/config/firebase.ts` with your Firebase config

5. **Run the app**
   ```bash
   # iOS
   npm run ios
   
   # Android (coming soon)
   npm run android
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Configuration files (Firebase, etc.)
├── contexts/           # React contexts
├── navigation/         # Navigation configuration
├── screens/            # App screens
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── services/           # API and business logic services
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and themes
```

## 🔧 Available Scripts

- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run pod-install` - Install iOS dependencies

## 🔐 Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Copy your Firebase config to `src/config/firebase.ts`

## 📱 Building for Production

### iOS
1. Open `ios/GaterLinkNative.xcworkspace` in Xcode
2. Select your target device/simulator
3. Click the Run button or press Cmd+R

### Android (coming soon)
1. Open Android Studio
2. Import the `android` folder
3. Build and run the project

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@gaterlink.com or create an issue in the repository.
