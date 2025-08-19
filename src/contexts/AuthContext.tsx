import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { getCurrentUser, enableBiometric } from '../store/slices/authSlice';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  biometricEnabled: boolean;
  enableBiometricAuth: () => Promise<void>;
  checkBiometricAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, biometricEnabled } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated by getting current user
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          await dispatch(getCurrentUser() as any);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const enableBiometricAuth = async () => {
    try {
      await dispatch(enableBiometric() as any);
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      throw error;
    }
  };

  const checkBiometricAuth = async (): Promise<boolean> => {
    try {
      // For now, return false since authenticateWithBiometrics doesn't exist
      // This would typically integrate with react-native-biometrics
      return false;
    } catch (error) {
      console.error('Biometric auth check failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    biometricEnabled,
    enableBiometricAuth,
    checkBiometricAuth,
  };

  if (!isInitialized) {
    return null; // or a loading component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
