import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as Keychain from 'react-native-keychain';
import { User, ApiResponse } from '../types';

class AuthService {
  private currentUser: FirebaseAuthTypes.User | null = null;

  constructor() {
    auth().onAuthStateChanged(this.onAuthStateChanged);
  }

  private onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    this.currentUser = user;
  };

  /**
   * Register a new user with email and password
   */
  async register(
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<ApiResponse<User>> {
    try {
      // Create user in Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const { uid } = userCredential.user;

      // Create user profile in Firestore
      const userData: User = {
        id: uid,
        email,
        name,
        phone,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestore().collection('users').doc(uid).set(userData);

      // Store credentials securely
      await this.storeCredentials(email, password);

      return {
        success: true,
        data: userData,
        message: 'Registration successful',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const { uid } = userCredential.user;

      // Fetch user profile from Firestore
      const userDoc = await firestore().collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() as User;

      // Store credentials securely
      await this.storeCredentials(email, password);

      return {
        success: true,
        data: userData,
        message: 'Login successful',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      await auth().signOut();
      await this.clearCredentials();

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const user = auth().currentUser;
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() as User;

      return {
        success: true,
        data: userData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get user profile',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const user = auth().currentUser;
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await firestore().collection('users').doc(user.uid).update(updateData);

      const updatedDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = updatedDoc.data() as User;

      return {
        success: true,
        data: userData,
        message: 'Profile updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      await auth().sendPasswordResetEmail(email);

      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send password reset email',
      };
    }
  }

  /**
   * Store credentials securely
   */
  private async storeCredentials(email: string, password: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        'com.gaterlink.app',
        email,
        password
      );
    } catch (error) {
      console.error('Failed to store credentials:', error);
    }
  }

  /**
   * Retrieve stored credentials
   */
  async getStoredCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('com.gaterlink.app');
      
      if (credentials) {
        return {
          email: credentials.username,
          password: credentials.password,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Clear stored credentials
   */
  private async clearCredentials(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials('com.gaterlink.app');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get current Firebase user
   */
  getFirebaseUser(): FirebaseAuthTypes.User | null {
    return this.currentUser;
  }
}

export default new AuthService();