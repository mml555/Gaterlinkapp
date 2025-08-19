import { PerformanceObserver } from 'react-native-performance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import LoggingService from './logging.service';
import { STORAGE_KEYS } from '../constants';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  type: 'navigation' | 'api' | 'render' | 'custom';
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  deviceInfo: {
    model: string;
    os: string;
    version: string;
    totalMemory: number;
    freeMemory: number;
  };
  timestamp: Date;
}

interface PerformanceThresholds {
  navigation: number; // ms
  apiCall: number; // ms
  renderTime: number; // ms
  memoryUsage: number; // percentage
  batteryDrain: number; // percentage per hour
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private navigationStartTime: Map<string, number> = new Map();
  private apiCallStartTime: Map<string, number> = new Map();
  
  private thresholds: PerformanceThresholds = {
    navigation: 1000, // 1 second
    apiCall: 3000, // 3 seconds
    renderTime: 16, // 60 FPS
    memoryUsage: 80, // 80%
    batteryDrain: 10, // 10% per hour
  };

  constructor() {
    this.initializePerformanceObserver();
  }

  /**
   * Initialize performance observer
   */
  private initializePerformanceObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: new Date(),
            type: 'render',
            metadata: {
              startTime: entry.startTime,
              entryType: entry.entryType,
            },
          });
        });
      });

      this.observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      LoggingService.error('Failed to initialize performance observer', 'Performance', error as Error);
    }
  }

  /**
   * Start navigation timing
   */
  startNavigation(screenName: string): void {
    this.navigationStartTime.set(screenName, Date.now());
    LoggingService.debug(`Navigation started: ${screenName}`, 'Performance');
  }

  /**
   * End navigation timing
   */
  endNavigation(screenName: string): void {
    const startTime = this.navigationStartTime.get(screenName);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.navigationStartTime.delete(screenName);

    this.recordMetric({
      name: `navigation_${screenName}`,
      value: duration,
      timestamp: new Date(),
      type: 'navigation',
      metadata: { screenName },
    });

    if (duration > this.thresholds.navigation) {
      LoggingService.warn(
        `Slow navigation detected: ${screenName} took ${duration}ms`,
        'Performance'
      );
    }
  }

  /**
   * Start API call timing
   */
  startApiCall(endpoint: string): string {
    const id = `${endpoint}_${Date.now()}`;
    this.apiCallStartTime.set(id, Date.now());
    return id;
  }

  /**
   * End API call timing
   */
  endApiCall(id: string, success: boolean = true): void {
    const startTime = this.apiCallStartTime.get(id);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.apiCallStartTime.delete(id);

    const [endpoint] = id.split('_');
    
    this.recordMetric({
      name: `api_${endpoint}`,
      value: duration,
      timestamp: new Date(),
      type: 'api',
      metadata: { endpoint, success },
    });

    if (duration > this.thresholds.apiCall) {
      LoggingService.warn(
        `Slow API call detected: ${endpoint} took ${duration}ms`,
        'Performance'
      );
    }
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      type: 'custom',
      metadata,
    });
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant metrics
    if (metric.value > this.getThresholdForType(metric.type)) {
      LoggingService.info(`Performance metric recorded`, 'Performance', metric);
    }
  }

  /**
   * Get threshold for metric type
   */
  private getThresholdForType(type: string): number {
    switch (type) {
      case 'navigation':
        return this.thresholds.navigation;
      case 'api':
        return this.thresholds.apiCall;
      case 'render':
        return this.thresholds.renderTime;
      default:
        return Number.MAX_VALUE;
    }
  }

  /**
   * Get memory usage
   */
  async getMemoryUsage(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const usedMemory = totalMemory - (await DeviceInfo.getFreeDiskStorage());
      const percentage = (usedMemory / totalMemory) * 100;

      if (percentage > this.thresholds.memoryUsage) {
        LoggingService.warn(
          `High memory usage detected: ${percentage.toFixed(1)}%`,
          'Performance'
        );
      }

      return {
        used: usedMemory,
        total: totalMemory,
        percentage,
      };
    } catch (error) {
      LoggingService.error('Failed to get memory usage', 'Performance', error as Error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Get battery level and charging status
   */
  async getBatteryStatus(): Promise<{
    level: number;
    isCharging: boolean;
  }> {
    try {
      const level = await DeviceInfo.getBatteryLevel();
      const isCharging = await DeviceInfo.isBatteryCharging();
      
      return {
        level: level * 100,
        isCharging,
      };
    } catch (error) {
      LoggingService.error('Failed to get battery status', 'Performance', error as Error);
      return { level: 100, isCharging: false };
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const deviceInfo = {
      model: DeviceInfo.getModel(),
      os: DeviceInfo.getSystemName(),
      version: DeviceInfo.getSystemVersion(),
      totalMemory: await DeviceInfo.getTotalMemory(),
      freeMemory: await DeviceInfo.getFreeDiskStorage(),
    };

    const report: PerformanceReport = {
      metrics: [...this.metrics],
      deviceInfo,
      timestamp: new Date(),
    };

    // Save report
    await this.saveReport(report);

    return report;
  }

  /**
   * Save performance report
   */
  private async saveReport(report: PerformanceReport): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      reports.push(report);
      
      // Keep only last 10 reports
      const recentReports = reports.slice(-10);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.PERFORMANCE_REPORTS,
        JSON.stringify(recentReports)
      );
    } catch (error) {
      LoggingService.error('Failed to save performance report', 'Performance', error as Error);
    }
  }

  /**
   * Get stored performance reports
   */
  async getStoredReports(): Promise<PerformanceReport[]> {
    try {
      const reportsStr = await AsyncStorage.getItem(STORAGE_KEYS.PERFORMANCE_REPORTS);
      return reportsStr ? JSON.parse(reportsStr) : [];
    } catch (error) {
      LoggingService.error('Failed to get stored reports', 'Performance', error as Error);
      return [];
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageNavigationTime: number;
    averageApiTime: number;
    slowestScreens: Array<{ name: string; time: number }>;
    slowestAPIs: Array<{ name: string; time: number }>;
  } {
    const navigationMetrics = this.metrics.filter(m => m.type === 'navigation');
    const apiMetrics = this.metrics.filter(m => m.type === 'api');

    const avgNavTime = navigationMetrics.length > 0
      ? navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length
      : 0;

    const avgApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const slowestScreens = navigationMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => ({
        name: m.metadata?.screenName || m.name,
        time: m.value,
      }));

    const slowestAPIs = apiMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => ({
        name: m.metadata?.endpoint || m.name,
        time: m.value,
      }));

    return {
      averageNavigationTime: avgNavTime,
      averageApiTime: avgApiTime,
      slowestScreens,
      slowestAPIs,
    };
  }

  /**
   * Clear performance data
   */
  async clearPerformanceData(): Promise<void> {
    this.metrics = [];
    this.navigationStartTime.clear();
    this.apiCallStartTime.clear();
    await AsyncStorage.removeItem(STORAGE_KEYS.PERFORMANCE_REPORTS);
    LoggingService.info('Performance data cleared', 'Performance');
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(updates: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...updates };
    LoggingService.info('Performance thresholds updated', 'Performance', updates);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}

export default new PerformanceService();