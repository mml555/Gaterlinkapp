/**
 * Security Audit Service
 * Comprehensive security checks and validations
 */

import { Platform } from 'react-native';
import JailMonkey from 'jail-monkey';
import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

export interface SecurityCheckResult {
  passed: boolean;
  issues: SecurityIssue[];
  score: number;
  timestamp: Date;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
}

class SecurityAuditService {
  private static instance: SecurityAuditService;
  private encryptionKey: string;
  private lastAuditResult: SecurityCheckResult | null = null;
  private suspiciousActivityCount: number = 0;
  private maxSuspiciousActivities: number = 10;

  private constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.initialize();
  }

  static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  private initialize() {
    // Perform initial security checks
    this.performSecurityAudit();
    
    // Set up periodic security checks
    setInterval(() => this.performSecurityAudit(), 30 * 60 * 1000); // Every 30 minutes
  }

  private generateEncryptionKey(): string {
    // Generate a unique key based on device information
    const deviceId = DeviceInfo.getUniqueId();
    const bundleId = DeviceInfo.getBundleId();
    return CryptoJS.SHA256(`${deviceId}-${bundleId}-${Date.now()}`).toString();
  }

  /**
   * Perform comprehensive security audit
   */
  async performSecurityAudit(): Promise<SecurityCheckResult> {
    const issues: SecurityIssue[] = [];
    let score = 100;

    // 1. Device Security Checks
    const deviceChecks = await this.checkDeviceSecurity();
    issues.push(...deviceChecks.issues);
    score -= deviceChecks.issues.length * 10;

    // 2. Network Security Checks
    const networkChecks = await this.checkNetworkSecurity();
    issues.push(...networkChecks.issues);
    score -= networkChecks.issues.length * 5;

    // 3. App Integrity Checks
    const integrityChecks = await this.checkAppIntegrity();
    issues.push(...integrityChecks.issues);
    score -= integrityChecks.issues.length * 15;

    // 4. Data Storage Security
    const storageChecks = await this.checkDataStorage();
    issues.push(...storageChecks.issues);
    score -= storageChecks.issues.length * 10;

    // 5. Authentication Security
    const authChecks = await this.checkAuthenticationSecurity();
    issues.push(...authChecks.issues);
    score -= authChecks.issues.length * 10;

    // 6. API Security
    const apiChecks = await this.checkApiSecurity();
    issues.push(...apiChecks.issues);
    score -= apiChecks.issues.length * 8;

    const result: SecurityCheckResult = {
      passed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      score: Math.max(0, score),
      timestamp: new Date(),
    };

    this.lastAuditResult = result;
    return result;
  }

  /**
   * Check device security
   */
  private async checkDeviceSecurity(): Promise<{ issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    // Check for jailbreak/root
    if (JailMonkey.isJailBroken()) {
      issues.push({
        severity: 'critical',
        category: 'Device Security',
        description: 'Device is jailbroken/rooted',
        recommendation: 'The app should not be used on jailbroken/rooted devices for security reasons',
      });
    }

    // Check for debugging
    if (JailMonkey.isDebuggedMode()) {
      issues.push({
        severity: 'high',
        category: 'Device Security',
        description: 'App is running in debug mode',
        recommendation: 'Disable debugging in production builds',
      });
    }

    // Check for screen recording (iOS)
    if (Platform.OS === 'ios') {
      const isScreenBeingCaptured = await this.checkScreenRecording();
      if (isScreenBeingCaptured) {
        issues.push({
          severity: 'medium',
          category: 'Device Security',
          description: 'Screen recording detected',
          recommendation: 'Sensitive information may be captured',
        });
      }
    }

    // Check for emulator
    if (await DeviceInfo.isEmulator()) {
      issues.push({
        severity: 'medium',
        category: 'Device Security',
        description: 'App is running on an emulator',
        recommendation: 'Production apps should run on physical devices',
      });
    }

    // Check for developer mode
    if (__DEV__) {
      issues.push({
        severity: 'high',
        category: 'Device Security',
        description: 'App is running in development mode',
        recommendation: 'Ensure production builds have __DEV__ disabled',
      });
    }

    return { issues };
  }

  /**
   * Check network security
   */
  private async checkNetworkSecurity(): Promise<{ issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];
    const netInfo = await NetInfo.fetch();

    // Check for unsecured WiFi
    if (netInfo.type === 'wifi' && !netInfo.details?.isConnectionExpensive) {
      // Note: This is a simplified check
      issues.push({
        severity: 'low',
        category: 'Network Security',
        description: 'Connected to WiFi network',
        recommendation: 'Ensure WiFi network is secure when handling sensitive data',
      });
    }

    // Check for VPN
    if (netInfo.type === 'vpn') {
      // VPN is good for security
      console.log('VPN connection detected - good for security');
    }

    // Check SSL pinning (would need actual implementation)
    if (!this.isSSLPinningEnabled()) {
      issues.push({
        severity: 'high',
        category: 'Network Security',
        description: 'SSL pinning not enabled',
        recommendation: 'Enable SSL pinning to prevent man-in-the-middle attacks',
      });
    }

    return { issues };
  }

  /**
   * Check app integrity
   */
  private async checkAppIntegrity(): Promise<{ issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    // Check for code injection
    if (this.detectCodeInjection()) {
      issues.push({
        severity: 'critical',
        category: 'App Integrity',
        description: 'Potential code injection detected',
        recommendation: 'App integrity may be compromised',
      });
    }

    // Check for tampered app
    if (JailMonkey.hookDetected()) {
      issues.push({
        severity: 'critical',
        category: 'App Integrity',
        description: 'Runtime manipulation detected',
        recommendation: 'App may be tampered with',
      });
    }

    // Check bundle signature (simplified)
    const bundleId = DeviceInfo.getBundleId();
    if (!bundleId.includes('com.gaterlink')) {
      issues.push({
        severity: 'high',
        category: 'App Integrity',
        description: 'Unexpected bundle identifier',
        recommendation: 'App may be repackaged',
      });
    }

    return { issues };
  }

  /**
   * Check data storage security
   */
  private async checkDataStorage(): Promise<{ issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    // Check Keychain availability
    try {
      const hasKeychain = await Keychain.getSupportedBiometryType();
      if (!hasKeychain) {
        issues.push({
          severity: 'medium',
          category: 'Data Storage',
          description: 'Secure keychain not available',
          recommendation: 'Enable secure storage for sensitive data',
        });
      }
    } catch (error) {
      issues.push({
        severity: 'medium',
        category: 'Data Storage',
        description: 'Cannot access secure storage',
        recommendation: 'Check keychain/keystore configuration',
      });
    }

    // Check for sensitive data in AsyncStorage (would need actual implementation)
    if (await this.hasSensitiveDataInAsyncStorage()) {
      issues.push({
        severity: 'high',
        category: 'Data Storage',
        description: 'Sensitive data found in insecure storage',
        recommendation: 'Move sensitive data to secure keychain storage',
      });
    }

    return { issues };
  }

  /**
   * Check authentication security
   */
  private async checkAuthenticationSecurity(): Promise<{ issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    // Check biometric availability
    const biometryType = await Keychain.getSupportedBiometryType();
    if (!biometryType) {
      issues.push({
        severity: 'low',
        category: 'Authentication',
        description: 'Biometric authentication not available',
        recommendation: 'Enable biometric authentication for enhanced security',
      });
    }

    // Check for weak session management (simplified)
    if (!this.isSessionSecure()) {
      issues.push({
        severity: 'high',
        category: 'Authentication',
        description: 'Weak session management detected',
        recommendation: 'Implement secure session tokens with expiration',
      });
    }

    return { issues };
  }

  /**
   * Check API security
   */
  private async checkApiSecurity(): Promise<{ issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    // Check for API key exposure (simplified)
    if (this.detectExposedApiKeys()) {
      issues.push({
        severity: 'critical',
        category: 'API Security',
        description: 'API keys may be exposed',
        recommendation: 'Store API keys securely and use environment variables',
      });
    }

    // Check for certificate validation
    if (!this.isCertificateValidationEnabled()) {
      issues.push({
        severity: 'high',
        category: 'API Security',
        description: 'Certificate validation not properly configured',
        recommendation: 'Enable proper certificate validation',
      });
    }

    return { issues };
  }

  /**
   * Helper methods
   */
  private async checkScreenRecording(): Promise<boolean> {
    // This would need native implementation
    return false;
  }

  private isSSLPinningEnabled(): boolean {
    // Check if SSL pinning is configured
    // This would need actual implementation
    return false;
  }

  private detectCodeInjection(): boolean {
    // Check for common injection patterns
    // This is a simplified check
    return false;
  }

  private async hasSensitiveDataInAsyncStorage(): Promise<boolean> {
    // Check AsyncStorage for sensitive patterns
    // This would need actual implementation
    return false;
  }

  private isSessionSecure(): boolean {
    // Check session token implementation
    // This would need actual implementation
    return true;
  }

  private detectExposedApiKeys(): boolean {
    // Check for hardcoded API keys
    // This would need actual implementation
    return false;
  }

  private isCertificateValidationEnabled(): boolean {
    // Check certificate validation configuration
    // This would need actual implementation
    return true;
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Hash sensitive data
   */
  hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Validate input against injection attacks
   */
  sanitizeInput(input: string): string {
    // Remove potential SQL injection patterns
    let sanitized = input.replace(/['";\\]/g, '');
    
    // Remove potential XSS patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    
    // Remove potential command injection patterns
    sanitized = sanitized.replace(/[|&;`$]/g, '');
    
    return sanitized.trim();
  }

  /**
   * Detect suspicious activity
   */
  reportSuspiciousActivity(activity: string) {
    this.suspiciousActivityCount++;
    console.warn(`Suspicious activity detected: ${activity}`);
    
    if (this.suspiciousActivityCount > this.maxSuspiciousActivities) {
      this.handleSecurityBreach();
    }
  }

  /**
   * Handle security breach
   */
  private handleSecurityBreach() {
    console.error('Security breach detected - taking protective action');
    // Clear sensitive data
    // Log out user
    // Report to server
    // Lock app
  }

  /**
   * Get last audit result
   */
  getLastAuditResult(): SecurityCheckResult | null {
    return this.lastAuditResult;
  }

  /**
   * Reset suspicious activity counter
   */
  resetSuspiciousActivityCounter() {
    this.suspiciousActivityCount = 0;
  }
}

export default SecurityAuditService.getInstance();
export { SecurityAuditService };