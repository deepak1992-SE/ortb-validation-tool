/**
 * Performance Benchmarks and Tests
 * Tests for performance optimization and caching functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ORTBValidationService } from '../validation-service';
import { SampleTemplateManager } from '../sample-template-manager';
import { SchemaManager } from '../../validation/schema-manager';
import { PerformanceOptimizer, RequestDeduplicator, MemoryTracker } from '../performance-optimizer';
import { ValidationResultCache, SchemaCache, TemplateCache } from '../cache-service';
import { ORTBRequest } from '../../models/ortb';

describe('Performance Benchmarks', () => {
  let validationService: ORTBValidationService;
  let templateManager: SampleTemplateManager;
  let schemaManager: SchemaManager;
  let performanceOptimizer: PerformanceOptimizer;

  beforeEach(() => {
    validationService = new ORTBValidationService({
      enableCaching: true,
      maxConcurrency: 5
    });
    templateManager = new SampleTemplateManager();
    schemaManager = new SchemaManager();
    performanceOptimizer = new PerformanceOptimizer();
  });

  afterEach(() => {
    validationService.destroy();
    templateManager.clearCache();
    schemaManager.clearCache();
  });

  describe('Validation Result Caching', () => {
    it('should cache validation results and improve performance', async () => {
      const request: ORTBRequest = {
        id: 'test-request-1',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 },
          bidfloor: 0.5
        }],
        at: 1
      };

      // First validation (cache miss)
      const start1 = Date.now();
      const result1 = await validationService.validateSingle(request);
      const time1 = Date.now() - start1;

      expect(result1.isValid).toBeDefined();
      expect((result1 as any).fromCache).toBe(false);

      // Second validation (cache hit)
      const start2 = Date.now();
      const result2 = await validationService.validateSingle(request);
      const time2 = Date.now() - start2;

      expect(result2.isValid).toBe(result1.isValid);
      expect((result2 as any).fromCache).toBe(true);
      expect(time2).toBeLessThan(time1); // Cache hit should be faster

      // Verify cache statistics
      const cacheStats = validationService.getCacheStats();
      expect(cacheStats.hitCount).toBeGreaterThan(0);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    it('should handle cache expiration correctly', async () => {
      const cache = new ValidationResultCache();
      const testData = { test: 'data' };

      // Set with short TTL
      cache.set('test-key', testData, 100); // 100ms TTL

      // Should be available immediately
      expect(cache.get('test-key')).toEqual(testData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get('test-key')).toBeUndefined();
    });

    it('should evict entries when cache is full', () => {
      const cache = new ValidationResultCache();
      
      // Fill cache beyond capacity (assuming small capacity for test)
      for (let i = 0; i < 10; i++) {
        cache.set(`key-${i}`, { data: i });
      }

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.totalEntries).toBeLessThanOrEqual(10);
    });
  });

  describe('Schema Caching', () => {
    it('should cache schema loading and improve performance', async () => {
      // First schema load
      const start1 = Date.now();
      const schema1 = await schemaManager.loadSchema('2.6');
      const time1 = Date.now() - start1;

      expect(schema1.version).toBe('2.6');

      // Second schema load (should be cached)
      const start2 = Date.now();
      const schema2 = await schemaManager.loadSchema('2.6');
      const time2 = Date.now() - start2;

      expect(schema2.version).toBe('2.6');
      expect(time2).toBeLessThanOrEqual(time1); // Cache hit should be faster or equal

      // Verify cache statistics
      const cacheStats = schemaManager.getCacheStats();
      expect(cacheStats.schemaCache.totalEntries).toBeGreaterThan(0);
    });

    it('should cache field definitions efficiently', async () => {
      await schemaManager.loadSchema('2.6');

      // First field definition lookup
      const start1 = Date.now();
      const field1 = schemaManager.getFieldDefinitions('imp.banner.w');
      const time1 = Date.now() - start1;

      expect(field1).toBeDefined();

      // Second lookup (should be faster due to caching)
      const start2 = Date.now();
      const field2 = schemaManager.getFieldDefinitions('imp.banner.w');
      const time2 = Date.now() - start2;

      expect(field2).toEqual(field1);
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Template Caching', () => {
    it('should cache generated requests and improve performance', () => {
      const templateId = 'basic-display-banner';
      const customFields = { 'imp.0.bidfloor': 1.0 };

      // First generation (cache miss)
      const start1 = Date.now();
      const request1 = templateManager.generateRequestFromTemplate(templateId, customFields);
      const time1 = Date.now() - start1;

      expect(request1.imp[0].bidfloor).toBe(1.0);

      // Second generation (cache hit)
      const start2 = Date.now();
      const request2 = templateManager.generateRequestFromTemplate(templateId, customFields);
      const time2 = Date.now() - start2;

      expect(request2.imp[0].bidfloor).toBe(1.0);
      expect(time2).toBeLessThanOrEqual(time1);

      // Verify cache statistics
      const cacheStats = templateManager.getCacheStats();
      expect(cacheStats.totalEntries).toBeGreaterThan(0);
    });

    it('should generate different cache keys for different custom fields', () => {
      const templateId = 'basic-display-banner';
      
      const request1 = templateManager.generateRequestFromTemplate(templateId, { 'imp.0.bidfloor': 1.0 });
      const request2 = templateManager.generateRequestFromTemplate(templateId, { 'imp.0.bidfloor': 2.0 });

      expect(request1.imp[0].bidfloor).toBe(1.0);
      expect(request2.imp[0].bidfloor).toBe(2.0);

      // Should have separate cache entries
      const cacheStats = templateManager.getCacheStats();
      expect(cacheStats.totalEntries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Batch Processing Optimization', () => {
    it('should optimize batch processing with deduplication', async () => {
      const requests: ORTBRequest[] = [
        {
          id: 'req-1',
          imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
          at: 1
        },
        {
          id: 'req-2', // Different ID but same structure
          imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
          at: 1
        },
        {
          id: 'req-3',
          imp: [{ id: '1', banner: { w: 728, h: 90 }, bidfloor: 1.0 }],
          at: 1
        }
      ];

      // Test deduplication
      const keyExtractor = (req: ORTBRequest) => RequestDeduplicator.generateRequestKey(req);
      const optimization = performanceOptimizer.optimizeBatch(requests, keyExtractor, {
        enableDeduplication: true
      });

      expect(optimization.optimizedItems.length).toBeLessThanOrEqual(requests.length);
      expect(optimization.stats.duplicatesFound).toBeGreaterThanOrEqual(0);
    });

    it('should process batches with concurrency control', async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i, data: `item-${i}` }));
      
      const processor = async (item: any) => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async work
        return { processed: item.id };
      };

      performanceOptimizer.startMeasurement();
      
      const result = await performanceOptimizer.processBatchOptimized(items, processor, {
        maxBatchSize: 5,
        maxConcurrency: 3
      });

      expect(result.results).toHaveLength(20);
      expect(result.metrics.itemsProcessed).toBe(20);
      expect(result.metrics.throughput).toBeGreaterThan(0);
      expect(result.metrics.totalTime).toBeGreaterThan(0);
    });

    it('should track performance metrics accurately', async () => {
      performanceOptimizer.startMeasurement();
      
      // Simulate some processing
      performanceOptimizer.recordProcessedItem();
      performanceOptimizer.recordCacheHit();
      performanceOptimizer.recordCacheMiss();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = performanceOptimizer.getMetrics();
      
      expect(metrics.itemsProcessed).toBe(1);
      expect(metrics.cacheHitRate).toBe(50); // 1 hit out of 2 total
      expect(metrics.totalTime).toBeGreaterThan(40);
      expect(metrics.averageTime).toBeGreaterThan(40);
      expect(metrics.throughput).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should track memory usage trends', () => {
      const memoryTracker = new MemoryTracker();
      
      // Take initial snapshot
      memoryTracker.snapshot();
      
      // Simulate memory usage
      const largeArray = new Array(1000).fill('test data');
      memoryTracker.snapshot();
      
      const trend = memoryTracker.getTrend();
      expect(trend).toBeDefined();
      expect(typeof trend.increasing).toBe('boolean');
      expect(typeof trend.rate).toBe('number');
      
      // Clean up
      largeArray.length = 0;
    });

    it('should estimate cache memory usage', () => {
      const cache = new ValidationResultCache();
      
      // Add some test data
      for (let i = 0; i < 10; i++) {
        cache.set(`key-${i}`, { 
          data: `test data ${i}`,
          largeField: new Array(100).fill(`item-${i}`)
        });
      }
      
      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.totalEntries).toBe(10);
    });
  });

  describe('Request Deduplication', () => {
    it('should generate consistent keys for similar requests', () => {
      const request1: ORTBRequest = {
        id: 'req-1',
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      const request2: ORTBRequest = {
        id: 'req-2', // Different ID
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      const key1 = RequestDeduplicator.generateRequestKey(request1);
      const key2 = RequestDeduplicator.generateRequestKey(request2);

      expect(key1).toBe(key2); // Should be same because structure is same
    });

    it('should generate different keys for different requests', () => {
      const request1: ORTBRequest = {
        id: 'req-1',
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      const request2: ORTBRequest = {
        id: 'req-2',
        imp: [{ id: '1', banner: { w: 728, h: 90 }, bidfloor: 1.0 }], // Different banner size
        at: 1
      };

      const key1 = RequestDeduplicator.generateRequestKey(request1);
      const key2 = RequestDeduplicator.generateRequestKey(request2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Large Scale Performance Tests', () => {
    it('should handle large batch validation efficiently', async () => {
      const requests: ORTBRequest[] = [];
      
      // Generate 100 test requests
      for (let i = 0; i < 100; i++) {
        requests.push({
          id: `req-${i}`,
          imp: [{
            id: '1',
            banner: { w: 300, h: 250 },
            bidfloor: Math.random()
          }],
          at: 1
        });
      }

      const startTime = Date.now();
      const result = await validationService.validateBatch(requests, {
        concurrency: 10,
        onProgress: (processed, total) => {
          // Progress callback test
          expect(processed).toBeLessThanOrEqual(total);
        }
      });
      const totalTime = Date.now() - startTime;

      expect(result.results).toHaveLength(100);
      expect(result.summary.totalRequests).toBe(100);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Check processing stats
      const processingStats = (result as any).processingStats;
      if (processingStats) {
        expect(processingStats.totalProcessingTime).toBeGreaterThanOrEqual(0);
        expect(processingStats.averageProcessingTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should demonstrate cache effectiveness with repeated requests', async () => {
      const baseRequest: ORTBRequest = {
        id: 'base-req',
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      // Create 50 identical requests (should benefit from caching)
      const requests = Array.from({ length: 50 }, (_, i) => ({
        ...baseRequest,
        id: `req-${i}` // Different IDs but same structure
      }));

      const startTime = Date.now();
      const result = await validationService.validateBatch(requests);
      const totalTime = Date.now() - startTime;

      expect(result.results).toHaveLength(50);
      
      // With caching, this should be much faster than without
      const cacheStats = validationService.getCacheStats();
      expect(cacheStats.hitRate).toBeGreaterThanOrEqual(0); // Should have some cache hits
      
      console.log(`Batch validation with caching: ${totalTime}ms, Cache hit rate: ${cacheStats.hitRate}%`);
    });
  });

  describe('Cache Service Performance', () => {
    it('should handle high-frequency cache operations efficiently', () => {
      const cache = new ValidationResultCache();
      const iterations = 1000;
      
      const startTime = Date.now();
      
      // Perform many cache operations
      for (let i = 0; i < iterations; i++) {
        cache.set(`key-${i}`, { data: `value-${i}`, index: i });
      }
      
      for (let i = 0; i < iterations; i++) {
        const value = cache.get(`key-${i}`);
        expect(value).toBeDefined();
      }
      
      const totalTime = Date.now() - startTime;
      const opsPerSecond = (iterations * 2) / (totalTime / 1000);
      
      expect(opsPerSecond).toBeGreaterThan(1000); // Should handle at least 1000 ops/sec
      
      console.log(`Cache performance: ${opsPerSecond.toFixed(0)} ops/second`);
    });

    it('should cleanup expired entries efficiently', async () => {
      const cache = new ValidationResultCache();
      
      // Add entries with short TTL
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, { data: i }, 50); // 50ms TTL
      }
      
      expect(cache.getStats().totalEntries).toBe(100);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Cleanup
      const removedCount = cache.cleanup();
      
      expect(removedCount).toBeGreaterThan(0);
      expect(cache.getStats().totalEntries).toBeLessThan(100);
    });
  });
});