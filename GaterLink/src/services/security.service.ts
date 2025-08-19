import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import JailMonkey from 'jail-monkey';
import LoggingService from './logging.service';
import { STORAGE_KEYS } from '../constants';

interface SecurityConfig {
  enableJailbreakDetection: boolean;
  enableScreenshotPrevention: boolean;
  enableRootDetection: boolean;
  enableDebuggerDetection: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  passwordMinLength: number;
  requirePasswordChange: boolean;
  passwordExpiryDays: number;
}

interface SessionData {
  userId: string;
  token: string;
  createdAt: number;
  lastActivity: number;
  deviceId: string;
  ipAddress?: string;
}

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  deviceInfo?: string;
}

class SecurityService {
  private securityConfig: SecurityConfig = {
    enableJailbreakDetection: true,
    enableScreenshotPrevention: true,
    enableRootDetection: true,
    enableDebuggerDetection: true,
    sessionTimeout: 30, // 30 minutes
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requirePasswordChange: false,
    passwordExpiryDays: 90,
  };

  private currentSession: SessionData | null = null;
  private loginAttempts: LoginAttempt[] = [];
  private readonly SECRET_KEY = 'GaterLink_Security_2024'; // In production, use env variable

  constructor() {
    this.loadSecurityConfig();
    this.performSecurityChecks();
  }

