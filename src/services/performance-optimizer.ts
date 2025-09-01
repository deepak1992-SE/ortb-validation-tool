/**
 * Performance Optimizer
 * Provides utilities for optimizing large request processing and batch operations
 */

import { ORTBRequest, ValidationResult, BatchValidationResult } from '../models';

export interface PerformanceMetrics {
  /** Total processing time in milliseconds */
  totalTime: number;
  /** Average processing time per item */
  averageTime: number;
  /** Throughput (items per second) */
  throughput: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Cache hit rate percentage */
  cacheHitRate: number;
  /** Number of items processed */
  itemsProcessed: number;
  /** Timestamp of measurement */
  timestamp: Date;
}

export interface BatchProcessingOptions {
  /** Maximum batch size for processing */
  maxBatchSize?: number;
  /** Maximum concurrent operations */
  maxConcurrency?: number;
  /** Enable request deduplication */
  enableDeduplication?: boolean;
  /** Enable result streaming */
  enableStreaming?: boolean;
  /** Progress callback */
  onProgress?: (processed: number, total: number, metrics: PerformanceMetrics) => void;
}

export interface OptimizationResult<T> {
  /** Processed results */
  results: T[];
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Optimization statistics */
  optimizationStats: OptimizationStats;
}

export interface OptimizationStats {
  /** Number of duplicate requests found */
  duplicatesFound: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Number of cache misses */
  cacheMisses: number;
  /** Memory saved through optimization (bytes) */
  memorySaved: number;
  /** Time saved through optimization (ms) */
  timeSaved: number;
}

/**
 * Performance optimizer for batch operations
 */
export class PerformanceOptimizer {
  private startTime: number = 0;
  private processedItems: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  /**
   * Start performance measurement
   */
  startMeasurement(): void {
    this.startTime = Date.now();
    this.processedItems = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Record processed item
   */
  recordProcessedItem(): void {
    this.processedItems++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const totalTime = Date.now() - this.startTime;
    const averageTime = this.processedItems > 0 ? totalTime / this.processedItems : 0;
    const throughput = totalTime > 0 ? (this.processedItems / totalTime) * 1000 : 0;
    const totalRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    return {
      totalTime,
      averageTime,
      throughput,
      memoryUsage: this.estimateMemoryUsage(),
      cacheHitRate,
      itemsProcessed: this.processedItems,
      timestamp: new Date()
    };
  }

  /**
   * Optimize batch processing by removing duplicates and optimizing order
   */
  optimizeBatch<T>(
    items: T[], 
    keyExtractor: (item: T) => string,
    options: BatchProcessingOptions = {}
  ): { optimizedItems: T[]; duplicateMap: Map<string, T[]>; stats: OptimizationStats } {
    const startTime = Date.now();
    const duplicateMap = new Map<string, T[]>();
    const uniqueItems: T[] = [];
    const seenKeys = new Set<string>();

    // Deduplicate items if enabled
    if (options.enableDeduplication !== false) {
      for (const item of items) {
        const key = keyExtractor(item);
        
        if (seenKeys.has(key)) {
          // Track duplicates
          if (!duplicateMap.has(key)) {
            duplicateMap.set(key, []);
          }
          duplicateMap.get(key)!.push(item);
        } else {
          seenKeys.add(key);
          uniqueItems.push(item);
        }
      }
    } else {
      uniqueItems.push(...items);
    }

    // Sort items by complexity (simple heuristic: smaller items first)
    const sortedItems = uniqueItems.sort((a, b) => {
      const sizeA = JSON.stringify(a).length;
      const sizeB = JSON.stringify(b).length;
      return sizeA - sizeB;
    });

    const optimizationTime = Date.now() - startTime;
    const duplicatesFound = items.length - uniqueItems.length;
    const memorySaved = duplicatesFound * this.estimateAverageItemSize(items);

    const stats: OptimizationStats = {
      duplicatesFound,
      cacheHits: 0, // Will be updated during processing
      cacheMisses: 0, // Will be updated during processing
      memorySaved,
      timeSaved: optimizationTime
    };

    return {
      optimizedItems: sortedItems,
      duplicateMap,
      stats
    };
  }

  /**
   * Process items in optimized batches with concurrency control
   */
  async processBatchOptimized<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchProcessingOptions = {}
  ): Promise<OptimizationResult<R>> {
    const {
      maxBatchSize = 50,
      maxConcurrency = 10,
      onProgress
    } = options;

    this.startMeasurement();
    const results: R[] = [];
    const totalItems = items.length;

    // Process items in batches
    for (let i = 0; i < items.length; i += maxBatchSize) {
      const batch = items.slice(i, i + maxBatchSize);
      const batchResults = await this.processConcurrentBatch(batch, processor, maxConcurrency);
      
      results.push(...batchResults);
      this.processedItems += batch.length;

      // Report progress
      if (onProgress) {
        const metrics = this.getMetrics();
        onProgress(this.processedItems, totalItems, metrics);
      }
    }

    const finalMetrics = this.getMetrics();
    const optimizationStats: OptimizationStats = {
      duplicatesFound: 0,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      memorySaved: 0,
      timeSaved: 0
    };

    return {
      results,
      metrics: finalMetrics,
      optimizationStats
    };
  }

