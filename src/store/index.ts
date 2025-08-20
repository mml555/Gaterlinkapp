import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import doorReducer from './slices/doorSlice';
import requestReducer from './slices/requestSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import siteReducer from './slices/siteSlice';
import equipmentReducer from './slices/equipmentSlice';
import holdReducer from './slices/holdSlice';
import emergencyReducer from './slices/emergencySlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'doors', 'sites'], // Only persist auth, doors, and sites
  serialize: true,
  deserialize: true,
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedDoorReducer = persistReducer(persistConfig, doorReducer);
const persistedSiteReducer = persistReducer(persistConfig, siteReducer);

// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    doors: persistedDoorReducer,
    requests: requestReducer,
    chat: chatReducer,
    notifications: notificationReducer,
    sites: persistedSiteReducer,
    equipment: equipmentReducer,
    holds: holdReducer,
    emergencies: emergencyReducer,
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
        ignoredActionPaths: ['payload.timestamp', 'meta.arg.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.lastLoginAt', 'doors.lastScanResult.scannedAt'],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
