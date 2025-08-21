import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { getCurrentUser, enableBiometric } from '../store/slices/authSlice';
import { authService } from '../services/authService';
import { serviceInitializer } from '../services/serviceInitializer';

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
          
          // Initialize client-side services for free tier automation
          console.log('Initializing client-side services...');
          // Add a small delay to ensure Firebase is fully initialized
          setTimeout(async () => {
            try {
              await serviceInitializer.initializeServices();
            } catch (error) {
              console.error('Error initializing services:', error);
              // Don't block the app if services fail to initialize
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't block the app if auth initialization fails
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Cleanup services when component unmounts
    return () => {
      console.log('Cleaning up client-side services...');
      try {
        serviceInitializer.cleanupServices();
      } catch (error) {
        console.error('Error cleaning up services on unmount:', error);
      }
    };
  }, [dispatch]);

  // Listen for authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // User is authenticated, ensure services are initialized
      console.log('User authenticated, ensuring services are initialized...');
      // Add a small delay to ensure Firebase is fully initialized
      setTimeout(async () => {
        try {
          await serviceInitializer.initializeServices();
        } catch (error) {
          console.error('Error initializing services:', error);
          // Don't block the app if services fail to initialize
        }
      }, 1000);
    } else if (!isAuthenticated) {
      // User is not authenticated, cleanup services
      console.log('User not authenticated, cleaning up services...');
      try {
        serviceInitializer.cleanupServices();
      } catch (error) {
        console.error('Error cleaning up services:', error);
      }
    }
  }, [isAuthenticated, user]);

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
