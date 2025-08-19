import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LoginCredentials, RegisterData, User, ApiResponse, UserRole } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

class AuthService {
  private async saveTokenToKeychain(token: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        'gaterlink.auth',
        'authToken',
        token
      );
    } catch (error) {
      console.error('Failed to save token to keychain:', error);
    }
  }

  private async getTokenFromKeychain(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('gaterlink.auth');
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to get token from keychain:', error);
      return null;
    }
  }

  private async removeTokenFromKeychain(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials('gaterlink.auth');
    } catch (error) {
      console.error('Failed to remove token from keychain:', error);
    }
  }

  private async createUserDocument(firebaseUser: FirebaseUser, additionalData?: Partial<User>): Promise<User> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      firstName: additionalData?.firstName || firebaseUser.displayName?.split(' ')[0] || '',
      lastName: additionalData?.lastName || firebaseUser.displayName?.split(' ')[1] || '',
      phone: additionalData?.phone,
      role: (additionalData?.role as UserRole) || 'customer',
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
      ...additionalData
    };

    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return userData;
  }

  private async getUserDocument(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        id: userSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User;
    }

    return null;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // Save token securely
      await this.saveTokenToKeychain(token);
      await AsyncStorage.setItem('userToken', token);

      // Get user document from Firestore
      let user = await this.getUserDocument(firebaseUser.uid);
      
      if (!user) {
        // Create user document if it doesn't exist
        user = await this.createUserDocument(firebaseUser);
      }

      return {
        success: true,
        data: { user, token }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'LOGIN_FAILED',
          message: this.getErrorMessage(error.code)
        }
      };
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Create user document in Firestore
      const user = await this.createUserDocument(firebaseUser, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      });

      const token = await firebaseUser.getIdToken();
      
      // Save token securely
      await this.saveTokenToKeychain(token);
      await AsyncStorage.setItem('userToken', token);

      return {
        success: true,
        data: { user, token }
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'REGISTRATION_FAILED',
          message: this.getErrorMessage(error.code)
        }
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await this.removeTokenFromKeychain();
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return {
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'No authenticated user found'
          }
        };
      }

      const user = await this.getUserDocument(currentUser.uid);
      
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User document not found'
          }
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_USER_FAILED',
          message: error.message || 'Failed to get current user'
        }
      };
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return {
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'No authenticated user found'
          }
        };
      }

      // Update Firebase Auth profile if name changed
      if (userData.firstName || userData.lastName) {
        await updateProfile(currentUser, {
          displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        });
      }

      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });

      const updatedUser = await this.getUserDocument(currentUser.uid);
      
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return {
        success: true,
        data: updatedUser
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'UPDATE_FAILED',
          message: error.message || 'Failed to update profile'
        }
      };
    }
  }

  async enableBiometric(): Promise<ApiResponse<void>> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return {
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'No authenticated user found'
          }
        };
      }

      // Store biometric preference
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        biometricEnabled: true,
        updatedAt: serverTimestamp()
      });

      // Store credentials in keychain for biometric access
      const token = await currentUser.getIdToken();
      await Keychain.setInternetCredentials(
        'gaterlink.biometric',
        currentUser.email!,
        token,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Enable biometric error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'BIOMETRIC_FAILED',
          message: error.message || 'Failed to enable biometric authentication'
        }
      };
    }
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'RESET_FAILED',
          message: this.getErrorMessage(error.code)
        }
      };
    }
  }

  async verifyEmail(code: string): Promise<ApiResponse<void>> {
    try {
      // Note: Email verification is handled automatically by Firebase
      // when the user clicks the link in the email
      // This method could be used for custom verification flows
      
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        await currentUser.reload();
        
        if (!currentUser.emailVerified) {
          return {
            success: false,
            error: {
              code: 'VERIFICATION_FAILED',
              message: 'Email not verified. Please check your email for the verification link.'
            }
          };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Verify email error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'VERIFICATION_FAILED',
          message: error.message || 'Failed to verify email'
        }
      };
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'An error occurred. Please try again';
    }
  }
}

export const authService = new AuthService();