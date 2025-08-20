/**
 * Bundle Optimization Utilities
 * Handles code splitting, dynamic imports, and bundle size optimization
 */

import { Platform } from 'react-native';

/**
 * Dynamic import with retry logic
 */
export async function dynamicImport<T>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const module = await importFunc();
      return module.default;
    } catch (error) {
      console.warn(`Dynamic import failed (attempt ${i + 1}/${retries}):`, error);
      
      if (i === retries - 1) {
        throw new Error(`Failed to load module after ${retries} attempts`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw new Error('Dynamic import failed');
}

/**
 * Conditional module loading based on platform
 */
export function platformSpecificImport<T>(modules: {
  ios?: () => Promise<{ default: T }>;
  android?: () => Promise<{ default: T }>;
  web?: () => Promise<{ default: T }>;
  default: () => Promise<{ default: T }>;
}): Promise<T> {
  const platform = Platform.OS;
  const importFunc = modules[platform as keyof typeof modules] || modules.default;
  
  return dynamicImport(importFunc);
}

/**
 * Feature flag based module loading
 */
interface FeatureFlags {
  [key: string]: boolean;
}

export class FeatureModuleLoader {
  private static featureFlags: FeatureFlags = {};
  private static loadedModules: Map<string, any> = new Map();

  static setFeatureFlags(flags: FeatureFlags) {
    this.featureFlags = { ...this.featureFlags, ...flags };
  }

  static async loadFeature<T>(
    featureName: string,
    importFunc: () => Promise<{ default: T }>
  ): Promise<T | null> {
    // Check if feature is enabled
    if (!this.featureFlags[featureName]) {
      console.log(`Feature ${featureName} is disabled`);
      return null;
    }

    // Check if already loaded
    if (this.loadedModules.has(featureName)) {
      return this.loadedModules.get(featureName);
    }

    try {
      const module = await dynamicImport(importFunc);
      this.loadedModules.set(featureName, module);
      return module;
    } catch (error) {
      console.error(`Failed to load feature ${featureName}:`, error);
      return null;
    }
  }

  static isFeatureEnabled(featureName: string): boolean {
    return this.featureFlags[featureName] || false;
  }

  static clearCache() {
    this.loadedModules.clear();
  }
}

/**
 * Route-based code splitting configuration
 */
export interface RouteConfig {
  name: string;
  component: () => Promise<any>;
  preload?: boolean;
  prefetch?: boolean;
  chunkName?: string;
}

export class RouteOptimizer {
  private static routes: Map<string, RouteConfig> = new Map();
  private static preloadedRoutes: Set<string> = new Set();

  static registerRoute(config: RouteConfig) {
    this.routes.set(config.name, config);
    
    if (config.preload) {
      this.preloadRoute(config.name);
    }
  }

  static async preloadRoute(routeName: string) {
    if (this.preloadedRoutes.has(routeName)) {
      return;
    }

    const route = this.routes.get(routeName);
    if (!route) {
      console.warn(`Route ${routeName} not found`);
      return;
    }

    try {
      await route.component();
      this.preloadedRoutes.add(routeName);
      console.log(`Preloaded route: ${routeName}`);
    } catch (error) {
      console.error(`Failed to preload route ${routeName}:`, error);
    }
  }

  static async prefetchRoutes(routeNames: string[]) {
    const prefetchPromises = routeNames
      .filter(name => !this.preloadedRoutes.has(name))
      .map(name => this.preloadRoute(name));
    
    await Promise.allSettled(prefetchPromises);
  }

  static getRoute(routeName: string): RouteConfig | undefined {
    return this.routes.get(routeName);
  }

  static isRoutePreloaded(routeName: string): boolean {
    return this.preloadedRoutes.has(routeName);
  }
}

/**
 * Bundle size analyzer
 */
export class BundleSizeAnalyzer {
  private static measurements: Map<string, number> = new Map();

  static startMeasurement(label: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
    this.measurements.set(`${label}-start`, Date.now());
  }

  static endMeasurement(label: string): number {
    const startTime = this.measurements.get(`${label}-start`);
    if (!startTime) {
      console.warn(`No start measurement found for ${label}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
    
    this.measurements.delete(`${label}-start`);
    console.log(`${label}: ${duration}ms`);
    
    return duration;
  }

  static getPerformanceReport(): any {
    if (typeof performance === 'undefined') {
      return null;
    }

    const entries = performance.getEntriesByType('measure');
    const report = {
      measurements: entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
      })),
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };

    return report;
  }

  static clearMeasurements() {
    this.measurements.clear();
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/**
 * Tree shaking helper - marks code for removal in production
 */
export function treeShakable<T>(
  condition: boolean,
  module: T,
  fallback?: T
): T | undefined {
  if (__DEV__) {
    return module;
  }
  return condition ? module : fallback;
}

/**
 * Dead code elimination helper
 */
export function eliminateInProduction<T>(
  devOnlyCode: () => T,
  productionCode?: () => T
): T | undefined {
  if (__DEV__) {
    return devOnlyCode();
  }
  return productionCode?.();
}

/**
 * Optimize heavy computations with memoization
 */
export class ComputationOptimizer {
  private static cache: Map<string, { value: any; timestamp: number }> = new Map();
  private static maxCacheSize = 100;
  private static maxCacheAge = 5 * 60 * 1000; // 5 minutes

  static memoize<T>(
    key: string,
    computation: () => T,
    maxAge?: number
  ): T {
    const cached = this.cache.get(key);
    const age = maxAge || this.maxCacheAge;

    if (cached && Date.now() - cached.timestamp < age) {
      return cached.value;
    }

    const result = computation();
    this.cache.set(key, { value: result, timestamp: Date.now() });

    // Enforce cache size limit
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return result;
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export default {
  dynamicImport,
  platformSpecificImport,
  FeatureModuleLoader,
  RouteOptimizer,
  BundleSizeAnalyzer,
  treeShakable,
  eliminateInProduction,
  ComputationOptimizer,
};