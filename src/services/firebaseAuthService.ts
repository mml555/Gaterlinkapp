import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, LoginCredentials, UserRole } from '../types';
import { performanceMonitor } from '../utils/performanceMonitor';

interface AuthResponse {
  user: User;
  token: string;
}

class FirebaseAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const stopTimer = performanceMonitor.startTimer('firebase_login');
    try {
      // Add timeout for better UX - increased to 30 seconds for slower connections
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - please check your internet connection')), 30000)
      );

      const loginPromise = signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const userCredential: UserCredential = await Promise.race([loginPromise, timeoutPromise]) as UserCredential;

      const firebaseUser = userCredential.user;
      
      // Get user data with caching
      const userData = await this.getUserDataWithCache(firebaseUser.uid);

      const result = {
        user: userData,
        token: await firebaseUser.getIdToken(),
      };

      stopTimer();
      return result;
    } catch (error: any) {
      stopTimer();
      console.error('Firebase login error:', error);
      
      // Handle timeout specifically
      if (error.message.includes('timeout')) {
        throw new Error('Login timeout - please check your internet connection and try again');
      }
      
      // Handle network errors
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error - please check your internet connection');
      }
      
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<AuthResponse> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update profile with display name
      await updateProfile(firebaseUser, {
        displayName: userData.name,
      });

      // Create user document in Firestore
      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const user: User = {
        id: firebaseUser.uid,
        email: userData.email,
        firstName,
        lastName,
        role: (userData.role as UserRole) || UserRole.CUSTOMER,
        profilePicture: this.generateAvatar(userData.name),
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
      };

      await this.createUserDocument(user);

      return {
        user,
        token: await firebaseUser.getIdToken(),
      };
    } catch (error: any) {
      console.error('Firebase registration error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Firebase logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      return await this.getUserData(firebaseUser.uid);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Firebase password reset error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, updates);

      return await this.getUserData(firebaseUser.uid);
    } catch (error: any) {
      console.error('Firebase profile update error:', error);
      throw new Error('Failed to update profile');
    }
  }

  private async createUserDocument(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Client-side trigger: Set default custom claims and notification settings
      await this.onUserCreated(user);
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  // Client-side trigger for user creation (free tier alternative to Cloud Functions)
  private async onUserCreated(user: User): Promise<void> {
    try {
      console.log(`Client-side trigger: New user created: ${user.id}`);

      // Set default custom claims (internal Firebase operation)
      const defaultClaims = {
        role: user.role || 'user',
        isActive: true,
        lastLogin: Date.now(),
      };

      // Note: Custom claims require admin SDK, so this will be handled by security rules
      // The client can't set custom claims directly, but we can store them in user document
      await updateDoc(doc(db, 'users', user.id), {
        customClaims: defaultClaims,
        notificationSettings: {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          soundEnabled: true,
          badgeEnabled: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`User setup completed for: ${user.id}`);
    } catch (error) {
      console.error('Error in client-side user creation trigger:', error);
    }
  }

  // Simple in-memory cache for user data
  private userCache: Map<string, { user: User; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async getUserData(userId: string): Promise<User> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as User;
      } else {
        throw new Error('User document not found');
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  private async getUserDataWithCache(userId: string): Promise<User> {
    const now = Date.now();
    const cached = this.userCache.get(userId);
    
    // Return cached data if it's still valid
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.user;
    }

    // Fetch fresh data
    const userData = await this.getUserData(userId);
    
    // Cache the fresh data
    this.userCache.set(userId, { user: userData, timestamp: now });
    
    return userData;
  }

  private generateAvatar(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Authentication failed. Please try again';
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.getUserData(firebaseUser.uid);
          callback(user);
        } catch (error) {
          console.error('Error getting user data in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const firebaseAuthService = new FirebaseAuthService();
