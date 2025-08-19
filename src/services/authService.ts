import { LoginCredentials, RegisterData, User, ApiResponse } from '../types';
import { firebaseAuthService } from './firebaseAuthService';

// Actual auth service implementation using Firebase
class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await firebaseAuthService.login(credentials);
      return {
        success: true,
        data: {
          user: response.user,
          token: response.token,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await firebaseAuthService.register({
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName}`,
        role: 'customer',
      });
      return {
        success: true,
        data: {
          user: response.user,
          token: response.token,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await firebaseAuthService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user',
        };
      }
      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get current user',
      };
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const updatedUser = await firebaseAuthService.updateUserProfile(userData);
      return {
        success: true,
        data: updatedUser,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  }

  async enableBiometric(): Promise<ApiResponse<void>> {
    try {
      // Update user profile to enable biometric
      await firebaseAuthService.updateUserProfile({ biometricEnabled: true });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to enable biometric',
      };
    }
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      await firebaseAuthService.resetPassword(email);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  }

  async verifyEmail(code: string): Promise<ApiResponse<void>> {
    try {
      // For email verification, we'll use a custom implementation
      // since Firebase doesn't provide a direct email verification with code
      // This would typically involve a custom backend endpoint
      console.log('Email verification with code:', code);
      
      // Simulate verification success for now
      // In a real implementation, you would call your backend API
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify email',
      };
    }
  }

  async resendVerificationCode(email: string): Promise<ApiResponse<void>> {
    try {
      // This would typically call your backend API to resend verification code
      console.log('Resending verification code to:', email);
      
      // Simulate success for now
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resend verification code',
      };
    }
  }
}

export const authService = new AuthService();