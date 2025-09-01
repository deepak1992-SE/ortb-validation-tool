/**
 * Basic Sample Request Generator
 * Implements core ORTB request generation with realistic example data
 */

import { 
  SampleConfig, 
  GeneratedSample, 
  SampleMetadata, 
  AdType 
} from '../models/sample';
import { ORTBRequest, Impression, Banner, Video, Audio, Native } from '../models/ortb';

export class SampleGenerator {
  private readonly generatorVersion = '1.0.0';
  private readonly specVersion = '2.6';

  /**
   * Generate a single ORTB request sample based on configuration
   */
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

  /**
   * Build the core ORTB request structure
   */
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

    return request;
  }

  /**
   * Generate impressions based on ad type and configuration
   */
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

  /**
   * Generate banner object for display ads
   */
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
      banner.btype = [1, 3]; // Block iframe and flash
      banner.battr = [1, 2, 3]; // Block audio auto-play, etc.
      banner.api = [3, 5]; // MRAID 1.0, MRAID 2.0
    }

    return banner;
  }

  /**
   * Generate video object for video ads
   */
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

  /**
   * Generate audio object for audio ads
   */
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

  /**
   * Generate native object for native ads
   */
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
      nativeRequest.assets.push({
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

  /**
   * Add optional fields to the request based on configuration
   */
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
          domain: config.publisherInfo.domain,
          storeurl: config.publisherInfo.storeUrl,
          cat: config.publisherInfo.categories || ['IAB1'],
          publisher: {
            id: 'pub-123',
            name: config.publisherInfo.name || 'Sample Publisher',
            domain: config.publisherInfo.domain
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
            domain: config.publisherInfo.domain
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
        request.device.geo = {
          country: config.geoInfo.country,
          region: config.geoInfo.region,
          city: config.geoInfo.city,
          lat: config.geoInfo.coordinates?.lat,
          lon: config.geoInfo.coordinates?.lon,
          type: 1
        };
      }
    }

    // Add user information
    if (config.userInfo) {
      request.user = {
        id: 'user-123',
        yob: this.getYearOfBirth(config.userInfo.ageRange),
        gender: config.userInfo.gender,
        keywords: config.userInfo.interests?.join(',')
      };
    }

    // Add blocked categories and advertisers for comprehensive samples
    if (config.complexity === 'comprehensive') {
      request.bcat = ['IAB25', 'IAB26']; // Adult content
      request.badv = ['competitor.com'];
      request.wlang = ['en', 'es'];
    }
  }

  /**
   * Generate realistic user agent string
   */
  private generateUserAgent(os?: string, browser?: string): string {
    const userAgents: Record<string, string> = {
      'Chrome-Windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Safari-macOS': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Chrome-Android': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      'Safari-iOS': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
    };

    const key = `${browser || 'Chrome'}-${os || 'Windows'}`;
    return userAgents[key] || userAgents['Chrome-Windows'];
  }

  /**
   * Map device type to ORTB device type code
   */
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

  /**
   * Get device make based on OS
   */
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

  /**
   * Convert age range to approximate year of birth
   */
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
   * Create sample metadata
   */
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
      autoGeneratedFields: this.getAutoGeneratedFields(config),
      customizedFields: Object.keys(config.customFields || {}),
      stats: {
        generationTime: endTime - startTime,
        fieldsGenerated: this.countFields(request),
        requiredFieldsIncluded: this.countRequiredFields(request),
        optionalFieldsIncluded: this.countOptionalFields(request, config),
        jsonSize: Buffer.byteLength(jsonString, 'utf8')
      }
    };
  }

  /**
   * Get list of auto-generated fields
   */
  private getAutoGeneratedFields(config: SampleConfig): string[] {
    const fields = ['id', 'imp', 'at'];
    
    if (config.testMode) fields.push('test');
    if (config.includeOptionalFields) {
      fields.push('tmax', 'cur');
    }
    
    return fields;
  }

  /**
   * Count total fields in the request
   */
  private countFields(obj: any, prefix = ''): number {
    let count = 0;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          count += this.countFields(obj[key], `${prefix}${key}.`);
        }
      }
    }
    
    return count;
  }

  /**
   * Count required fields in the request
   */
  private countRequiredFields(request: ORTBRequest): number {
    let count = 0;
    
    // Required top-level fields
    if (request.id) count++;
    if (request.imp && request.imp.length > 0) count++;
    if (request.at !== undefined) count++;
    
    // Required impression fields
    request.imp.forEach(imp => {
      if (imp.id) count++;
      if (imp.banner || imp.video || imp.audio || imp.native) count++;
    });
    
    return count;
  }

  /**
   * Count optional fields included in the request
   */
  private countOptionalFields(request: ORTBRequest, config: SampleConfig): number {
    const totalFields = this.countFields(request);
    const requiredFields = this.countRequiredFields(request);
    return totalFields - requiredFields;
  }

  /**
   * Generate unique sample ID
   */
  private generateSampleId(): string {
    return `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}