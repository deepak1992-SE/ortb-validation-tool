/**
 * Cache Performance Tests
 * Focused tests for cache performance and effectiveness
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ValidationResultCache, SchemaCache, TemplateCache, CacheService } from '../cache-service';
import { ORTBValidationService } from '../validation-service';
import { SampleTemplateManager } from '../sample-template-manager';
import { ORTBRequest } from '../../models/ortb';

describe('Cache Performance Tests', () => {
  describe('ValidationResultCache Performance', () => {
    let cache: ValidationResultCache;

    beforeEach(() => {
      cache = new ValidationResultCache();
    });

    afterEach(() => {
      cache.destroy();
    });

    it('should demonstrate significant performance improvement with caching', async () => {
      const validationService = new ORTBValidationService({ enableCaching: true });
      
      const testRequest: ORTBRequest = {
        id: 'perf-test-request',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 },
          bidfloor: 0.5,
          bidfloorcur: 'USD'
        }],
        at: 1,
        tmax: 100
      };

      // Measure first validation (cache miss)
      const start1 = performance.now();
      const result1 = await validationService.validateSingle(testRequest);
      const time1 = performance.now() - start1;

      // Measure second validation (cache hit)
      const start2 = performance.now();
      const result2 = await validationService.validateSingle(testRequest);
      const time2 = performance.now() - start2;

      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.5); // At least 50% faster
      expect((result1 as any).fromCache).toBe(false);
      expect((result2 as any).fromCache).toBe(true);

      const stats = validationService.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(0);

      console.log(`Cache miss: ${time1.toFixed(2)}ms, Cache hit: ${time2.toFixed(2)}ms, Speedup: ${(time1/time2).toFixed(1)}x`);
      
      validationService.destroy();
    });

    it('should handle concurrent cache operations efficiently', async () => {
      const concurrentOperations = 100;
      const promises: Promise<any>[] = [];

      const startTime = performance.now();

      // Perform concurrent cache operations
      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(
          Promise.resolve().then(() => {
            cache.set(`concurrent-key-${i}`, { 
              data: `value-${i}`,
              timestamp: Date.now(),
              index: i 
            });
            return cache.get(`concurrent-key-${i}`);
          })
        );
      }

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(concurrentOperations);
      expect(results.every(result => result !== undefined)).toBe(true);
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(concurrentOperations);

      console.log(`Concurrent cache operations: ${concurrentOperations} ops in ${totalTime.toFixed(2)}ms`);
    });

    it('should maintain performance under memory pressure', () => {
      const largeDataSize = 1000;
      const iterations = 500;

      const startTime = performance.now();

      // Fill cache with large objects
      for (let i = 0; i < iterations; i++) {
        const largeObject = {
          id: i,
          data: new Array(largeDataSize).fill(`item-${i}`),
          metadata: {
            created: Date.now(),
            size: largeDataSize,
            index: i
          }
        };
        
        cache.set(`large-key-${i}`, largeObject);
      }

      const fillTime = performance.now() - startTime;

      // Test retrieval performance
      const retrievalStart = performance.now();
      let retrievedCount = 0;

      for (let i = 0; i < iterations; i++) {
        const result = cache.get(`large-key-${i}`);
        if (result) {
          retrievedCount++;
        }
      }

      const retrievalTime = performance.now() - retrievalStart;

      const stats = cache.getStats();
      
      expect(retrievedCount).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);

      console.log(`Memory pressure test: Fill ${fillTime.toFixed(2)}ms, Retrieval ${retrievalTime.toFixed(2)}ms, Memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Schema Cache Performance', () => {
    let cache: SchemaCache;

    beforeEach(() => {
      cache = new SchemaCache();
    });

    afterEach(() => {
      cache.destroy();
    });

    it('should cache schema data effectively', () => {
      const mockSchema = {
        version: '2.6',
        properties: {
          id: { type: 'string' },
          imp: { type: 'array' }
        },
        required: ['id', 'imp']
      };

      // First access (cache miss)
      const start1 = performance.now();
      cache.set('schema:2.6', mockSchema);
      const result1 = cache.get('schema:2.6');
      const time1 = performance.now() - start1;

      // Second access (cache hit)
      const start2 = performance.now();
      const result2 = cache.get('schema:2.6');
      const time2 = performance.now() - start2;

      expect(result1).toEqual(mockSchema);
      expect(result2).toEqual(mockSchema);
      expect(time2).toBeLessThan(time1);

      const stats = cache.getStats();
      expect(stats.hitCount).toBeGreaterThan(0);
    });
  });

  describe('Template Cache Performance', () => {
    let templateManager: SampleTemplateManager;

    beforeEach(() => {
      templateManager = new SampleTemplateManager();
    });

    afterEach(() => {
      templateManager.clearCache();
    });

    it('should cache template generation effectively', () => {
      const templateId = 'basic-display-banner';
      const customFields = { 'imp.0.bidfloor': 1.5 };

      // First generation (cache miss)
      const start1 = performance.now();
      const request1 = templateManager.generateRequestFromTemplate(templateId, customFields);
      const time1 = performance.now() - start1;

      // Second generation (cache hit)
      const start2 = performance.now();
      const request2 = templateManager.generateRequestFromTemplate(templateId, customFields);
      const time2 = performance.now() - start2;

      expect(request1).toEqual(request2);
      expect(time2).toBeLessThan(time1);

      const stats = templateManager.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);

      console.log(`Template generation: Miss ${time1.toFixed(2)}ms, Hit ${time2.toFixed(2)}ms`);
    });

    it('should handle multiple template variations efficiently', () => {
      const templateId = 'basic-display-banner';
      const variations = [
        { 'imp.0.bidfloor': 0.5 },
        { 'imp.0.bidfloor': 1.0 },
        { 'imp.0.bidfloor': 1.5 },
        { 'imp.0.banner.w': 728, 'imp.0.banner.h': 90 },
        { 'imp.0.banner.w': 320, 'imp.0.banner.h': 50 }
      ];

      const startTime = performance.now();

      // Generate all variations twice
      for (let round = 0; round < 2; round++) {
        for (const customFields of variations) {
          const request = templateManager.generateRequestFromTemplate(templateId, customFields);
          expect(request).toBeDefined();
        }
      }

      const totalTime = performance.now() - startTime;
      const stats = templateManager.getCacheStats();

      expect(stats.totalEntries).toBe(variations.length);
      expect(stats.hitCount).toBeGreaterThan(0); // Second round should have cache hits

      console.log(`Template variations: ${variations.length * 2} generations in ${totalTime.toFixed(2)}ms, Hit rate: ${stats.hitRate.toFixed(1)}%`);
    });
  });

  describe('Cache Eviction Performance', () => {
    it('should handle LRU eviction efficiently', () => {
      const cache = new CacheService<any>({
        maxEntries: 100,
        enableLru: true
      });

      // Fill cache to capacity
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, { data: i });
      }

      expect(cache.getStats().totalEntries).toBe(100);

      // Access some entries to make them recently used
      for (let i = 0; i < 50; i++) {
        cache.get(`key-${i}`);
      }

      const evictionStart = performance.now();

      // Add more entries to trigger eviction
      for (let i = 100; i < 150; i++) {
        cache.set(`key-${i}`, { data: i });
      }

      const evictionTime = performance.now() - evictionStart;

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(100);
      expect(evictionTime).toBeLessThan(50); // Eviction should be fast

      // Recently accessed items should still be there
      for (let i = 0; i < 25; i++) {
        expect(cache.get(`key-${i}`)).toBeDefined();
      }

      console.log(`LRU eviction: ${evictionTime.toFixed(2)}ms for 50 entries`);
      
      cache.destroy();
    });

    it('should cleanup expired entries efficiently', async () => {
      const cache = new CacheService<any>({
        maxEntries: 1000,
        defaultTtl: 50 // 50ms TTL
      });

      // Add many entries
      const entryCount = 500;
      for (let i = 0; i < entryCount; i++) {
        cache.set(`expiry-key-${i}`, { data: i });
      }

      expect(cache.getStats().totalEntries).toBe(entryCount);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const cleanupStart = performance.now();
      const removedCount = cache.cleanup();
      const cleanupTime = performance.now() - cleanupStart;

      expect(removedCount).toBeGreaterThan(0);
      expect(cleanupTime).toBeLessThan(20); // Cleanup should be fast

      console.log(`Cleanup: ${removedCount} expired entries in ${cleanupTime.toFixed(2)}ms`);
      
      cache.destroy();
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should track memory usage accurately', () => {
      const cache = new CacheService<any>({
        trackMemoryUsage: true,
        maxEntries: 1000
      });

      const initialStats = cache.getStats();
      const initialMemory = initialStats.memoryUsage;

      // Add data of known size
      const testData = {
        largeString: 'x'.repeat(10000), // 10KB string
        array: new Array(1000).fill('test'),
        nested: {
          data: 'nested data',
          more: { deep: 'value' }
        }
      };

      for (let i = 0; i < 10; i++) {
        cache.set(`memory-key-${i}`, { ...testData, id: i });
      }

      const finalStats = cache.getStats();
      const memoryIncrease = finalStats.memoryUsage - initialMemory;

      expect(memoryIncrease).toBeGreaterThan(0);
      expect(finalStats.totalEntries).toBe(10);

      console.log(`Memory tracking: ${(memoryIncrease / 1024).toFixed(2)}KB for 10 entries`);
      
      cache.destroy();
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical validation workload efficiently', async () => {
      const validationService = new ORTBValidationService({
        enableCaching: true,
        maxConcurrency: 8
      });

      // Simulate typical workload: mix of unique and repeated requests
      const uniqueRequests = 20;
      const repetitions = 5;
      const requests: ORTBRequest[] = [];

      // Create base requests
      for (let i = 0; i < uniqueRequests; i++) {
        const baseRequest: ORTBRequest = {
          id: `workload-req-${i}`,
          imp: [{
            id: '1',
            banner: { 
              w: [300, 728, 320][i % 3], 
              h: [250, 90, 50][i % 3] 
            },
            bidfloor: Math.random() * 2
          }],
          at: 1,
          tmax: 100
        };
        
        // Add each request multiple times (simulating repeated validation)
        for (let r = 0; r < repetitions; r++) {
          requests.push({ ...baseRequest, id: `${baseRequest.id}-${r}` });
        }
      }

      const startTime = performance.now();
      const result = await validationService.validateBatch(requests, {
        concurrency: 8
      });
      const totalTime = performance.now() - startTime;

      expect(result.results).toHaveLength(uniqueRequests * repetitions);
      
      const cacheStats = validationService.getCacheStats();
      const throughput = requests.length / (totalTime / 1000);

      console.log(`Workload test: ${requests.length} validations in ${totalTime.toFixed(2)}ms`);
      console.log(`Throughput: ${throughput.toFixed(1)} validations/sec`);
      console.log(`Cache hit rate: ${cacheStats.hitRate.toFixed(1)}%`);

      expect(throughput).toBeGreaterThan(50); // Should handle at least 50 validations/sec
      expect(cacheStats.hitRate).toBeGreaterThan(50); // Should have good cache hit rate

      validationService.destroy();
    });
  });
});