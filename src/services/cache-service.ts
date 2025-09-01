/**
 * Cache Service Implementation
 * Provides caching capabilities for validation results, schemas, and templates
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface CacheConfig {
  /** Maximum number of entries to store */
  maxEntries?: number;
  /** Default TTL in milliseconds */
  defaultTtl?: number;
  /** Enable LRU eviction */
  enableLru?: boolean;
  /** Enable memory usage tracking */
  trackMemoryUsage?: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
}

/**
 * Generic cache service with TTL, LRU eviction, and performance tracking
 */
export class CacheService<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private config: Required<CacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      defaultTtl: config.defaultTtl ?? 3600000, // 1 hour
      enableLru: config.enableLru ?? true,
      trackMemoryUsage: config.trackMemoryUsage ?? true,
      cleanupInterval: config.cleanupInterval ?? 300000 // 5 minutes
    };

    // Start cleanup timer
    if (this.config.cleanupInterval > 0) {
      this.startCleanupTimer();
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hitCount++;

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl ?? this.config.defaultTtl;

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 1,
      lastAccessed: now
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictEntries();
    }

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists in cache (without updating access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    let memoryUsage = 0;
    let oldestEntry: number | undefined;
    let newestEntry: number | undefined;

    if (this.config.trackMemoryUsage) {
      this.cache.forEach(entry => {
        // Rough memory estimation
        memoryUsage += this.estimateMemoryUsage(entry.value);
        
        if (!oldestEntry || entry.timestamp < oldestEntry) {
          oldestEntry = entry.timestamp;
        }
        if (!newestEntry || entry.timestamp > newestEntry) {
          newestEntry = entry.timestamp;
        }
      });
    }

    return {
      totalEntries: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
      oldestEntry: oldestEntry || 0,
      newestEntry: newestEntry || 0
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries (for debugging)
   */
  entries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Destroy cache service and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined as any;
    }
    this.clear();
  }

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry<T>, now?: number): boolean {
    const currentTime = now ?? Date.now();
    return currentTime - entry.timestamp > entry.ttl;
  }

  /**
   * Evict entries when cache is full
   */
  private evictEntries(): void {
    const entriesToRemove = Math.max(1, Math.floor(this.config.maxEntries * 0.1)); // Remove 10%

    if (this.config.enableLru) {
      // LRU eviction - remove least recently used entries
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
        const key = sortedEntries[i]?.[0];
        if (key) this.cache.delete(key);
      }
    } else {
      // FIFO eviction - remove oldest entries
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
        const key = sortedEntries[i]?.[0];
        if (key) this.cache.delete(key);
      }
    }
  }

  /**
   * Estimate memory usage of a value (rough approximation)
   */
  private estimateMemoryUsage(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1000; // Default estimate for non-serializable objects
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
}

/**
 * Specialized cache for validation results
 */
export class ValidationResultCache extends CacheService<any> {
  constructor() {
    super({
      maxEntries: 5000,
      defaultTtl: 1800000, // 30 minutes
      enableLru: true,
      trackMemoryUsage: true,
      cleanupInterval: 300000 // 5 minutes
    });
  }

  /**
   * Generate cache key for validation request
   */
  generateKey(request: any, options?: any): string {
    const requestHash = this.hashObject(request);
    const optionsHash = options ? this.hashObject(options) : '';
    return `validation:${requestHash}:${optionsHash}`;
  }

  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
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
 * Specialized cache for schema data
 */
export class SchemaCache extends CacheService<any> {
  constructor() {
    super({
      maxEntries: 100,
      defaultTtl: 7200000, // 2 hours
      enableLru: false, // Schemas don't change frequently
      trackMemoryUsage: true,
      cleanupInterval: 600000 // 10 minutes
    });
  }
}

/**
 * Specialized cache for template data
 */
export class TemplateCache extends CacheService<any> {
  constructor() {
    super({
      maxEntries: 500,
      defaultTtl: 3600000, // 1 hour
      enableLru: true,
      trackMemoryUsage: true,
      cleanupInterval: 300000 // 5 minutes
    });
  }
}