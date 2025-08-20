# 🚪 GaterLink - Smart Access Control Platform

[![React Native](https://img.shields.io/badge/React%20Native-0.81.0-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.1.0-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

GaterLink is a comprehensive access control and facility management platform that revolutionizes how organizations manage door access, equipment reservations, and facility security.

## 📱 Features

### Core Features
- **🔐 Smart Door Access** - QR code scanning for instant entry
- **🛠️ Equipment Management** - Reserve and track equipment usage
- **🚨 Emergency Response** - Real-time emergency alerts and management
- **💬 Integrated Chat** - In-app messaging and notifications
- **👥 User Management** - Role-based access control
- **📊 Analytics Dashboard** - Comprehensive insights and reporting

### Technical Features
- **📱 Cross-Platform** - iOS and Android support
- **🔄 Real-time Updates** - WebSocket-based live data
- **📴 Offline Mode** - Core functionality without internet
- **🔒 Enterprise Security** - End-to-end encryption
- **🌍 Multi-language** - Internationalization support
- **🌙 Dark Mode** - Eye-friendly interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- React Native development environment
- iOS: Xcode 14.0+, CocoaPods
- Android: Android Studio, JDK 17
- Firebase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/gaterlink-app.git
cd gaterlink-app
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **iOS Setup**
```bash
cd ios
pod install
cd ..
```

4. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Firebase Setup**
- Create a Firebase project
- Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
- Place them in the appropriate directories

### Running the App

**Development Mode**
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Start Metro bundler
npx react-native start
```

**Production Build**
```bash
# iOS
cd ios
./build-optimization.sh

# Android
cd android
./build-optimization.sh
```

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── main/          # Main app screens
│   ├── admin/         # Admin screens
│   └── emergency/     # Emergency screens
├── services/          # Business logic and API
├── store/             # Redux state management
├── navigation/        # React Navigation setup
├── utils/             # Utility functions
├── types/             # TypeScript definitions
└── config/            # App configuration
```

## 🔧 Configuration

### Firebase Configuration
Update `src/config/firebase.ts` with your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};
```

### WebSocket Server
Configure WebSocket connection in `.env`:

```
WEBSOCKET_URL=wss://your-websocket-server.com
API_URL=https://your-api-server.com
```

## 📦 Key Dependencies

- **React Native**: 0.81.0
- **TypeScript**: 5.3.2
- **React Navigation**: 7.x
- **Redux Toolkit**: 2.8.2
- **Firebase**: 12.1.0
- **React Native Paper**: 5.14.5
- **Socket.IO Client**: 4.7.4

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
# iOS
npm run e2e:ios

# Android
npm run e2e:android
```

### Manual Testing
See [USER_TESTING_PLAN.md](testing/USER_TESTING_PLAN.md) for comprehensive testing procedures.

## 🚀 Deployment

### Firebase Deployment
```bash
# Deploy security rules
firebase deploy --only firestore:rules,storage

# Deploy functions
cd functions
npm run deploy
```

### WebSocket Server
```bash
cd websocket-server
docker-compose up -d
```

### Mobile App Distribution
- **iOS**: Upload to TestFlight via Xcode
- **Android**: Upload to Play Console

## 📊 Performance Optimization

The app includes several performance optimizations:
- Image caching and lazy loading
- Code splitting and dynamic imports
- Bundle size optimization (40% reduction)
- Memory management
- Network request optimization

See [Performance Guide](docs/PERFORMANCE.md) for details.

## 🔒 Security

GaterLink implements enterprise-grade security:
- End-to-end encryption
- Biometric authentication
- Certificate pinning
- Input sanitization
- Regular security audits

See [Security Documentation](docs/SECURITY.md) for details.

## 📱 App Store Submission

1. **Prepare Assets**
```bash
cd app-store-assets
./generate-app-icons.sh
```

2. **Update Metadata**
- App description
- Screenshots
- Privacy policy
- Terms of service

3. **Submit for Review**
- iOS: App Store Connect
- Android: Google Play Console

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- React Native community
- Firebase team
- All contributors and beta testers

## 📞 Support

- **Email**: support@gaterlink.com
- **Documentation**: [docs.gaterlink.com](https://docs.gaterlink.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/gaterlink-app/issues)

---

Built with ❤️ by the GaterLink Team