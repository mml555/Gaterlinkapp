import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginCredentials, RegisterData } from '../../types';
import { authService } from '../../services/authService';

// Helper function to serialize dates in user objects
const serializeUserDates = (user: any): any => {
  if (!user) return user;
  
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : user.lastLoginAt,
  };
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      // Serialize dates before storing in Redux
      if (response.success && response.data && response.data.user) {
        response.data.user = serializeUserDates(response.data.user);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      // Serialize dates before storing in Redux
      if (response.success && response.data && response.data.user) {
        response.data.user = serializeUserDates(response.data.user);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      // Serialize dates before storing in Redux
      if (user.success && user.data) {
        user.data = serializeUserDates(user.data);
      }
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const user = await authService.updateProfile(userData);
      // Serialize dates before storing in Redux
      if (user.success && user.data) {
        user.data = serializeUserDates(user.data);
      }
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (_, { rejectWithValue }) => {
    try {
      const success = await authService.enableBiometric();
      return success;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Biometric setup failed');
    }
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        // Serialize any date fields in the update
        const serializedUpdate = serializeUserDates(action.payload);
        state.user = { ...state.user, ...serializedUpdate };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.isAuthenticated = true;
          state.user = action.payload.data.user;
          state.biometricEnabled = action.payload.data.user.biometricEnabled;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.isAuthenticated = true;
          state.user = action.payload.data.user;
          state.biometricEnabled = action.payload.data.user.biometricEnabled;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.biometricEnabled = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.isAuthenticated = true;
          state.user = action.payload.data;
          state.biometricEnabled = action.payload.data.biometricEnabled;
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.user = action.payload.data;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Enable biometric
    builder
      .addCase(enableBiometric.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.isLoading = false;
        state.biometricEnabled = true;
        if (state.user) {
          state.user.biometricEnabled = true;
        }
      })
      .addCase(enableBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setBiometricEnabled, updateUser } = authSlice.actions;
export default authSlice.reducer;
