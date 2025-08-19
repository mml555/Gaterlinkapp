import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import LoggingService from './logging.service';
import { STORAGE_KEYS } from '../constants';

interface BiometricCredentials {
  email: string;
  password: string;
  timestamp: number;
}

interface BiometricSettings {
  enabled: boolean;
  requireOnAppStart: boolean;
  requireForSensitiveActions: boolean;
  lastAuthenticated?: number;
  failedAttempts: number;
}

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics;
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private settings: BiometricSettings | null = null;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
    this.loadSettings();
  }

  /**
   * Load biometric settings
   */
  private async loadSettings(): Promise<void> {
    try {
      const settingsStr = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_SETTINGS);
      if (settingsStr) {
        this.settings = JSON.parse(settingsStr);
      } else {
        this.settings = {
          enabled: false,
          requireOnAppStart: true,
          requireForSensitiveActions: true,
          failedAttempts: 0,
        };
      }
    } catch (error) {
      LoggingService.error('Failed to load biometric settings', 'Biometric', error as Error);
    }
  }

  /**
   * Save biometric settings
   */
  private async saveSettings(): Promise<void> {
    try {
      if (this.settings) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.BIOMETRIC_SETTINGS,
          JSON.stringify(this.settings)
        );
      }
    } catch (error) {
      LoggingService.error('Failed to save biometric settings', 'Biometric', error as Error);
    }
  }

  /**
   * Check if biometrics are available
   */
  async isBiometricsAvailable(): Promise<{
    available: boolean;
    biometryType?: BiometryTypes;
    error?: string;
  }> {
    try {
      const { available, biometryType, error } = await this.rnBiometrics.isSensorAvailable();
      
      LoggingService.info('Biometric availability check', 'Biometric', {
        available,
        biometryType,
        error,
      });

      return { available, biometryType, error };
    } catch (error) {
      LoggingService.error('Failed to check biometric availability', 'Biometric', error as Error);
      return { available: false, error: 'Failed to check biometric sensor' };
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometrics(
    email: string,
    password: string,
    settings?: Partial<BiometricSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if biometrics are available
      const { available, biometryType } = await this.isBiometricsAvailable();
      if (!available) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      // Authenticate user first
      const authResult = await this.authenticateUser(
        'Enable Biometric Login',
        'Authenticate to enable biometric login'
      );
      
      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }

      // Create biometric key
      const keyResult = await this.rnBiometrics.createKeys();
      if (!keyResult.publicKey) {
        return { success: false, error: 'Failed to create biometric keys' };
      }

      // Encrypt and store credentials
      const encryptedCredentials = await this.encryptCredentials({ email, password });
      await Keychain.setInternetCredentials(
        'com.gaterlink.biometric',
        'credentials',
        encryptedCredentials
      );

      // Update settings
      this.settings = {
        enabled: true,
        requireOnAppStart: settings?.requireOnAppStart ?? true,
        requireForSensitiveActions: settings?.requireForSensitiveActions ?? true,
        failedAttempts: 0,
        lastAuthenticated: Date.now(),
      };
      await this.saveSettings();

      LoggingService.info('Biometrics enabled', 'Biometric', { email, biometryType });
      return { success: true };
    } catch (error) {
      LoggingService.error('Failed to enable biometrics', 'Biometric', error as Error);
      return { success: false, error: 'Failed to enable biometric authentication' };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometrics(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear stored credentials
      await Keychain.resetInternetCredentials('com.gaterlink.biometric');
      
      // Delete biometric keys
      await this.rnBiometrics.deleteKeys();
      
      // Update settings
      this.settings = {
        enabled: false,
        requireOnAppStart: false,
        requireForSensitiveActions: false,
        failedAttempts: 0,
      };
      await this.saveSettings();

      LoggingService.info('Biometrics disabled', 'Biometric');
      return { success: true };
    } catch (error) {
      LoggingService.error('Failed to disable biometrics', 'Biometric', error as Error);
      return { success: false, error: 'Failed to disable biometric authentication' };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticateUser(
    title: string = 'Authentication Required',
    description: string = 'Please authenticate to continue'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if locked out
      if (this.isLockedOut()) {
        const remainingTime = this.getRemainingLockoutTime();
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes`,
        };
      }

      // Perform biometric authentication
      const { success, error } = await this.rnBiometrics.simplePrompt({
        promptMessage: description,
        fallbackPromptMessage: 'Use passcode',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        // Reset failed attempts and update last authenticated time
        if (this.settings) {
          this.settings.failedAttempts = 0;
          this.settings.lastAuthenticated = Date.now();
          await this.saveSettings();
        }

        LoggingService.info('Biometric authentication successful', 'Biometric');
        return { success: true };
      } else {
        // Increment failed attempts
        if (this.settings) {
          this.settings.failedAttempts++;
          await this.saveSettings();
        }

        LoggingService.warn('Biometric authentication failed', 'Biometric', { error });
        return { success: false, error: error || 'Authentication failed' };
      }
    } catch (error) {
      LoggingService.error('Biometric authentication error', 'Biometric', error as Error);
      return { success: false, error: 'Authentication error' };
    }
  }

  /**
   * Get stored credentials after biometric authentication
   */
  async getStoredCredentials(): Promise<BiometricCredentials | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('com.gaterlink.biometric');
      if (!credentials) {
        return null;
      }

      const decrypted = await this.decryptCredentials(credentials.password);
      return decrypted;
    } catch (error) {
      LoggingService.error('Failed to get stored credentials', 'Biometric', error as Error);
      return null;
    }
  }

  /**
   * Check if biometric authentication is required
   */
  shouldRequireAuthentication(forSensitiveAction: boolean = false): boolean {
    if (!this.settings?.enabled) {
      return false;
    }

    if (forSensitiveAction && !this.settings.requireForSensitiveActions) {
      return false;
    }

    // Check if authentication has expired
    if (this.settings.lastAuthenticated) {
      const timeSinceAuth = Date.now() - this.settings.lastAuthenticated;
      if (timeSinceAuth < this.AUTH_TIMEOUT) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user is locked out
   */
  private isLockedOut(): boolean {
    if (!this.settings) return false;
    
    if (this.settings.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - (this.settings.lastAuthenticated || 0);
      return timeSinceLastAttempt < this.LOCKOUT_DURATION;
    }
    
    return false;
  }

  /**
   * Get remaining lockout time in milliseconds
   */
  private getRemainingLockoutTime(): number {
    if (!this.settings || !this.isLockedOut()) return 0;
    
    const timeSinceLastAttempt = Date.now() - (this.settings.lastAuthenticated || 0);
    return Math.max(0, this.LOCKOUT_DURATION - timeSinceLastAttempt);
  }

  /**
   * Encrypt credentials
   */
  private async encryptCredentials(credentials: BiometricCredentials): Promise<string> {
    const data = {
      ...credentials,
      timestamp: Date.now(),
    };
    
    // Generate a unique key based on device
    const deviceKey = await this.getDeviceKey();
    
    // Encrypt with AES
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      deviceKey
    ).toString();
    
    return encrypted;
  }

  /**
   * Decrypt credentials
   */
  private async decryptCredentials(encryptedData: string): Promise<BiometricCredentials | null> {
    try {
      const deviceKey = await this.getDeviceKey();
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData, deviceKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        return null;
      }
      
      const data = JSON.parse(decryptedString);
      
      // Check if credentials are expired (older than 30 days)
      const age = Date.now() - data.timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) {
        LoggingService.warn('Biometric credentials expired', 'Biometric');
        return null;
      }
      
      return data;
    } catch (error) {
      LoggingService.error('Failed to decrypt credentials', 'Biometric', error as Error);
      return null;
    }
  }

  /**
   * Get device-specific encryption key
   */
  private async getDeviceKey(): Promise<string> {
    // In a production app, you would use a more secure method
    // such as Android Keystore or iOS Keychain for the encryption key
    const deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      const newId = `device_${Date.now()}_${Math.random()}`;
      await AsyncStorage.setItem('device_id', newId);
      return newId;
    }
    return deviceId;
  }

  /**
   * Update biometric settings
   */
  async updateSettings(updates: Partial<BiometricSettings>): Promise<void> {
    if (!this.settings) return;
    
    this.settings = {
      ...this.settings,
      ...updates,
    };
    
    await this.saveSettings();
    LoggingService.info('Biometric settings updated', 'Biometric', updates);
  }

  /**
   * Get current settings
   */
  getSettings(): BiometricSettings | null {
    return this.settings;
  }

  /**
   * Get biometry type string
   */
  getBiometryTypeString(type?: BiometryTypes): string {
    switch (type) {
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.Biometrics:
        return Platform.OS === 'ios' ? 'Biometrics' : 'Fingerprint';
      default:
        return 'Biometric Authentication';
    }
  }
}

export default new BiometricService();