  /**
   * Process a batch with concurrency control
   */
  private async processConcurrentBatch<T, R>(
    batch: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number
  ): Promise<R[]> {
    const results: R[] = [];
    const semaphore = new Semaphore(maxConcurrency);

    const promises = batch.map(async (item, index) => {
      await semaphore.acquire();
      try {
        const result = await processor(item);
        results[index] = result;
        return result;
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0; // Fallback for browser environments
  }

  /**
   * Estimate average item size for memory calculations
   */
  private estimateAverageItemSize<T>(items: T[]): number {
    if (items.length === 0) return 0;
    
    const sampleSize = Math.min(10, items.length);
    let totalSize = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      totalSize += JSON.stringify(items[i]).length * 2; // Rough estimate: 2 bytes per character
    }
    
    return totalSize / sampleSize;
  }
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

/**
 * Request deduplicator for ORTB requests
 */
export class RequestDeduplicator {
  /**
   * Generate a hash key for an ORTB request for deduplication
   */
  static generateRequestKey(request: ORTBRequest): string {
    // Create a normalized version of the request for hashing
    const normalized = {
      imp: request.imp?.map(imp => ({
        banner: imp.banner ? { 
          w: imp.banner.w, 
          h: imp.banner.h,
          pos: imp.banner.pos,
          mimes: imp.banner.mimes?.sort()
        } : undefined,
        video: imp.video ? { 
          mimes: imp.video.mimes?.sort(), 
          minduration: imp.video.minduration,
          maxduration: imp.video.maxduration,
          w: imp.video.w,
          h: imp.video.h
        } : undefined,
        bidfloor: imp.bidfloor,
        bidfloorcur: imp.bidfloorcur
      })),
      site: request.site ? { domain: request.site.domain } : undefined,
      app: request.app ? { bundle: request.app.bundle } : undefined,
      device: request.device ? { devicetype: request.device.devicetype } : undefined,
      at: request.at,
      tmax: request.tmax
    };

    const str = JSON.stringify(normalized, Object.keys(normalized).sort());
    return this.hashString(str);
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private snapshots: Array<{ timestamp: number; usage: number }> = [];

  /**
   * Take a memory snapshot
   */
  snapshot(): number {
    const usage = this.getCurrentMemoryUsage();
    this.snapshots.push({ timestamp: Date.now(), usage });
    
    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
    
    return usage;
  }

  /**
   * Get memory usage trend
   */
  getTrend(): { increasing: boolean; rate: number } {
    if (this.snapshots.length < 2) {
      return { increasing: false, rate: 0 };
    }

    const recent = this.snapshots.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const timeDiff = last.timestamp - first.timestamp;
    const usageDiff = last.usage - first.usage;
    
    const rate = timeDiff > 0 ? usageDiff / timeDiff : 0;
    
    return {
      increasing: usageDiff > 0,
      rate: Math.abs(rate)
    };
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}