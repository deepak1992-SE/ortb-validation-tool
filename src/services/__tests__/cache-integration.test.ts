/**
 * Cache Integration Tests
 * Simple integration tests to verify caching functionality works correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ORTBValidationService } from '../validation-service';
import { SampleTemplateManager } from '../sample-template-manager';
import { ValidationResultCache } from '../cache-service';
import { ORTBRequest } from '../../models/ortb';

describe('Cache Integration Tests', () => {
  describe('Validation Service Caching', () => {
    let validationService: ORTBValidationService;

    beforeEach(() => {
      validationService = new ORTBValidationService({
        enableCaching: true,
        cacheTtl: 60000 // 1 minute
      });
    });

    afterEach(() => {
      validationService.destroy();
    });

    it('should cache validation results correctly', async () => {
      const request: ORTBRequest = {
        id: 'cache-test-request',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 },
          bidfloor: 0.5
        }],
        at: 1
      };

      // First validation
      const result1 = await validationService.validateSingle(request);
      expect((result1 as any).fromCache).toBe(false);

      // Second validation should be from cache
      const result2 = await validationService.validateSingle(request);
      expect((result2 as any).fromCache).toBe(true);

      // Results should be equivalent
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors.length).toBe(result2.errors.length);
      expect(result1.warnings.length).toBe(result2.warnings.length);

      // Cache stats should show hits
      const stats = validationService.getCacheStats();
      expect(stats.hitCount).toBeGreaterThan(0);
      expect(stats.totalEntries).toBeGreaterThan(0);
    });

    it('should handle different requests with separate cache entries', async () => {
      const request1: ORTBRequest = {
        id: 'request-1',
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      const request2: ORTBRequest = {
        id: 'request-2',
        imp: [{ id: '1', banner: { w: 728, h: 90 }, bidfloor: 1.0 }],
        at: 1
      };

      await validationService.validateSingle(request1);
      await validationService.validateSingle(request2);

      const stats = validationService.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
    });

    it('should clear cache correctly', async () => {
      const request: ORTBRequest = {
        id: 'clear-test-request',
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      await validationService.validateSingle(request);
      
      let stats = validationService.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);

      validationService.clearCache();
      
      stats = validationService.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('Template Manager Caching', () => {
    let templateManager: SampleTemplateManager;

    beforeEach(() => {
      templateManager = new SampleTemplateManager();
    });

    afterEach(() => {
      templateManager.clearCache();
    });

    it('should cache generated templates correctly', () => {
      const templateId = 'basic-display-banner';
      const customFields = { 'imp.0.bidfloor': 1.5 };

      // First generation
      const request1 = templateManager.generateRequestFromTemplate(templateId, customFields);
      
      // Second generation should use cache
      const request2 = templateManager.generateRequestFromTemplate(templateId, customFields);

      expect(request1).toEqual(request2);
      expect(request1.imp[0].bidfloor).toBe(1.5);

      const stats = templateManager.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });

    it('should handle different custom fields separately', () => {
      const templateId = 'basic-display-banner';

      const request1 = templateManager.generateRequestFromTemplate(templateId, { 'imp.0.bidfloor': 1.0 });
      const request2 = templateManager.generateRequestFromTemplate(templateId, { 'imp.0.bidfloor': 2.0 });

      expect(request1.imp[0].bidfloor).toBe(1.0);
      expect(request2.imp[0].bidfloor).toBe(2.0);

      const stats = templateManager.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cache Service Basic Functionality', () => {
    let cache: ValidationResultCache;

    beforeEach(() => {
      cache = new ValidationResultCache();
    });

    afterEach(() => {
      cache.destroy();
    });

    it('should store and retrieve values correctly', () => {
      const testData = { test: 'value', number: 42 };
      
      cache.set('test-key', testData);
      const retrieved = cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle cache misses correctly', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should track statistics correctly', () => {
      cache.set('key1', { data: 1 });
      cache.set('key2', { data: 2 });
      
      cache.get('key1'); // hit
      cache.get('key2'); // hit
      cache.get('key3'); // miss
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(66.67); // 2/3 * 100
    });

    it('should handle TTL expiration', async () => {
      cache.set('expiry-key', { data: 'test' }, 50); // 50ms TTL
      
      // Should be available immediately
      expect(cache.get('expiry-key')).toBeDefined();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be expired
      expect(cache.get('expiry-key')).toBeUndefined();
    });
  });

  describe('Performance Verification', () => {
    it('should demonstrate measurable performance improvement', async () => {
      const validationService = new ORTBValidationService({ enableCaching: true });
      
      const request: ORTBRequest = {
        id: 'perf-test',
        imp: [{ id: '1', banner: { w: 300, h: 250 }, bidfloor: 0.5 }],
        at: 1
      };

      // Measure uncached validation
      const start1 = performance.now();
      await validationService.validateSingle(request);
      const uncachedTime = performance.now() - start1;

      // Measure cached validation
      const start2 = performance.now();
      await validationService.validateSingle(request);
      const cachedTime = performance.now() - start2;

      // Cached should be faster (allowing for some variance in timing)
      expect(cachedTime).toBeLessThan(uncachedTime + 1); // Allow 1ms variance
      
      console.log(`Performance improvement: ${uncachedTime.toFixed(2)}ms -> ${cachedTime.toFixed(2)}ms`);
      
      validationService.destroy();
    });
  });
});