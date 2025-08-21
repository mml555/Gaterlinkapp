import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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

      const loginPromise = auth().signInWithEmailAndPassword(
        credentials.email,
        credentials.password
      );

      const userCredential = await Promise.race([loginPromise, timeoutPromise]);

      const firebaseUser = userCredential.user;
      
      // Get user data with caching
      const userData = await this.getUserDataWithCache(firebaseUser.uid);

      // Ensure user document exists with proper structure
      await this.ensureUserDocumentExists(firebaseUser.uid, userData);

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
      const userCredential = await auth().createUserWithEmailAndPassword(
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update profile with display name
      await firebaseUser.updateProfile({
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
      await auth().signOut();
    } catch (error: any) {
      console.error('Firebase logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) return null;

      return await this.getUserData(firebaseUser.uid);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      auth().onAuthStateChanged((user) => {
        resolve(!!user);
      });
    });
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Firebase password reset error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      const userRef = firestore().collection('users').doc(firebaseUser.uid);
      await userRef.update(updates);

      return await this.getUserData(firebaseUser.uid);
    } catch (error: any) {
      console.error('Firebase profile update error:', error);
      throw new Error('Failed to update profile');
    }
  }

  private async createUserDocument(user: User): Promise<void> {
    try {
      const userRef = firestore().collection('users').doc(user.id);
      await userRef.set({
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
      await firestore().collection('users').doc(user.id).update({
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
      const userRef = firestore().collection('users').doc(userId);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
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
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        try {
          this.getUserData(firebaseUser.uid).then(user => callback(user));
        } catch (error) {
          console.error('Error getting user data in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Check current user's custom claims and permissions
  async checkUserPermissions(): Promise<{ 
    uid: string; 
    customClaims: any; 
    token: string; 
    permissions: string[] 
  } | null> {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        console.log('No authenticated user');
        return null;
      }

      const token = await firebaseUser.getIdTokenResult();
      const customClaims = token.claims || {};
      
      console.log('User permissions check:', {
        uid: firebaseUser.uid,
        customClaims,
        token: token.token.substring(0, 20) + '...',
        permissions: Object.keys(customClaims)
      });

      return {
        uid: firebaseUser.uid,
        customClaims,
        token: token.token,
        permissions: Object.keys(customClaims)
      };
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return null;
    }
  }

  // Force refresh user token to get updated custom claims
  async refreshUserToken(): Promise<string | null> {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        return null;
      }

      // Force refresh the token
      const newToken = await firebaseUser.getIdToken(true);
      console.log('User token refreshed successfully');
      return newToken;
    } catch (error) {
      console.error('Error refreshing user token:', error);
      return null;
    }
  }

  private async ensureUserDocumentExists(userId: string, userData: User): Promise<void> {
    try {
      const userRef = firestore().collection('users').doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.log(`User document not found for ${userId}, creating...`);
        
        // Create user document with proper structure
        const newUserData = {
          ...userData,
          role: userData.role || 'customer',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          notificationSettings: {
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false,
            soundEnabled: true,
            badgeEnabled: true,
          },
        };
        
        await userRef.set(newUserData);
        console.log(`User document created for ${userId} with role: ${newUserData.role}`);
      } else {
        console.log(`User document already exists for ${userId}`);
        
        // Check if user document has proper structure
        const existingData = userSnap.data();
        if (!existingData.role || !existingData.notificationSettings) {
          console.log(`Updating user document structure for ${userId}...`);
          
          const updatedData = {
            ...existingData,
            role: existingData.role || 'customer',
            notificationSettings: existingData.notificationSettings || {
              pushEnabled: true,
              emailEnabled: true,
              smsEnabled: false,
              soundEnabled: true,
              badgeEnabled: true,
            },
            updatedAt: new Date(),
          };
          
          await userRef.update(updatedData);
          console.log(`User document updated for ${userId}`);
        }
      }
    } catch (error) {
      console.error(`Error ensuring user document exists for ${userId}:`, error);
      // Don't throw the error to prevent login failure
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
