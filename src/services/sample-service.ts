/**
 * Sample Service Implementation
 * Implements sample generation with inline generator functionality
 */

import { SampleConfig, GeneratedSample, BatchSampleConfig, BatchSampleResult, SampleMetadata } from '../models/sample';
import { ORTBRequest, Impression, Banner, Video, Audio, Native } from '../models/ortb';
import { SampleConfigManager } from './sample-config-manager';
import { SampleTemplateManager } from './sample-template-manager';

export interface SampleService {
  generateSample(config: SampleConfig): Promise<GeneratedSample>;
  generateBatch(config: BatchSampleConfig): Promise<BatchSampleResult>;
  validateConfiguration(config: SampleConfig): any;
  getTemplatesByType(type: string): any[];
  getAvailableTemplates(): any[];
  generateFromTemplate(templateId: string, customFields?: any): Promise<GeneratedSample>;
  generateFromScenario(scenarioId: string): Promise<GeneratedSample>;
}

export class DefaultSampleService implements SampleService {
  private readonly generatorVersion = '1.0.0';
  private readonly specVersion = '2.6';
  private configManager: SampleConfigManager;
  private templateManager: SampleTemplateManager;

  constructor() {
    this.configManager = new SampleConfigManager();
    this.templateManager = new SampleTemplateManager();
  }

  /**
   * Generate sample from a predefined scenario
   */
  async generateFromScenario(scenarioId: string): Promise<GeneratedSample> {
    const scenario = this.configManager.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }
    
