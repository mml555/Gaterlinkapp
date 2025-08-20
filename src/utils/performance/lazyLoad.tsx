/**
 * Lazy Loading Components and Utilities
 * Implements code splitting and lazy loading for better performance
 */

import React, { Suspense, lazy, ComponentType, ReactNode, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { useIntersectionObserver } from './useIntersectionObserver';

interface LazyComponentProps {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  style?: ViewStyle;
}

/**
 * Error Boundary for lazy loaded components
 */
class LazyErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load component</Text>
            <Text style={styles.errorDetail}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Default loading component
 */
const DefaultLoadingComponent = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

/**
 * Lazy load a component with error boundary and loading state
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: LazyComponentProps
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
      // Add delay if specified
      if (options?.delay) {
        const timer = setTimeout(() => setShouldLoad(true), options.delay);
        return () => clearTimeout(timer);
      } else {
        setShouldLoad(true);
      }
    }, []);

    if (!shouldLoad) {
      return options?.fallback || <DefaultLoadingComponent />;
    }

    return (
      <LazyErrorBoundary fallback={options?.errorFallback}>
        <Suspense fallback={options?.fallback || <DefaultLoadingComponent />}>
          <View style={[styles.lazyContainer, options?.style]}>
            <LazyComponent {...props} />
          </View>
        </Suspense>
      </LazyErrorBoundary>
    );
  };
}

/**
 * Viewport-based lazy loading component
 */
export const LazyLoad: React.FC<{
  children: ReactNode;
  height?: number;
  offset?: number;
  placeholder?: ReactNode;
  once?: boolean;
  style?: ViewStyle;
}> = ({ 
  children, 
  height = 200, 
  offset = 100, 
  placeholder, 
  once = true,
  style 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (isVisible && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [isVisible, hasBeenVisible]);

  const shouldRender = once ? hasBeenVisible : isVisible;

  if (!shouldRender) {
    return (
      <View style={[{ minHeight: height }, style]}>
        {placeholder || <DefaultLoadingComponent />}
      </View>
    );
  }

  return <View style={style}>{children}</View>;
};

/**
 * Create lazy loaded routes for React Navigation
 */
export function createLazyScreen(
  screenName: string,
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  options?: {
    fallback?: ReactNode;
    preload?: boolean;
  }
) {
  const LazyScreen = lazy(importFunc);

  // Optionally preload the screen
  if (options?.preload) {
    importFunc();
  }

  return {
    name: screenName,
    component: (props: any) => (
      <LazyErrorBoundary>
        <Suspense fallback={options?.fallback || <DefaultLoadingComponent />}>
          <LazyScreen {...props} />
        </Suspense>
      </LazyErrorBoundary>
    ),
  };
}

/**
 * Batch lazy loader for multiple components
 */
export class LazyBatchLoader {
  private queue: Array<() => Promise<any>> = [];
  private isLoading = false;
  private batchSize: number;
  private delay: number;

  constructor(batchSize = 3, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(importFunc: () => Promise<any>) {
    this.queue.push(importFunc);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isLoading || this.queue.length === 0) return;

    this.isLoading = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await Promise.all(batch.map(func => func()));
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
        this.isLoading = false;
        this.processQueue();
      } else {
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Batch loading error:', error);
      this.isLoading = false;
    }
  }

  clear() {
    this.queue = [];
    this.isLoading = false;
  }
}

/**
 * Preload components based on user navigation patterns
 */
export class PredictivePreloader {
  private navigationHistory: string[] = [];
  private preloadMap: Map<string, Set<string>> = new Map();
  private maxHistorySize = 10;

  recordNavigation(fromScreen: string, toScreen: string) {
    this.navigationHistory.push(`${fromScreen}->${toScreen}`);
    
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.shift();
    }

    // Update preload map
    if (!this.preloadMap.has(fromScreen)) {
      this.preloadMap.set(fromScreen, new Set());
    }
    this.preloadMap.get(fromScreen)?.add(toScreen);
  }

  getPredictedScreens(currentScreen: string): string[] {
    const predictions = this.preloadMap.get(currentScreen);
    return predictions ? Array.from(predictions) : [];
  }

  async preloadPredicted(
    currentScreen: string,
    screenLoaders: Map<string, () => Promise<any>>
  ) {
    const predicted = this.getPredictedScreens(currentScreen);
    const loader = new LazyBatchLoader(2, 200);

    predicted.forEach(screen => {
      const loaderFunc = screenLoaders.get(screen);
      if (loaderFunc) {
        loader.add(loaderFunc);
      }
    });
  }
}

/**
 * React hook for lazy loading with intersection observer
 */
export function useLazyLoad(options?: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, ref] = useIntersectionObserver({
    threshold: options?.threshold || 0.1,
    rootMargin: options?.rootMargin || '50px',
    triggerOnce: options?.triggerOnce !== false,
  });

  useEffect(() => {
    if (isInView && !isLoaded) {
      setIsLoaded(true);
    }
  }, [isInView, isLoaded]);

  return { isLoaded, ref };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  lazyContainer: {
    flex: 1,
  },
});

export default {
  lazyLoadComponent,
  LazyLoad,
  createLazyScreen,
  LazyBatchLoader,
  PredictivePreloader,
  useLazyLoad,
};