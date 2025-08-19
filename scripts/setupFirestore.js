// Firebase setup script
// Run this after configuring your Firebase project

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

const firebaseConfig = {
  // Replace with your actual config
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data to initialize your Firestore
const sampleData = {
  users: {
    'admin-user': {
      id: 'admin-user',
      email: 'admin@gaterlink.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      biometricEnabled: false,
      notificationSettings: {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        soundEnabled: true,
        badgeEnabled: true,
      },
    },
  },
  doors: {
    'door-1': {
      id: 'door-1',
      name: 'Front Door',
      location: 'Main Entrance',
      qrCode: 'qr-front-door-001',
      description: 'Main entrance door',
      isActive: true,
      accessLevel: 'restricted',
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
    },
    'door-2': {
      id: 'door-2',
      name: 'Back Gate',
      location: 'Garden',
      qrCode: 'qr-back-gate-002',
      description: 'Garden access gate',
      isActive: true,
      accessLevel: 'restricted',
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
    },
  },
};

async function setupFirestore() {
  try {
    console.log('Setting up Firestore collections...');
    
    // Create users
    for (const [userId, userData] of Object.entries(sampleData.users)) {
      await setDoc(doc(db, 'users', userId), userData);
      console.log(`Created user: ${userId}`);
    }
    
    // Create doors
    for (const [doorId, doorData] of Object.entries(sampleData.doors)) {
      await setDoc(doc(db, 'doors', doorId), doorData);
      console.log(`Created door: ${doorId}`);
    }
    
    console.log('Firestore setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Firestore:', error);
  }
}

// Run the setup
setupFirestore();
