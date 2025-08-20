/**
 * Analytics Service
 * Comprehensive analytics tracking with Firebase Analytics
 */

import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProperties {
  userId?: string;
  email?: string;
  role?: string;
  siteId?: string;
  department?: string;
  accountType?: 'free' | 'premium' | 'enterprise';
  registrationDate?: string;
  lastActiveDate?: string;
}

export interface EventProperties {
  [key: string]: any;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private sessionId: string;
  private eventQueue: Array<{ name: string; properties?: EventProperties }> = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async initialize() {
    try {
      // Check if user has opted out of analytics
      const optOut = await AsyncStorage.getItem('@analytics_opt_out');
      this.isEnabled = optOut !== 'true';

      // Enable analytics collection
      await analytics().setAnalyticsCollectionEnabled(this.isEnabled);

      // Set default properties
      await this.setDefaultProperties();

      this.isInitialized = true;

      // Process queued events
      this.processEventQueue();
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async setDefaultProperties() {
    try {
      await analytics().setUserProperties({
        platform: Platform.OS,
        app_version: '1.0.0', // Get from package.json or config
        device_type: Platform.isPad ? 'tablet' : 'phone',
      });
    } catch (error) {
      console.error('Failed to set default properties:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.logEvent(event.name, event.properties);
      }
    }
  }

  /**
   * Set user ID for analytics
   */
  async setUserId(userId: string | null) {
    this.userId = userId;
    
    if (!this.isEnabled) return;

    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: UserProperties) {
    if (!this.isEnabled) return;

    try {
      const sanitizedProperties: any = {};
      
      // Sanitize and format properties
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          sanitizedProperties[key] = String(value);
        }
      });

      await analytics().setUserProperties(sanitizedProperties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Log custom event
   */
  async logEvent(eventName: string, properties?: EventProperties) {
    if (!this.isEnabled) return;

    // Queue events if not initialized
    if (!this.isInitialized) {
      this.eventQueue.push({ name: eventName, properties });
      return;
    }

    try {
      // Add session ID to all events
      const eventProperties = {
        ...properties,
        session_id: this.sessionId,
        timestamp: Date.now(),
      };

      await analytics().logEvent(eventName, eventProperties);
    } catch (error) {
      console.error(`Failed to log event ${eventName}:`, error);
    }
  }

  /**
   * Screen tracking
   */
  async logScreenView(screenName: string, screenClass?: string) {
    if (!this.isEnabled) return;

    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error(`Failed to log screen view ${screenName}:`, error);
    }
  }

  /**
   * User action events
   */
  async logUserAction(action: string, category: string, label?: string, value?: number) {
    await this.logEvent('user_action', {
      action,
      category,
      label,
      value,
    });
  }

  /**
   * Authentication events
   */
  async logLogin(method: string) {
    await analytics().logLogin({ method });
  }

  async logSignUp(method: string) {
    await analytics().logSignUp({ method });
  }

  async logLogout() {
    await this.logEvent('logout', {
      session_duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
    });
    this.sessionId = this.generateSessionId();
  }

  /**
   * Door access events
   */
  async logDoorAccess(doorId: string, method: 'qr' | 'nfc' | 'manual', success: boolean) {
    await this.logEvent('door_access', {
      door_id: doorId,
      method,
      success,
    });
  }

  async logAccessRequest(doorId: string, status: 'pending' | 'approved' | 'rejected') {
    await this.logEvent('access_request', {
      door_id: doorId,
      status,
    });
  }

  /**
   * Equipment events
   */
  async logEquipmentReservation(equipmentId: string, duration: number) {
    await this.logEvent('equipment_reservation', {
      equipment_id: equipmentId,
      duration,
    });
  }

  async logEquipmentCheckIn(equipmentId: string) {
    await this.logEvent('equipment_checkin', {
      equipment_id: equipmentId,
    });
  }

  async logEquipmentCheckOut(equipmentId: string) {
    await this.logEvent('equipment_checkout', {
      equipment_id: equipmentId,
    });
  }

  /**
   * Emergency events
   */
  async logEmergencyTriggered(type: string, location: string) {
    await this.logEvent('emergency_triggered', {
      emergency_type: type,
      location,
      priority: 'high',
    });
  }

  async logEmergencyResolved(emergencyId: string, duration: number) {
    await this.logEvent('emergency_resolved', {
      emergency_id: emergencyId,
      resolution_time: duration,
    });
  }

  /**
   * Performance events
   */
  async logPerformance(metric: string, value: number, metadata?: any) {
    await this.logEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      ...metadata,
    });
  }

  async logApiLatency(endpoint: string, latency: number, success: boolean) {
    await this.logEvent('api_latency', {
      endpoint,
      latency,
      success,
    });
  }

  /**
   * Error events
   */
  async logError(error: Error, context?: string) {
    await this.logEvent('app_error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }

  /**
   * Search events
   */
  async logSearch(searchTerm: string, resultsCount: number, searchType: string) {
    await analytics().logSearch({
      search_term: searchTerm,
      number_of_results: resultsCount,
      search_type: searchType,
    });
  }

  /**
   * Share events
   */
  async logShare(contentType: string, itemId: string, method: string) {
    await analytics().logShare({
      content_type: contentType,
      item_id: itemId,
      method,
    });
  }

  /**
   * Purchase/Subscription events
   */
  async logPurchase(value: number, currency: string, items: any[]) {
    await analytics().logPurchase({
      value,
      currency,
      items,
    });
  }

  async logSubscription(plan: string, price: number, duration: string) {
    await this.logEvent('subscription_started', {
      plan,
      price,
      duration,
    });
  }

  /**
   * App lifecycle events
   */
  async logAppOpen() {
    await analytics().logAppOpen();
  }

  async logAppBackground() {
    await this.logEvent('app_background', {
      session_duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
    });
  }

  async logAppForeground() {
    await this.logEvent('app_foreground');
  }

  /**
   * Custom conversion events
   */
  async logConversion(conversionType: string, value?: number) {
    await this.logEvent(`conversion_${conversionType}`, {
      conversion_value: value,
    });
  }

  /**
   * Enable/disable analytics
   */
  async setAnalyticsEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('@analytics_opt_out', enabled ? 'false' : 'true');
    await analytics().setAnalyticsCollectionEnabled(enabled);
  }

  /**
   * Reset analytics data
   */
  async resetAnalyticsData() {
    await analytics().resetAnalyticsData();
    this.sessionId = this.generateSessionId();
    this.userId = null;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

export default AnalyticsService.getInstance();
export { AnalyticsService };