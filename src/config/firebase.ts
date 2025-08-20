import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with performance optimizations and persistence
let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing auth instance
  if (error.code === 'auth/already-initialized') {
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Initialize Firestore with performance optimizations
const db = getFirestore(app);

// Enable offline persistence for better performance
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Initialize Analytics (only in web environment)
let analytics: any = null;
if (Platform.OS === 'web') {
  isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
}

// Performance monitoring
let perf: any = null;
try {
  const { getPerformance } = require('firebase/performance');
  perf = getPerformance(app);
} catch (error) {
  console.log('Firebase Performance not available');
}

export { app, auth, db, analytics };
export default app;
