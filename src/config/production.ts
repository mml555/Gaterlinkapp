// Production Environment Configuration
// Gaterlink Access Control System

export const productionConfig = {
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyBV6uVZCfcmwu5b1T2bhPcRkTFNlHWHQUA",
    authDomain: "gaterlink-prod.firebaseapp.com",
    projectId: "gaterlink-prod",
    storageBucket: "gaterlink-prod.appspot.com",
    messagingSenderId: "717253501144",
    appId: "1:717253501144:web:fb56f5bf87e06af4b8f7ad",
    measurementId: "G-V9TDNSEMGE"
  },

  // API Configuration
  api: {
    baseUrl: "https://api.gaterlink.com",
    socketUrl: "wss://socket.gaterlink.com",
    timeout: 30000,
    retryAttempts: 3
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || "your-super-secure-jwt-secret-key-here",
    encryptionKey: process.env.ENCRYPTION_KEY || "your-32-character-encryption-key-here",
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    lockoutDuration: 900000 // 15 minutes
  },

  // Push Notifications
  notifications: {
    fcm: {
      serverKey: process.env.FCM_SERVER_KEY || "your-fcm-server-key-here",
      vapidKey: process.env.FCM_VAPID_KEY || "your-fcm-vapid-key-here"
    },
    apn: {
      keyId: process.env.APN_KEY_ID || "your-apn-key-id-here",
      teamId: process.env.APN_TEAM_ID || "your-apn-team-id-here",
      bundleId: process.env.APN_BUNDLE_ID || "com.gaterlink.app"
    },
    email: {
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: parseInt(process.env.SMTP_PORT || "587"),
      smtpUser: process.env.SMTP_USER || "notifications@gaterlink.com",
      smtpPass: process.env.SMTP_PASS || "your-smtp-password-here"
    },
    sms: {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "your-twilio-account-sid",
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "your-twilio-auth-token",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "+1234567890"
    }
  },

  // File Storage
  storage: {
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    imageCompression: {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    }
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || "your-sentry-dsn-here",
    logLevel: process.env.LOG_LEVEL || "info",
    enableAnalytics: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: true
  },

  // Feature Flags
  features: {
    enableAnalytics: true,
    enablePushNotifications: true,
    enableSmsNotifications: true,
    enableEmailNotifications: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableQrCodeScanning: true,
    enableRealTimeUpdates: true
  },

  // Performance
  performance: {
    cacheTtl: 3600, // 1 hour
    apiTimeout: 30000,
    socketTimeout: 10000,
    imageCacheSize: 100,
    maxConcurrentRequests: 10
  },

  // Database
  database: {
    firestore: {
      projectId: "gaterlink-prod",
      enableOfflinePersistence: true,
      cacheSizeBytes: 104857600 // 100MB
    },
    realtime: {
      enablePresence: true,
      enableOffline: true
    }
  },

  // WebSocket
  websocket: {
    url: "wss://socket.gaterlink.com",
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
  },

  // App Configuration
  app: {
    name: "Gaterlink",
    version: "1.0.0",
    buildNumber: "1",
    bundleId: "com.gaterlink.app",
    environment: "production"
  }
};

export default productionConfig;
