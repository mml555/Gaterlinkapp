/**
 * Intersection Observer Hook for React Native Web
 * Falls back to scroll-based detection for native platforms
 */

import { useEffect, useRef, useState, MutableRefObject } from 'react';
import { Platform, Dimensions, ScrollView } from 'react-native';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

/**
 * Custom hook for intersection observer functionality
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): [boolean, MutableRefObject<any>] {
  const {
    threshold = 0,
    rootMargin = '0px',
    triggerOnce = false,
    skip = false,
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (skip || (triggerOnce && hasBeenInView)) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Web implementation using Intersection Observer
    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          
          if (inView && !hasBeenInView) {
            setHasBeenInView(true);
            if (triggerOnce) {
              observer.disconnect();
            }
          }
        },
        {
          threshold,
          rootMargin,
        }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    } 
    // Native implementation using scroll detection
    else {
      // For native platforms, use a simpler visibility check
      // This is a simplified implementation - in production you might want
      // to use a library like react-native-super-grid or react-native-visibility-sensor
      
      const checkVisibility = () => {
        if (!element || !element.measure) return;

        element.measure(
          (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const windowHeight = Dimensions.get('window').height;
            const windowWidth = Dimensions.get('window').width;

            const isVisible = 
              pageY < windowHeight &&
              pageY + height > 0 &&
              pageX < windowWidth &&
              pageX + width > 0;

            if (isVisible !== isInView) {
              setIsInView(isVisible);
              
              if (isVisible && !hasBeenInView) {
                setHasBeenInView(true);
              }
            }
          }
        );
      };

      // Check visibility on mount and scroll
      const interval = setInterval(checkVisibility, 100);
      checkVisibility();

      return () => {
        clearInterval(interval);
      };
    }
  }, [threshold, rootMargin, triggerOnce, skip, hasBeenInView, isInView]);

  return [triggerOnce ? hasBeenInView : isInView, ref];
}

/**
 * Hook for viewport-based lazy loading
 */
export function useViewportLazyLoad(
  offset: number = 100
): {
  isNearViewport: boolean;
  ref: MutableRefObject<any>;
} {
  const [isNearViewport, ref] = useIntersectionObserver({
    rootMargin: `${offset}px`,
    triggerOnce: true,
  });

  return { isNearViewport, ref };
}

/**
 * Hook for infinite scroll detection
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options?: {
    threshold?: number;
    hasMore?: boolean;
    isLoading?: boolean;
  }
): MutableRefObject<any> {
  const { threshold = 0.9, hasMore = true, isLoading = false } = options || {};
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const element = sentinelRef.current;
    if (!element) return;

    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            onLoadMore();
          }
        },
        { threshold }
      );

      observer.observe(element);
      return () => observer.disconnect();
    } else {
      // Native fallback - simplified version
      const checkScroll = () => {
        if (!element || !element.measure) return;

        element.measure(
          (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const windowHeight = Dimensions.get('window').height;
            const triggerPoint = windowHeight * threshold;

            if (pageY < triggerPoint && hasMore && !isLoading) {
              onLoadMore();
            }
          }
        );
      };

      const interval = setInterval(checkScroll, 200);
      return () => clearInterval(interval);
    }
  }, [onLoadMore, threshold, hasMore, isLoading]);

  return sentinelRef;
}

/**
 * Hook for element visibility tracking
 */
export function useVisibilityTracking(
  onVisible?: () => void,
  onHidden?: () => void,
  options?: IntersectionObserverOptions
): [boolean, MutableRefObject<any>] {
  const [isVisible, ref] = useIntersectionObserver(options);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (isVisible && !wasVisible.current) {
      onVisible?.();
      wasVisible.current = true;
    } else if (!isVisible && wasVisible.current) {
      onHidden?.();
      wasVisible.current = false;
    }
  }, [isVisible, onVisible, onHidden]);

  return [isVisible, ref];
}

export default {
  useIntersectionObserver,
  useViewportLazyLoad,
  useInfiniteScroll,
  useVisibilityTracking,
};