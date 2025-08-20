import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics (only in web environment)
let analytics: any = null;
if (Platform.OS === 'web') {
  isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
}

export { app, auth, db, analytics };
export default app;
