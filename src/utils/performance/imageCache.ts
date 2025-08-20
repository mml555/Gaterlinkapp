/**
 * Image Cache Manager
 * Handles image caching, lazy loading, and optimization
 */

import { Image, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface CacheConfig {
  maxSize: number; // Max cache size in MB
  maxAge: number; // Max age in milliseconds
  quality: 'low' | 'normal' | 'high';
  enableWifiOnly: boolean;
}

interface CachedImage {
  uri: string;
  timestamp: number;
  size: number;
  etag?: string;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private config: CacheConfig;
  private cacheIndex: Map<string, CachedImage>;
  private totalCacheSize: number = 0;
  private isWifiConnected: boolean = false;

  private constructor() {
    this.config = {
      maxSize: 100, // 100MB default
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      quality: 'normal',
      enableWifiOnly: false,
    };
    this.cacheIndex = new Map();
    this.initialize();
  }

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  private async initialize() {
    // Load cache index from storage
    await this.loadCacheIndex();
    
    // Monitor network connectivity
    NetInfo.addEventListener(state => {
      this.isWifiConnected = state.type === 'wifi';
    });
    
    // Clean expired cache on init
    await this.cleanExpiredCache();
  }

  private async loadCacheIndex() {
    try {
      const indexData = await AsyncStorage.getItem('@image_cache_index');
      if (indexData) {
        const index = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(index));
        this.calculateTotalSize();
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
    }
  }

  private async saveCacheIndex() {
    try {
      const indexData = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem('@image_cache_index', JSON.stringify(indexData));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  private calculateTotalSize() {
    this.totalCacheSize = 0;
    this.cacheIndex.forEach(item => {
      this.totalCacheSize += item.size;
    });
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(urls: string[], priority: 'low' | 'normal' | 'high' = 'normal') {
    if (this.config.enableWifiOnly && !this.isWifiConnected) {
      console.log('Skipping preload - WiFi only mode enabled');
      return;
    }

    const preloadPriority = this.getPriority(priority);
    
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Use FastImage for better performance
        await FastImage.preload(
          urls.map(uri => ({
            uri,
            priority: preloadPriority,
            cache: FastImage.cacheControl.immutable,
          }))
        );
      } else {
        // Fallback for web
        await Promise.all(urls.map(url => Image.prefetch(url)));
      }
      
      // Update cache index
      urls.forEach(uri => {
        this.cacheIndex.set(uri, {
          uri,
          timestamp: Date.now(),
          size: this.estimateImageSize(priority),
        });
      });
      
      await this.saveCacheIndex();
    } catch (error) {
      console.error('Failed to preload images:', error);
    }
  }

  /**
   * Get optimized image URI based on network and device
   */
  getOptimizedUri(originalUri: string, options?: {
    width?: number;
    height?: number;
    quality?: 'low' | 'normal' | 'high';
  }): string {
    // Check if image is in cache
    const cached = this.cacheIndex.get(originalUri);
    if (cached && !this.isExpired(cached)) {
      return cached.uri;
    }

    // Apply optimizations based on network
    const networkState = this.isWifiConnected ? 'wifi' : 'cellular';
    const quality = options?.quality || this.config.quality;
    
    // Build optimized URL with query parameters
    const params = new URLSearchParams();
    
    if (options?.width) params.append('w', options.width.toString());
    if (options?.height) params.append('h', options.height.toString());
    
    // Adjust quality based on network
    if (networkState === 'cellular') {
      params.append('q', quality === 'high' ? '85' : quality === 'normal' ? '70' : '50');
    } else {
      params.append('q', quality === 'high' ? '95' : quality === 'normal' ? '85' : '70');
    }
    
    // Add format optimization
    params.append('fm', 'webp');
    params.append('auto', 'compress');
    
    const separator = originalUri.includes('?') ? '&' : '?';
    return `${originalUri}${separator}${params.toString()}`;
  }

  /**
   * Clear cache
   */
  async clearCache(options?: { 
    onlyExpired?: boolean; 
    olderThan?: number;
  }) {
    try {
      if (options?.onlyExpired) {
        await this.cleanExpiredCache();
      } else if (options?.olderThan) {
        await this.cleanOldCache(options.olderThan);
      } else {
        // Clear all
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await FastImage.clearDiskCache();
          await FastImage.clearMemoryCache();
        }
        this.cacheIndex.clear();
        this.totalCacheSize = 0;
        await AsyncStorage.removeItem('@image_cache_index');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Clean expired cache entries
   */
  private async cleanExpiredCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cacheIndex.forEach((item, key) => {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.cacheIndex.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      this.calculateTotalSize();
      await this.saveCacheIndex();
    }
  }

  /**
   * Clean cache older than specified time
   */
  private async cleanOldCache(olderThan: number) {
    const threshold = Date.now() - olderThan;
    const oldKeys: string[] = [];
    
    this.cacheIndex.forEach((item, key) => {
      if (item.timestamp < threshold) {
        oldKeys.push(key);
      }
    });
    
    oldKeys.forEach(key => {
      this.cacheIndex.delete(key);
    });
    
    if (oldKeys.length > 0) {
      this.calculateTotalSize();
      await this.saveCacheIndex();
    }
  }

  /**
   * Check if cache size limit is exceeded
   */
  private async enforceMaxSize() {
    if (this.totalCacheSize > this.config.maxSize * 1024 * 1024) {
      // Sort by timestamp and remove oldest
      const sorted = Array.from(this.cacheIndex.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      while (this.totalCacheSize > this.config.maxSize * 1024 * 1024 && sorted.length > 0) {
        const [key, item] = sorted.shift()!;
        this.cacheIndex.delete(key);
        this.totalCacheSize -= item.size;
      }
      
      await this.saveCacheIndex();
    }
  }

  /**
   * Check if cached item is expired
   */
  private isExpired(item: CachedImage): boolean {
    return Date.now() - item.timestamp > this.config.maxAge;
  }

  /**
   * Estimate image size based on quality
   */
  private estimateImageSize(quality: 'low' | 'normal' | 'high'): number {
    switch (quality) {
      case 'low': return 50 * 1024; // 50KB
      case 'normal': return 150 * 1024; // 150KB
      case 'high': return 300 * 1024; // 300KB
      default: return 150 * 1024;
    }
  }

  /**
   * Get FastImage priority
   */
  private getPriority(priority: 'low' | 'normal' | 'high') {
    switch (priority) {
      case 'low': return FastImage.priority.low;
      case 'high': return FastImage.priority.high;
      default: return FastImage.priority.normal;
    }
  }

  /**
   * Configure cache settings
   */
  configure(config: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalSize: this.totalCacheSize,
      itemCount: this.cacheIndex.size,
      maxSize: this.config.maxSize * 1024 * 1024,
      utilizationPercent: (this.totalCacheSize / (this.config.maxSize * 1024 * 1024)) * 100,
    };
  }
}

export default ImageCacheManager.getInstance();
export { ImageCacheManager, CacheConfig, CachedImage };