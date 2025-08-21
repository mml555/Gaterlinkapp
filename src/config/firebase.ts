import { Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import analytics from '@react-native-firebase/analytics';
import perf from '@react-native-firebase/perf';

// Platform-specific Firebase configuration
const firebaseConfig = Platform.select({
  ios: {
    apiKey: "AIzaSyBV6uVZCfcmwu5b1T2bhPcRkTFNlHWHQUA",
    authDomain: "gaterlink-app.firebaseapp.com",
    projectId: "gaterlink-app",
    storageBucket: "gaterlink-app.firebasestorage.app",
    messagingSenderId: "717253501144",
    appId: "1:717253501144:ios:9dc251c678061a25b8f7ad",
    measurementId: "G-V9TDNSEMGE"
  },
  android: {
    apiKey: "AIzaSyBV6uVZCfcmwu5b1T2bhPcRkTFNlHWHQUA",
    authDomain: "gaterlink-app.firebaseapp.com",
    projectId: "gaterlink-app",
    storageBucket: "gaterlink-app.firebasestorage.app",
    messagingSenderId: "717253501144",
    appId: "1:717253501144:android:fb56f5bf87e06af4b8f7ad",
    measurementId: "G-V9TDNSEMGE"
  },
  default: {
    apiKey: "AIzaSyCiHi33HXgRyLbdTgqZNtC_ufT7dj0Q1mY",
    authDomain: "gaterlink-app.firebaseapp.com",
    projectId: "gaterlink-app",
    storageBucket: "gaterlink-app.firebasestorage.app",
    messagingSenderId: "717253501144",
    appId: "1:717253501144:web:fb56f5bf87e06af4b8f7ad",
    measurementId: "G-V9TDNSEMGE"
  }
});

// Initialize Firebase services
// Note: React Native Firebase auto-initializes when the app starts
// The configuration is handled in the native iOS/Android files

// Enable offline persistence for Firestore
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
});

// Initialize Analytics
let analyticsInstance: any = null;
try {
  analyticsInstance = analytics();
  console.log('Firebase Analytics initialized successfully');
} catch (error) {
  console.log('Firebase Analytics initialization failed:', error);
}

// Initialize Performance Monitoring
let perfInstance: any = null;
try {
  perfInstance = perf();
  console.log('Firebase Performance initialized successfully');
} catch (error) {
  console.log('Firebase Performance not available:', error);
}

// Export the native Firebase instances
export const app = {
  auth: () => auth(),
  firestore: () => firestore(),
  analytics: () => analyticsInstance,
  perf: () => perfInstance
};

export { auth, firestore, analyticsInstance as analytics, perfInstance as perf };
export default app;
