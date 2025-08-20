import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface ServiceStatus {
  firebaseConnected: boolean;
  userAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  servicesInitialized: boolean;
  firestoreAccessible: boolean;
  timestamp: Date;
}

export async function checkServiceStatus(): Promise<ServiceStatus> {
  const status: ServiceStatus = {
    firebaseConnected: false,
    userAuthenticated: false,
    servicesInitialized: false,
    firestoreAccessible: false,
    timestamp: new Date()
  };

  try {
    // Check Firebase connection
    if (auth && db) {
      status.firebaseConnected = true;
    }

    // Check user authentication
    if (auth.currentUser) {
      status.userAuthenticated = true;
      status.userId = auth.currentUser.uid;
      status.userEmail = auth.currentUser.email || undefined;
    }

    // Check Firestore access
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        status.firestoreAccessible = true;
      } catch (error) {
        console.log('Firestore access check failed:', error);
      }
    }

    // Check if services are initialized (this would be set by serviceInitializer)
    // For now, we'll assume they are if user is authenticated
    status.servicesInitialized = status.userAuthenticated;

    return status;
  } catch (error) {
    console.error('Service status check failed:', error);
    return status;
  }
}

export function logServiceStatus(status: ServiceStatus) {
  console.log('🔍 Service Status Check:');
  console.log(`   Firebase Connected: ${status.firebaseConnected ? '✅' : '❌'}`);
  console.log(`   User Authenticated: ${status.userAuthenticated ? '✅' : '❌'}`);
  if (status.userId) {
    console.log(`   User ID: ${status.userId}`);
  }
  if (status.userEmail) {
    console.log(`   User Email: ${status.userEmail}`);
  }
  console.log(`   Services Initialized: ${status.servicesInitialized ? '✅' : '❌'}`);
  console.log(`   Firestore Accessible: ${status.firestoreAccessible ? '✅' : '❌'}`);
  console.log(`   Timestamp: ${status.timestamp.toISOString()}`);
}
