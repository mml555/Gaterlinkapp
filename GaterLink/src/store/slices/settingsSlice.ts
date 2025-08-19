import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../../types';
import { STORAGE_KEYS } from '../../constants';

interface SettingsState extends AppSettings {
  isLoading: boolean;
}

const initialState: SettingsState = {
  darkMode: false,
  notificationsEnabled: true,
  biometricsEnabled: false,
  smsNotificationsEnabled: false,
  language: 'en',
  soundEnabled: true,
  vibrationEnabled: true,
  isLoading: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    setBiometricsEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricsEnabled = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    setSmsNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.smsNotificationsEnabled = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    setVibrationEnabled: (state, action: PayloadAction<boolean>) => {
      state.vibrationEnabled = action.payload;
      AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(state));
    },
    loadSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setDarkMode,
  setNotificationsEnabled,
  setBiometricsEnabled,
  setSmsNotificationsEnabled,
  setLanguage,
  setSoundEnabled,
  setVibrationEnabled,
  loadSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;