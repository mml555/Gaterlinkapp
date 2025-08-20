/**
 * Crashlytics Service
 * Crash reporting and error tracking with Firebase Crashlytics
 */

import crashlytics from '@react-native-firebase/crashlytics';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export interface CrashContext {
  screen?: string;
  action?: string;
  userId?: string;
  metadata?: { [key: string]: any };
}

export interface ErrorReport {
  error: Error;
  context?: CrashContext;
  fatal?: boolean;
  handled?: boolean;
}

class CrashlyticsService {
  private static instance: CrashlyticsService;
  private isEnabled: boolean = true;
  private breadcrumbs: string[] = [];
  private maxBreadcrumbs: number = 100;
  private userContext: CrashContext = {};

  private constructor() {
    this.initialize();
  }

  static getInstance(): CrashlyticsService {
    if (!CrashlyticsService.instance) {
      CrashlyticsService.instance = new CrashlyticsService();
    }
    return CrashlyticsService.instance;
  }

  private async initialize() {
    try {
      // Enable crash collection
      await crashlytics().setCrashlyticsCollectionEnabled(this.isEnabled);

      // Set default attributes
      await this.setDefaultAttributes();

      // Set up JS error handler
      this.setupErrorHandler();

      // Set up promise rejection handler
      this.setupPromiseRejectionHandler();
    } catch (error) {
      console.error('Failed to initialize Crashlytics:', error);
    }
  }

  private async setDefaultAttributes() {
    try {
      // Device information
      await crashlytics().setAttribute('platform', Platform.OS);
      await crashlytics().setAttribute('platform_version', Platform.Version.toString());
      await crashlytics().setAttribute('device_brand', await DeviceInfo.getBrand());
      await crashlytics().setAttribute('device_model', await DeviceInfo.getModel());
      await crashlytics().setAttribute('app_version', await DeviceInfo.getVersion());
      await crashlytics().setAttribute('build_number', await DeviceInfo.getBuildNumber());
      await crashlytics().setAttribute('is_tablet', String(DeviceInfo.isTablet()));
      
      // System information
      const totalMemory = await DeviceInfo.getTotalMemory();
      await crashlytics().setAttribute('total_memory', String(Math.round(totalMemory / 1024 / 1024)));
      
      const totalDiskSpace = await DeviceInfo.getTotalDiskCapacity();
      await crashlytics().setAttribute('total_disk_space', String(Math.round(totalDiskSpace / 1024 / 1024)));
    } catch (error) {
      console.error('Failed to set default Crashlytics attributes:', error);
    }
  }

