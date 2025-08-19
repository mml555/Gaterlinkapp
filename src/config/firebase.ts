import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Analytics (only in web environment)
let analytics = null;
isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);

export { app, auth, db, storage, analytics };
export default app;
