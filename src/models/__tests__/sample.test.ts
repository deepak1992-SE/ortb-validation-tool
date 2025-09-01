/**
 * Unit tests for sample generation models
 * Tests sample configuration, template structures, and generation metadata
 */

import { describe, it, expect } from 'vitest';
import type {
  SampleConfig,
  PublisherInfo,
  DeviceInfo,
  UserInfo,
  GeoInfo,
  SampleTemplate,
  GeneratedSample,
  SampleMetadata,
  GenerationStats,
  BatchSampleConfig,
  SampleVariations,
  BatchSampleResult,
  BatchSampleMetadata,
  BatchSampleSummary,
  SampleExportConfig,
  ExportedSample,
  ExportMetadata,
  AdType,
  SampleComplexity
} from '../sample';
import type { ORTBRequest } from '../ortb';

describe('Sample Generation Models', () => {
  describe('SampleConfig Interface', () => {
    it('should accept minimal sample configuration', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      expect(config.requestType).toBe('display');
      expect(config.includeOptionalFields).toBe(false);
      expect(config.complexity).toBe('minimal');
    });

    it('should accept comprehensive sample configuration', () => {
      const config: SampleConfig = {
        requestType: 'video',
        includeOptionalFields: true,
        complexity: 'comprehensive',
        customFields: {
          'imp.0.video.minduration': 15,
          'imp.0.video.maxduration': 30
        },
        publisherInfo: {
          name: 'Test Publisher',
          domain: 'testpub.com',
          siteName: 'Test Site',
          categories: ['IAB1', 'IAB2'],
          isMobileApp: false
        },
        deviceInfo: {
          deviceType: 'desktop',
          os: 'Windows',
          browser: 'Chrome',
          screenSize: { width: 1920, height: 1080 },
          supportsJavaScript: true
        },
        userInfo: {
          ageRange: '25-34',
          gender: 'M',
          interests: ['technology', 'sports'],
          optedOut: false
        },
        geoInfo: {
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
          coordinates: { lat: 37.7749, lon: -122.4194 }
        },
        impressionCount: 2,
        includePMP: true,
        testMode: true
      };

      expect(config.requestType).toBe('video');
      expect(config.publisherInfo?.name).toBe('Test Publisher');
      expect(config.deviceInfo?.deviceType).toBe('desktop');
      expect(config.userInfo?.ageRange).toBe('25-34');
      expect(config.geoInfo?.country).toBe('US');
      expect(config.impressionCount).toBe(2);
    });
  });

  describe('PublisherInfo Interface', () => {
    it('should accept website publisher info', () => {
      const publisherInfo: PublisherInfo = {
        name: 'News Corp',
        domain: 'news.com',
        siteName: 'Daily News',
        categories: ['IAB12', 'IAB13'],
        isMobileApp: false
      };

      expect(publisherInfo.isMobileApp).toBe(false);
      expect(publisherInfo.categories).toContain('IAB12');
    });

    it('should accept mobile app publisher info', () => {
      const publisherInfo: PublisherInfo = {
        name: 'Game Studio',
        domain: 'gamestudio.com',
        siteName: 'Puzzle Game',
        categories: ['IAB9'],
        isMobileApp: true,
        bundleId: 'com.gamestudio.puzzle',
        storeUrl: 'https://play.google.com/store/apps/details?id=com.gamestudio.puzzle'
      };

      expect(publisherInfo.isMobileApp).toBe(true);
      expect(publisherInfo.bundleId).toBe('com.gamestudio.puzzle');
      expect(publisherInfo.storeUrl).toContain('play.google.com');
    });
  });

  describe('DeviceInfo Interface', () => {
    it('should accept mobile device info', () => {
      const deviceInfo: DeviceInfo = {
        deviceType: 'mobile',
        os: 'iOS',
        browser: 'Safari',
        screenSize: { width: 375, height: 812 },
        supportsJavaScript: true
      };

      expect(deviceInfo.deviceType).toBe('mobile');
      expect(deviceInfo.screenSize?.width).toBe(375);
    });

    it('should accept desktop device info', () => {
      const deviceInfo: DeviceInfo = {
        deviceType: 'desktop',
        os: 'macOS',
        browser: 'Chrome',
        screenSize: { width: 2560, height: 1440 },
        supportsJavaScript: true
      };

      expect(deviceInfo.deviceType).toBe('desktop');
      expect(deviceInfo.os).toBe('macOS');
    });
  });

  describe('Type Safety Tests', () => {
    it('should enforce AdType enum values', () => {
      const adTypes: AdType[] = ['display', 'video', 'native', 'audio'];
      
      adTypes.forEach(type => {
        const config: SampleConfig = {
          requestType: type,
          includeOptionalFields: false,
          complexity: 'minimal'
        };
        
        expect(['display', 'video', 'native', 'audio']).toContain(config.requestType);
      });
    });

    it('should enforce SampleComplexity enum values', () => {
      const complexities: SampleComplexity[] = ['minimal', 'standard', 'comprehensive'];
      
      complexities.forEach(complexity => {
        const config: SampleConfig = {
          requestType: 'display',
          includeOptionalFields: false,
          complexity: complexity
        };
        
        expect(['minimal', 'standard', 'comprehensive']).toContain(config.complexity);
      });
    });
  });
});