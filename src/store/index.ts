import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import doorReducer from './slices/doorSlice';
import requestReducer from './slices/requestSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'doors'], // Only persist auth and doors
  serialize: true,
  deserialize: true,
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedDoorReducer = persistReducer(persistConfig, doorReducer);

// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    doors: persistedDoorReducer,
    requests: requestReducer,
    chat: chatReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt', 'payload.lastLoginAt'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt', 'auth.user.lastLoginAt'],
      },
      immutableCheck: {
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt', 'auth.user.lastLoginAt'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
