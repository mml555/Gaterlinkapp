/**
 * Performance Monitoring Service
 * App performance tracking with Firebase Performance
 */

import perf, { FirebasePerformanceTypes } from '@react-native-firebase/perf';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface PerformanceMetrics {
  appStartTime: number;
  screenLoadTime: number;
  apiResponseTime: number;
  jsFrameRate: number;
  nativeFrameRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface NetworkMetrics {
  url: string;
  httpMethod: string;
  requestPayloadSize?: number;
  responsePayloadSize?: number;
  httpResponseCode?: number;
  startTime: number;
  duration: number;
}

class PerformanceService {
  private static instance: PerformanceService;
  private traces: Map<string, FirebasePerformanceTypes.Trace> = new Map();
  private httpMetrics: Map<string, FirebasePerformanceTypes.HttpMetric> = new Map();
  private isEnabled: boolean = true;
  private appStartTime: number;
  private screenTransitions: Map<string, number> = new Map();
  private frameDropThreshold: number = 16; // 60fps = ~16ms per frame
  private performanceObserver: any;

  private constructor() {
    this.appStartTime = Date.now();
    this.initialize();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private async initialize() {
    try {
      // Enable performance monitoring
      await perf().setPerformanceCollectionEnabled(this.isEnabled);

      // Monitor app state changes
      this.setupAppStateMonitoring();

      // Monitor network state
      this.setupNetworkMonitoring();

      // Start app initialization trace
      await this.startTrace('app_initialization');
    } catch (error) {
      console.error('Failed to initialize Performance Monitoring:', error);
    }
  }

  private setupAppStateMonitoring() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.startTrace('app_foreground');
      } else if (nextAppState === 'background') {
        this.stopTrace('app_foreground');
        this.startTrace('app_background');
      }
    });
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      this.setAttribute('network_type', state.type);
      this.setAttribute('network_connected', String(state.isConnected));
      
      if (state.details) {
        const details = state.details as any;
        if (details.cellularGeneration) {
          this.setAttribute('cellular_generation', details.cellularGeneration);
        }
      }
    });
  }

  /**
   * Start a custom trace
   */
  async startTrace(traceName: string): Promise<void> {
    try {
      if (this.traces.has(traceName)) {
        console.warn(`Trace ${traceName} already started`);
        return;
      }

      const trace = await perf().startTrace(traceName);
      this.traces.set(traceName, trace);
    } catch (error) {
      console.error(`Failed to start trace ${traceName}:`, error);
    }
  }

  /**
   * Stop a custom trace
   */
  async stopTrace(traceName: string, metrics?: { [key: string]: number }): Promise<void> {
    try {
      const trace = this.traces.get(traceName);
      if (!trace) {
        console.warn(`Trace ${traceName} not found`);
        return;
      }

      // Add custom metrics if provided
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          trace.putMetric(key, value);
        });
      }

      await trace.stop();
      this.traces.delete(traceName);
    } catch (error) {
      console.error(`Failed to stop trace ${traceName}:`, error);
    }
  }

  /**
   * Add attribute to a trace
   */
  async putAttribute(traceName: string, attribute: string, value: string): Promise<void> {
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.putAttribute(attribute, value);
      }
    } catch (error) {
      console.error(`Failed to add attribute to trace ${traceName}:`, error);
    }
  }

  /**
   * Add metric to a trace
   */
  async putMetric(traceName: string, metricName: string, value: number): Promise<void> {
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.putMetric(metricName, value);
      }
    } catch (error) {
      console.error(`Failed to add metric to trace ${traceName}:`, error);
    }
  }

  /**
   * Increment a metric
   */
  async incrementMetric(traceName: string, metricName: string, incrementBy: number = 1): Promise<void> {
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.incrementMetric(metricName, incrementBy);
      }
    } catch (error) {
      console.error(`Failed to increment metric in trace ${traceName}:`, error);
    }
  }

  /**
   * Track HTTP/HTTPS network requests
   */
  async startHttpMetric(url: string, httpMethod: FirebasePerformanceTypes.HttpMethod): Promise<string> {
    try {
      const metricId = `${httpMethod}_${Date.now()}`;
      const metric = await perf().newHttpMetric(url, httpMethod);
      
      this.httpMetrics.set(metricId, metric);
      await metric.start();
      
      return metricId;
    } catch (error) {
      console.error('Failed to start HTTP metric:', error);
      return '';
    }
  }

  /**
   * Stop HTTP metric
   */
  async stopHttpMetric(
    metricId: string,
    responseCode?: number,
    requestPayloadSize?: number,
    responsePayloadSize?: number,
    responseContentType?: string
  ): Promise<void> {
    try {
      const metric = this.httpMetrics.get(metricId);
      if (!metric) {
        console.warn(`HTTP metric ${metricId} not found`);
        return;
      }

      if (responseCode) {
        metric.setHttpResponseCode(responseCode);
      }
      if (requestPayloadSize) {
        metric.setRequestPayloadSize(requestPayloadSize);
      }
      if (responsePayloadSize) {
        metric.setResponsePayloadSize(responsePayloadSize);
      }
      if (responseContentType) {
        metric.setResponseContentType(responseContentType);
      }

      await metric.stop();
      this.httpMetrics.delete(metricId);
    } catch (error) {
      console.error(`Failed to stop HTTP metric ${metricId}:`, error);
    }
  }

  /**
   * Track screen rendering performance
   */
  async trackScreenLoad(screenName: string, startTime?: number): Promise<void> {
    const loadTime = startTime ? Date.now() - startTime : 0;
    
    try {
      const trace = await perf().startTrace(`screen_load_${screenName}`);
      trace.putMetric('load_time', loadTime);
      trace.putAttribute('screen_name', screenName);
      await trace.stop();
      
      this.screenTransitions.set(screenName, Date.now());
    } catch (error) {
      console.error(`Failed to track screen load for ${screenName}:`, error);
    }
  }

  /**
   * Track custom timing
   */
  async trackTiming(category: string, variable: string, value: number, label?: string): Promise<void> {
    try {
      const trace = await perf().startTrace(`timing_${category}_${variable}`);
      trace.putMetric('timing_value', value);
      trace.putAttribute('category', category);
      trace.putAttribute('variable', variable);
      if (label) {
        trace.putAttribute('label', label);
      }
      await trace.stop();
    } catch (error) {
      console.error('Failed to track timing:', error);
    }
  }

  /**
   * Track app startup time
   */
  async trackAppStartup(): Promise<void> {
    const startupTime = Date.now() - this.appStartTime;
    
    try {
      await this.stopTrace('app_initialization', {
        startup_time: startupTime,
      });
      
      // Track cold start vs warm start
      const trace = await perf().startTrace('app_startup');
      trace.putMetric('startup_duration', startupTime);
      trace.putAttribute('startup_type', this.appStartTime < 5000 ? 'cold' : 'warm');
      await trace.stop();
    } catch (error) {
      console.error('Failed to track app startup:', error);
    }
  }

  /**
   * Track JavaScript execution time
   */
  async trackJSExecution(functionName: string, executionTime: number): Promise<void> {
    if (executionTime > 16) { // Log if takes more than one frame
      try {
        const trace = await perf().startTrace(`js_execution_${functionName}`);
        trace.putMetric('execution_time', executionTime);
        trace.putAttribute('function_name', functionName);
        trace.putAttribute('is_slow', executionTime > 100 ? 'true' : 'false');
        await trace.stop();
      } catch (error) {
        console.error('Failed to track JS execution:', error);
      }
    }
  }

  /**
   * Track memory usage
   */
  async trackMemoryUsage(): Promise<void> {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      
      try {
        const trace = await perf().startTrace('memory_usage');
        trace.putMetric('used_js_heap_size', Math.round(memory.usedJSHeapSize / 1024 / 1024));
        trace.putMetric('total_js_heap_size', Math.round(memory.totalJSHeapSize / 1024 / 1024));
        trace.putMetric('js_heap_size_limit', Math.round(memory.jsHeapSizeLimit / 1024 / 1024));
        await trace.stop();
      } catch (error) {
        console.error('Failed to track memory usage:', error);
      }
    }
  }

  /**
   * Track frame drops
   */
  async trackFrameDrops(droppedFrames: number, totalFrames: number): Promise<void> {
    const dropRate = (droppedFrames / totalFrames) * 100;
    
    if (dropRate > 5) { // Log if more than 5% frames dropped
      try {
        const trace = await perf().startTrace('frame_drops');
        trace.putMetric('dropped_frames', droppedFrames);
        trace.putMetric('total_frames', totalFrames);
        trace.putMetric('drop_rate', Math.round(dropRate));
        await trace.stop();
      } catch (error) {
        console.error('Failed to track frame drops:', error);
      }
    }
  }

  /**
   * Track database operations
   */
  async trackDatabaseOperation(
    operation: string,
    collection: string,
    duration: number,
    documentCount?: number
  ): Promise<void> {
    try {
      const trace = await perf().startTrace(`db_${operation}_${collection}`);
      trace.putMetric('duration', duration);
      if (documentCount !== undefined) {
        trace.putMetric('document_count', documentCount);
      }
      trace.putAttribute('operation', operation);
      trace.putAttribute('collection', collection);
      await trace.stop();
    } catch (error) {
      console.error('Failed to track database operation:', error);
    }
  }

  /**
   * Track cache performance
   */
  async trackCachePerformance(
    operation: 'hit' | 'miss' | 'write',
    cacheType: string,
    duration?: number
  ): Promise<void> {
    try {
      const trace = await perf().startTrace(`cache_${operation}_${cacheType}`);
      if (duration) {
        trace.putMetric('duration', duration);
      }
      trace.putAttribute('cache_type', cacheType);
      trace.putAttribute('operation', operation);
      await trace.stop();
    } catch (error) {
      console.error('Failed to track cache performance:', error);
    }
  }

  /**
   * Set global attribute
   */
  async setAttribute(attribute: string, value: string): Promise<void> {
    // This would be applied to all future traces
    // Store in a local map for now
  }

  /**
   * Enable/disable performance monitoring
   */
  async setPerformanceEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    await perf().setPerformanceCollectionEnabled(enabled);
  }

  /**
   * Check if performance monitoring is enabled
   */
  async isPerformanceEnabled(): Promise<boolean> {
    return perf().isPerformanceCollectionEnabled();
  }

  /**
   * Get all active traces
   */
  getActiveTraces(): string[] {
    return Array.from(this.traces.keys());
  }

  /**
   * Clear all traces
   */
  async clearAllTraces(): Promise<void> {
    for (const [traceName, trace] of this.traces) {
      try {
        await trace.stop();
      } catch (error) {
        console.error(`Failed to stop trace ${traceName}:`, error);
      }
    }
    this.traces.clear();
  }
}

export default PerformanceService.getInstance();
export { PerformanceService };