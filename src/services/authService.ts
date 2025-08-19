import { LoginCredentials, RegisterData, User, ApiResponse } from '../types';

// Placeholder auth service - implement with actual API calls
class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    // TODO: Implement actual API call
    console.log('Login attempt:', credentials);
    return Promise.resolve({
      success: true,
      data: {
        user: {
          id: '1',
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer' as any,
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
        token: 'fake-jwt-token',
      },
    });
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    // TODO: Implement actual API call
    console.log('Register attempt:', userData);
    return Promise.resolve({
      success: true,
      data: {
        user: {
          id: '1',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: 'customer' as any,
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
        token: 'fake-jwt-token',
      },
    });
  }

  async logout(): Promise<void> {
    // TODO: Implement actual API call
    console.log('Logout');
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    // TODO: Implement actual API call
    return Promise.reject(new Error('Not authenticated'));
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    // TODO: Implement actual API call
    console.log('Update profile:', userData);
    return Promise.reject(new Error('Not implemented'));
  }

  async enableBiometric(): Promise<ApiResponse<void>> {
    // TODO: Implement actual API call
    console.log('Enable biometric');
    return Promise.resolve({ success: true });
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    // TODO: Implement actual API call
    console.log('Reset password for:', email);
    return Promise.resolve({ success: true });
  }

  async verifyEmail(code: string): Promise<ApiResponse<void>> {
    // TODO: Implement actual API call
    console.log('Verify email with code:', code);
    return Promise.resolve({ success: true });
  }
}

export const authService = new AuthService();