import { RootState } from '../store';
import { User } from '../types';

/**
 * Helper function to deserialize dates in user objects
 */
const deserializeUserDates = (user: any): User | null => {
  if (!user) return null;
  
  return {
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
  };
};

/**
 * Selector to get the current user with deserialized dates
 */
export const selectCurrentUser = (state: RootState): User | null => {
  const user = state.auth.user;
  return deserializeUserDates(user);
};

/**
 * Selector to get authentication state
 */
export const selectAuthState = (state: RootState) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isLoading: state.auth.isLoading,
  error: state.auth.error,
  biometricEnabled: state.auth.biometricEnabled,
});

/**
 * Selector to get user profile data with deserialized dates
 */
export const selectUserProfile = (state: RootState) => {
  const user = state.auth.user;
  return deserializeUserDates(user);
};

/**
 * Selector to check if user is authenticated
 */
export const selectIsAuthenticated = (state: RootState): boolean => {
  return state.auth.isAuthenticated;
};

/**
 * Selector to get authentication loading state
 */
export const selectAuthLoading = (state: RootState): boolean => {
  return state.auth.isLoading;
};

/**
 * Selector to get authentication error
 */
export const selectAuthError = (state: RootState): string | null => {
  return state.auth.error;
};

/**
 * Selector to check if biometric is enabled
 */
export const selectBiometricEnabled = (state: RootState): boolean => {
  return state.auth.biometricEnabled;
};