  /**
   * Load security configuration
   */
  private async loadSecurityConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG);
      if (configStr) {
        this.securityConfig = { ...this.securityConfig, ...JSON.parse(configStr) };
      }
    } catch (error) {
      LoggingService.error('Failed to load security config', 'Security', error as Error);
    }
  }

  /**
   * Save security configuration
   */
  async updateSecurityConfig(updates: Partial<SecurityConfig>): Promise<void> {
    try {
      this.securityConfig = { ...this.securityConfig, ...updates };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SECURITY_CONFIG,
        JSON.stringify(this.securityConfig)
      );
      LoggingService.info('Security config updated', 'Security', updates);
    } catch (error) {
      LoggingService.error('Failed to update security config', 'Security', error as Error);
    }
  }

  /**
   * Perform initial security checks
   */
  private async performSecurityChecks(): Promise<void> {
    const checks = {
      isJailbroken: false,
      isRooted: false,
      isDebuggerAttached: false,
      isEmulator: false,
    };

    try {
      // Jailbreak/Root detection
      if (this.securityConfig.enableJailbreakDetection || this.securityConfig.enableRootDetection) {
        checks.isJailbroken = JailMonkey.isJailBroken();
        checks.isRooted = Platform.OS === 'android' && JailMonkey.isJailBroken();
      }

      // Debugger detection
      if (this.securityConfig.enableDebuggerDetection) {
        checks.isDebuggerAttached = JailMonkey.isDebuggedMode();
      }

      // Emulator detection
      checks.isEmulator = await DeviceInfo.isEmulator();

      LoggingService.info('Security checks completed', 'Security', checks);

      // Alert if any security issues detected
      if (checks.isJailbroken || checks.isRooted) {
        LoggingService.warn('Device is jailbroken/rooted', 'Security');
        this.handleSecurityViolation('jailbreak_detected');
      }

      if (checks.isDebuggerAttached && !__DEV__) {
        LoggingService.warn('Debugger detected in production', 'Security');
        this.handleSecurityViolation('debugger_detected');
      }
    } catch (error) {
      LoggingService.error('Security check failed', 'Security', error as Error);
    }
  }

  /**
   * Handle security violations
   */
  private handleSecurityViolation(type: string): void {
    // In production, you might want to:
    // 1. Log out the user
    // 2. Send alert to backend
    // 3. Restrict app functionality
    // 4. Show security warning
    
    LoggingService.error('Security violation detected', 'Security', new Error(type), { type });
  }

  /**
   * Create secure session
   */
  async createSession(userId: string, token: string): Promise<void> {
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      
      this.currentSession = {
        userId,
        token: this.encryptData(token),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        deviceId,
      };

      await this.saveSession();
      LoggingService.info('Session created', 'Security', { userId, deviceId });
    } catch (error) {
      LoggingService.error('Failed to create session', 'Security', error as Error);
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        await this.loadSession();
      }

      if (!this.currentSession) {
        return false;
      }

      // Check session timeout
      const inactiveTime = Date.now() - this.currentSession.lastActivity;
      const timeoutMs = this.securityConfig.sessionTimeout * 60 * 1000;

      if (inactiveTime > timeoutMs) {
        LoggingService.warn('Session timeout', 'Security', { 
          inactiveTime: inactiveTime / 1000 / 60,
          timeout: this.securityConfig.sessionTimeout,
        });
        await this.clearSession();
        return false;
      }

      // Update last activity
      this.currentSession.lastActivity = Date.now();
      await this.saveSession();

      return true;
    } catch (error) {
      LoggingService.error('Session validation failed', 'Security', error as Error);
      return false;
    }
  }

  /**
   * Clear session
   */
  async clearSession(): Promise<void> {
    try {
      this.currentSession = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      LoggingService.info('Session cleared', 'Security');
    } catch (error) {
      LoggingService.error('Failed to clear session', 'Security', error as Error);
    }
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(email: string, success: boolean): Promise<void> {
    try {
      const attempt: LoginAttempt = {
        email,
        timestamp: Date.now(),
        success,
        deviceInfo: await DeviceInfo.getModel(),
      };

      this.loginAttempts.push(attempt);

      // Keep only recent attempts (last 24 hours)
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.loginAttempts = this.loginAttempts.filter(a => a.timestamp > dayAgo);

      await this.saveLoginAttempts();

      if (!success) {
        const recentFailures = this.getRecentFailedAttempts(email);
        if (recentFailures >= this.securityConfig.maxLoginAttempts) {
          LoggingService.warn('Max login attempts exceeded', 'Security', { email, attempts: recentFailures });
          this.handleAccountLockout(email);
        }
      }
    } catch (error) {
      LoggingService.error('Failed to record login attempt', 'Security', error as Error);
    }
  }

  /**
   * Check if account is locked out
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const recentFailures = this.getRecentFailedAttempts(email);
    return recentFailures >= this.securityConfig.maxLoginAttempts;
  }

  /**
   * Get recent failed login attempts
   */
  private getRecentFailedAttempts(email: string): number {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return this.loginAttempts.filter(
      a => a.email === email && !a.success && a.timestamp > hourAgo
    ).length;
  }

  /**
   * Handle account lockout
   */
  private async handleAccountLockout(email: string): Promise<void> {
    // In production:
    // 1. Send notification email
    // 2. Log security event
    // 3. Notify backend
    // 4. Implement temporary lockout
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'fair' | 'good' | 'strong';
  } {
    const errors: string[] = [];
    let strengthScore = 0;

    // Length check
    if (password.length < this.securityConfig.passwordMinLength) {
      errors.push(`Password must be at least ${this.securityConfig.passwordMinLength} characters`);
    } else {
      strengthScore++;
    }

    // Complexity checks
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      strengthScore++;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      strengthScore++;
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      strengthScore++;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      strengthScore++;
    }

    // Additional strength checks
    if (password.length >= 12) strengthScore++;
    if (password.length >= 16) strengthScore++;

    // Determine strength
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (strengthScore <= 2) strength = 'weak';
    else if (strengthScore <= 4) strength = 'fair';
    else if (strengthScore <= 6) strength = 'good';
    else strength = 'strong';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
    } catch (error) {
      LoggingService.error('Encryption failed', 'Security', error as Error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      LoggingService.error('Decryption failed', 'Security', error as Error);
      throw error;
    }
  }

  /**
   * Hash data (one-way)
   */
  hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      token += chars[randomIndex];
    }
    
    return this.hashData(token + Date.now());
  }

  /**
   * Save session data
   */
  private async saveSession(): Promise<void> {
    if (this.currentSession) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION_DATA,
        JSON.stringify(this.currentSession)
      );
    }
  }

  /**
   * Load session data
   */
  private async loadSession(): Promise<void> {
    try {
      const sessionStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (sessionStr) {
        this.currentSession = JSON.parse(sessionStr);
      }
    } catch (error) {
      LoggingService.error('Failed to load session', 'Security', error as Error);
    }
  }

  /**
   * Save login attempts
   */
  private async saveLoginAttempts(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LOGIN_ATTEMPTS,
        JSON.stringify(this.loginAttempts)
      );
    } catch (error) {
      LoggingService.error('Failed to save login attempts', 'Security', error as Error);
    }
  }

  /**
   * Get security config
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Check if device is secure
   */
  async isDeviceSecure(): Promise<{
    isSecure: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    if (JailMonkey.isJailBroken()) {
      issues.push('Device is jailbroken/rooted');
    }

    if (JailMonkey.isDebuggedMode() && !__DEV__) {
      issues.push('Debugger detected');
    }

    const isEmulator = await DeviceInfo.isEmulator();
    if (isEmulator && !__DEV__) {
      issues.push('Running on emulator');
    }

    return {
      isSecure: issues.length === 0,
      issues,
    };
  }
}

export default new SecurityService();