    return this.generateSample(scenario.config);
  }

  /**
   * Generate sample from a preset with optional variation
   */
  async generateFromPreset(presetId: string, variationName?: string): Promise<GeneratedSample> {
    const config = this.configManager.createConfigFromPreset(presetId, variationName);
    return this.generateSample(config);
  }

  /**
   * Generate samples for A/B testing
   */
  async generateABTestSamples(baseConfig: SampleConfig, testVariations: Record<string, any[]>): Promise<GeneratedSample[]> {
    const configs = this.configManager.generateABTestConfigs(baseConfig, testVariations);
    const samples: GeneratedSample[] = [];

    for (const config of configs) {
      const sample = await this.generateSample(config);
      samples.push(sample);
    }

    return samples;
  }

  /**
   * Generate sample from a template
   */
  async generateFromTemplate(templateId: string, customFields?: Record<string, any>): Promise<GeneratedSample> {
    const template = this.templateManager.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Generate the base request from template
    const request = this.templateManager.generateRequestFromTemplate(templateId, customFields);
    
    // Create metadata
    const sampleId = this.generateSampleId();
    const metadata = this.createMetadata(sampleId, Date.now(), template.config, request);

    return {
      request,
      config: template.config,
      template,
      metadata
    };
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates() {
    return this.templateManager.getAllTemplates();
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(requestType: 'display' | 'video' | 'native' | 'audio') {
    return this.templateManager.getTemplatesByType(requestType);
  }

  /**
   * Validate a template
   */
  validateTemplate(template: any) {
    return this.templateManager.validateTemplate(template);
  }

  /**
   * Validate a configuration before generation
   */
  validateConfiguration(config: SampleConfig): { isValid: boolean; errors: string[] } {
    return this.configManager.validateConfig(config);
  }

  async generateSample(config: SampleConfig): Promise<GeneratedSample> {
    const startTime = Date.now();
    const sampleId = this.generateSampleId();
    
    try {
      const request = this.buildORTBRequest(config);
      const metadata = this.createMetadata(sampleId, startTime, config, request);
      
      return {
        request,
        config,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to generate sample: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildORTBRequest(config: SampleConfig): ORTBRequest {
    const request: ORTBRequest = {
      id: this.generateRequestId(),
      imp: this.generateImpressions(config),
      at: 1, // First price auction
      test: config.testMode ? 1 : 0
    };

    // Add optional fields based on configuration
    if (config.includeOptionalFields || config.complexity !== 'minimal') {
      this.addOptionalFields(request, config);
    }

    // Apply custom field overrides last to ensure they take precedence
    if (config.customFields) {
      this.applyCustomFields(request, config.customFields);
    }

    return request;
  }

  private generateImpressions(config: SampleConfig): Impression[] {
    const impressions: Impression[] = [];
    const count = config.impressionCount || 1;

    for (let i = 0; i < count; i++) {
      const impression: Impression = {
        id: `imp-${i + 1}`,
        bidfloor: 0.5,
        bidfloorcur: 'USD'
      };

      // Add ad type specific object
      switch (config.requestType) {
        case 'display':
          impression.banner = this.generateBanner(config);
          break;
        case 'video':
          impression.video = this.generateVideo(config);
          break;
        case 'audio':
          impression.audio = this.generateAudio(config);
          break;
        case 'native':
          impression.native = this.generateNative(config);
          break;
      }

      // Add optional impression fields
      if (config.includeOptionalFields) {
        impression.tagid = `tag-${i + 1}`;
        impression.secure = 1;
        impression.instl = config.requestType === 'video' ? 1 : 0;
      }

      impressions.push(impression);
    }

    return impressions;
  }

  private generateBanner(config: SampleConfig): Banner {
    const banner: Banner = {
      w: 300,
      h: 250,
      pos: 1,
      mimes: ['image/jpeg', 'image/png', 'image/gif']
    };

    if (config.complexity === 'comprehensive') {
      banner.format = [
        { w: 300, h: 250 },
        { w: 728, h: 90 },
        { w: 320, h: 50 }
      ];
      banner.btype = [1, 3];
      banner.battr = [1, 2, 3];
      banner.api = [3, 5];
    }

    return banner;
  }

  private generateVideo(config: SampleConfig): Video {
    const video: Video = {
      mimes: ['video/mp4', 'video/webm'],
      minduration: 15,
      maxduration: 30,
      protocols: [2, 3, 5, 6],
      w: 640,
      h: 480,
      startdelay: 0,
      placement: 1,
      linearity: 1
    };

    if (config.complexity === 'comprehensive') {
      video.skip = 1;
      video.skipmin = 5;
      video.skipafter = 5;
      video.playbackmethod = [1, 2];
      video.delivery = [1, 2];
      video.api = [1, 2];
      video.battr = [1, 2, 3];
    }

    return video;
  }

  private generateAudio(config: SampleConfig): Audio {
    const audio: Audio = {
      mimes: ['audio/mp3', 'audio/aac'],
      minduration: 15,
      maxduration: 30,
      protocols: [2, 3, 5, 6],
      startdelay: 0
    };

    if (config.complexity === 'comprehensive') {
      audio.delivery = [1, 2];
      audio.api = [1, 2];
      audio.battr = [1, 2];
      audio.maxextended = 60;
      audio.feed = 1;
      audio.stitched = 1;
    }

    return audio;
  }

  private generateNative(config: SampleConfig): Native {
    const nativeRequest = {
      ver: '1.2',
      layout: 1,
      assets: [
        {
          id: 1,
          required: 1,
          title: {
            len: 90
          }
        },
        {
          id: 2,
          required: 1,
          img: {
            type: 3,
            w: 300,
            h: 250
          }
        }
      ]
    };

    if (config.complexity === 'comprehensive') {
      (nativeRequest.assets as any[]).push({
        id: 3,
        required: 0,
        data: {
          type: 2,
          len: 140
        }
      });
    }

    return {
      request: JSON.stringify(nativeRequest),
      ver: '1.2',
      api: [3, 5]
    };
  }

  private addOptionalFields(request: ORTBRequest, config: SampleConfig): void {
    // Add timing constraints
    request.tmax = 100;
    request.cur = ['USD'];

    // Add site or app based on publisher info
    if (config.publisherInfo) {
      if (config.publisherInfo.isMobileApp) {
        request.app = {
          id: 'app-123',
          name: config.publisherInfo.siteName || 'Sample App',
          bundle: config.publisherInfo.bundleId || 'com.example.app',
          ...(config.publisherInfo.domain && { domain: config.publisherInfo.domain }),
          ...(config.publisherInfo.storeUrl && { storeurl: config.publisherInfo.storeUrl }),
          cat: config.publisherInfo.categories || ['IAB1'],
          publisher: {
            id: 'pub-123',
            name: config.publisherInfo.name || 'Sample Publisher',
            domain: config.publisherInfo.domain || 'example.com'
          }
        };
      } else {
        request.site = {
          id: 'site-123',
          name: config.publisherInfo.siteName || 'Sample Site',
          domain: config.publisherInfo.domain || 'example.com',
          cat: config.publisherInfo.categories || ['IAB1'],
          page: 'https://example.com/page',
          publisher: {
            id: 'pub-123',
            name: config.publisherInfo.name || 'Sample Publisher',
            domain: config.publisherInfo.domain || 'example.com'
          }
        };
      }
    }

    // Add device information
    if (config.deviceInfo) {
      request.device = {
        ua: this.generateUserAgent(config.deviceInfo.os, config.deviceInfo.browser),
        devicetype: this.mapDeviceType(config.deviceInfo.deviceType),
        make: this.getDeviceMake(config.deviceInfo.os),
        model: 'Sample Device',
        os: config.deviceInfo.os || 'Unknown',
        osv: '1.0',
        w: config.deviceInfo.screenSize?.width || 1920,
        h: config.deviceInfo.screenSize?.height || 1080,
        js: config.deviceInfo.supportsJavaScript ? 1 : 0,
        language: 'en',
        ip: '192.168.1.1'
      };

      // Add geo information if provided
      if (config.geoInfo) {
        const geo: any = { type: 1 };
        if (config.geoInfo.country) geo.country = config.geoInfo.country;
        if (config.geoInfo.region) geo.region = config.geoInfo.region;
        if (config.geoInfo.city) geo.city = config.geoInfo.city;
        if (config.geoInfo.coordinates?.lat != null) geo.lat = config.geoInfo.coordinates.lat;
        if (config.geoInfo.coordinates?.lon != null) geo.lon = config.geoInfo.coordinates.lon;
        request.device.geo = geo;
      }
    }

    // Add user information
    if (config.userInfo) {
      const user: any = {
        id: 'user-123',
        yob: this.getYearOfBirth(config.userInfo.ageRange)
      };
      if (config.userInfo.gender) user.gender = config.userInfo.gender;
      if (config.userInfo.interests) user.keywords = config.userInfo.interests.join(',');
      request.user = user;
    }

    // Add blocked categories and advertisers for comprehensive samples
    if (config.complexity === 'comprehensive') {
      request.bcat = ['IAB25', 'IAB26'];
      request.badv = ['competitor.com'];
      request.wlang = ['en', 'es'];
    }


  }

  private generateUserAgent(os?: string, browser?: string): string {
    const userAgents: Record<string, string> = {
      'Chrome-Windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Safari-macOS': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Chrome-Android': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      'Safari-iOS': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
    };

    const key = `${browser || 'Chrome'}-${os || 'Windows'}`;
    return userAgents[key] || userAgents['Chrome-Windows'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  private mapDeviceType(deviceType?: string): number {
    const mapping: Record<string, number> = {
      'mobile': 1,
      'tablet': 5,
      'desktop': 2,
      'tv': 3,
      'other': 0
    };
    return mapping[deviceType || 'desktop'] || 2;
  }

  private getDeviceMake(os?: string): string {
    const mapping: Record<string, string> = {
      'iOS': 'Apple',
      'Android': 'Samsung',
      'Windows': 'Microsoft',
      'macOS': 'Apple',
      'Linux': 'Generic'
    };
    return mapping[os || 'Windows'] || 'Generic';
  }

  private getYearOfBirth(ageRange?: string): number {
    const currentYear = new Date().getFullYear();
    const mapping: Record<string, number> = {
      'under18': currentYear - 16,
      '18-24': currentYear - 21,
      '25-34': currentYear - 29,
      '35-44': currentYear - 39,
      '45-54': currentYear - 49,
      '55-64': currentYear - 59,
      'over65': currentYear - 70
    };
    return mapping[ageRange || '25-34'] || currentYear - 30;
  }

  /**
   * Apply custom field values to the request using dot notation paths
   */
  private applyCustomFields(request: ORTBRequest, customFields: Record<string, any>): void {
    for (const [fieldPath, value] of Object.entries(customFields)) {
      this.setNestedValue(request, fieldPath, value);
    }
  }

  /**
   * Set a nested value in an object using dot notation path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      
      // Handle array indices like "imp.0" or "cur.0"
      if (/^\d+$/.test(key)) {
        const index = parseInt(key, 10);
        if (!Array.isArray(current)) {
          // If current is not an array but we're trying to access by index, skip
          return;
        }
        if (!current[index]) {
          current[index] = {};
        }
        current = current[index];
      } else {
        if (!current[key]) {
          // Check if the next key is a number, if so create an array
          const nextKey = keys[i + 1];
          if (nextKey && /^\d+$/.test(nextKey)) {
            current[key] = [];
          } else {
            current[key] = {};
          }
        }
        current = current[key];
      }
    }

    const finalKey = keys[keys.length - 1];
    if (!finalKey) return;
    
    // Handle array indices in final key
    if (/^\d+$/.test(finalKey)) {
      const index = parseInt(finalKey, 10);
      if (Array.isArray(current)) {
        current[index] = value;
      }
    } else {
      current[finalKey] = value;
    }
  }

  private createMetadata(
    sampleId: string, 
    startTime: number, 
    config: SampleConfig, 
    request: ORTBRequest
  ): SampleMetadata {
    const endTime = Date.now();
    const jsonString = JSON.stringify(request);
    
    return {
      sampleId,
      generatedAt: new Date(),
      generatorVersion: this.generatorVersion,
      specVersion: this.specVersion,
      autoGeneratedFields: ['id', 'imp', 'at'],
      customizedFields: Object.keys(config.customFields || {}),
      stats: {
        generationTime: endTime - startTime,
        fieldsGenerated: this.countFields(request),
        requiredFieldsIncluded: 3, // id, imp, at
        optionalFieldsIncluded: this.countFields(request) - 3,
        jsonSize: Buffer.byteLength(jsonString, 'utf8')
      }
    };
  }

  private countFields(obj: any): number {
    let count = 0;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          count += this.countFields(obj[key]);
        }
      }
    }
    
    return count;
  }

  private generateSampleId(): string {
    return `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async generateBatch(config: BatchSampleConfig): Promise<BatchSampleResult> {
    const samples: GeneratedSample[] = [];
    const startTime = Date.now();
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < config.count; i++) {
      try {
        const sampleConfig = this.createVariedConfig(config.baseConfig, i, config);
        const sample = await this.generateSample(sampleConfig);
        samples.push(sample);
      } catch (error) {
        // Continue with other samples even if one fails
        console.warn(`Failed to generate sample ${i + 1}:`, error);
      }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return {
      samples,
      config,
      metadata: {
        batchId,
        startedAt: new Date(startTime),
        completedAt: new Date(endTime),
        totalTime,
        generatorVersion: '1.0.0'
      },
      summary: {
        totalRequested: config.count,
        successfullyGenerated: samples.length,
        failedGeneration: config.count - samples.length,
        averageGenerationTime: samples.length > 0 ? totalTime / samples.length : 0,
        requestTypeDistribution: this.calculateRequestTypeDistribution(samples),
        totalSize: this.calculateTotalSize(samples)
      }
    };
  }

  private createVariedConfig(baseConfig: SampleConfig, index: number, batchConfig: BatchSampleConfig): SampleConfig {
    if (!batchConfig.varyConfigurations || !batchConfig.variations) {
      return { ...baseConfig };
    }

    const variedConfig = { ...baseConfig };

    // Apply variations based on configuration
    if (batchConfig.variations.varyRequestTypes) {
      const types: Array<'display' | 'video' | 'native' | 'audio'> = ['display', 'video', 'native', 'audio'];
      variedConfig.requestType = types[index % types.length] || 'display';
    } else if (!variedConfig.requestType) {
      variedConfig.requestType = 'display'; // Set default if not defined
    }

    return variedConfig;
  }

  private calculateRequestTypeDistribution(samples: GeneratedSample[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    samples.forEach(sample => {
      const type = sample.config.requestType;
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
  }

  private calculateTotalSize(samples: GeneratedSample[]): number {
    return samples.reduce((total, sample) => {
      return total + sample.metadata.stats.jsonSize;
    }, 0);
  }
}