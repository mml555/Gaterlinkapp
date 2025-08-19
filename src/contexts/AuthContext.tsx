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
        // Check if user is already authenticated
        const token = await authService.getStoredToken();
        if (token) {
          await dispatch(getCurrentUser());
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
      await dispatch(enableBiometric());
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      throw error;
    }
  };

  const checkBiometricAuth = async (): Promise<boolean> => {
    try {
      const result = await authService.authenticateWithBiometrics();
      return result.success;
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
