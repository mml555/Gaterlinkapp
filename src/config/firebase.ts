import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiHi33HXgRyLbdTgqZNtC_ufT7dj0Q1mY",
  authDomain: "gaterlink-app.firebaseapp.com",
  projectId: "gaterlink-app",
  storageBucket: "gaterlink-app.firebasestorage.app",
  messagingSenderId: "717253501144",
  appId: "1:717253501144:web:fb56f5bf87e06af4b8f7ad",
  measurementId: "G-V9TDNSEMGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
// Note: For React Native, we need to use a different approach
// The persistence will be handled by AsyncStorage automatically
const auth = initializeAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics (only in web environment)
let analytics: any = null;
isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);

export { app, auth, db, analytics };
export default app;