  private setupErrorHandler() {
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Log to Crashlytics
      this.recordError(error, {
        context: {
          ...this.userContext,
          action: 'global_error_handler',
        },
        fatal: isFatal,
        handled: false,
      });

      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  private setupPromiseRejectionHandler() {
    const tracking = require('promise/setimmediate/rejection-tracking');
    
    tracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: Error) => {
        this.recordError(error, {
          context: {
            ...this.userContext,
            action: 'unhandled_promise_rejection',
            rejection_id: String(id),
          },
          fatal: false,
          handled: false,
        });
      },
      onHandled: (id: number) => {
        this.log(`Promise rejection handled: ${id}`);
      },
    });
  }

  /**
   * Set user identifier
   */
  async setUserId(userId: string | null) {
    try {
      if (userId) {
        await crashlytics().setUserId(userId);
        this.userContext.userId = userId;
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set custom attributes
   */
  async setAttribute(key: string, value: string | number | boolean) {
    try {
      await crashlytics().setAttribute(key, String(value));
    } catch (error) {
      console.error(`Failed to set attribute ${key}:`, error);
    }
  }

  async setAttributes(attributes: { [key: string]: string | number | boolean }) {
    try {
      await crashlytics().setAttributes(
        Object.entries(attributes).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as { [key: string]: string })
      );
    } catch (error) {
      console.error('Failed to set attributes:', error);
    }
  }

  /**
   * Log messages (breadcrumbs)
   */
  log(message: string) {
    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      
      crashlytics().log(logMessage);
      
      // Keep local breadcrumbs
      this.breadcrumbs.push(logMessage);
      if (this.breadcrumbs.length > this.maxBreadcrumbs) {
        this.breadcrumbs.shift();
      }
    } catch (error) {
      console.error('Failed to log to Crashlytics:', error);
    }
  }

  /**
   * Record error
   */
  recordError(error: Error | string, report?: Partial<ErrorReport>) {
    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      
      // Add context to error
      if (report?.context) {
        Object.entries(report.context).forEach(([key, value]) => {
          if (value !== undefined) {
            this.setAttribute(key, String(value));
          }
        });
      }

      // Log breadcrumbs
      if (this.breadcrumbs.length > 0) {
        crashlytics().log('=== Breadcrumbs ===');
        this.breadcrumbs.slice(-20).forEach(breadcrumb => {
          crashlytics().log(breadcrumb);
        });
      }

      // Record the error
      crashlytics().recordError(errorObj);

      // Force upload if fatal
      if (report?.fatal) {
        this.crash(errorObj.message);
      }
    } catch (recordError) {
      console.error('Failed to record error:', recordError);
    }
  }

  /**
   * Record non-fatal error with context
   */
  recordNonFatalError(error: Error, screen?: string, action?: string, metadata?: any) {
    this.recordError(error, {
      context: {
        screen,
        action,
        ...metadata,
      },
      fatal: false,
      handled: true,
    });
  }

  /**
   * Force a crash (for testing)
   */
  crash(message?: string) {
    crashlytics().crash();
  }

  /**
   * Check if Crashlytics is enabled
   */
  async checkIfEnabled(): Promise<boolean> {
    return crashlytics().isCrashlyticsCollectionEnabled();
  }

  /**
   * Enable/disable Crashlytics
   */
  async setCrashlyticsEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
  }

  /**
   * Set current screen
   */
  setCurrentScreen(screenName: string) {
    this.userContext.screen = screenName;
    this.setAttribute('current_screen', screenName);
    this.log(`Screen: ${screenName}`);
  }

  /**
   * Log user action
   */
  logAction(action: string, details?: any) {
    const logEntry = details 
      ? `Action: ${action} - ${JSON.stringify(details)}`
      : `Action: ${action}`;
    this.log(logEntry);
  }

  /**
   * Log API error
   */
  logApiError(endpoint: string, error: any, requestData?: any) {
    this.recordError(error, {
      context: {
        api_endpoint: endpoint,
        request_data: requestData ? JSON.stringify(requestData) : undefined,
      },
      fatal: false,
      handled: true,
    });
  }

  /**
   * Log network error
   */
  logNetworkError(url: string, error: any, method?: string) {
    this.recordError(error, {
      context: {
        network_url: url,
        network_method: method || 'GET',
        network_error: error.message,
      },
      fatal: false,
      handled: true,
    });
  }

  /**
   * Log performance issue
   */
  logPerformanceIssue(metric: string, value: number, threshold: number) {
    if (value > threshold) {
      this.log(`Performance issue: ${metric} = ${value}ms (threshold: ${threshold}ms)`);
      this.recordNonFatalError(
        new Error(`Performance threshold exceeded: ${metric}`),
        undefined,
        'performance_issue',
        { metric, value, threshold }
      );
    }
  }

  /**
   * Send unsent reports
   */
  async sendUnsentReports() {
    try {
      await crashlytics().sendUnsentReports();
    } catch (error) {
      console.error('Failed to send unsent reports:', error);
    }
  }

  /**
   * Delete unsent reports
   */
  async deleteUnsentReports() {
    try {
      await crashlytics().deleteUnsentReports();
    } catch (error) {
      console.error('Failed to delete unsent reports:', error);
    }
  }

  /**
   * Check for unsent reports
   */
  async checkForUnsentReports(): Promise<boolean> {
    try {
      return await crashlytics().checkForUnsentReports();
    } catch (error) {
      console.error('Failed to check for unsent reports:', error);
      return false;
    }
  }

  /**
   * Get breadcrumbs
   */
  getBreadcrumbs(): string[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
}

export default CrashlyticsService.getInstance();
export { CrashlyticsService };