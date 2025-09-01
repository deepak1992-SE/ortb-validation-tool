/**
 * Unit tests for ORTB data models
 * Tests type safety, structure validation, and interface compliance
 */

import { describe, it, expect } from 'vitest';
import type {
  ORTBRequest,
  Impression,
  Site,
  App,
  Device,
  User,
  Banner,
  Video,
  Audio,
  Native,
  Format,
  PMP,
  Deal,
  Publisher,
  Content,
  Producer,
  Geo,
  Data,
  Segment,
  Source,
  Regulations,
  Metric
} from '../ortb';

describe('ORTB Data Models', () => {
  describe('ORTBRequest Interface', () => {
    it('should accept a minimal valid ORTB request', () => {
      const minimalRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [{
          id: 'imp-1',
          banner: {
            w: 300,
            h: 250
          }
        }],
        at: 1
      };

      expect(minimalRequest.id).toBe('test-request-123');
      expect(minimalRequest.imp).toHaveLength(1);
      expect(minimalRequest.at).toBe(1);
    });

    it('should accept a comprehensive ORTB request with all optional fields', () => {
      const comprehensiveRequest: ORTBRequest = {
        id: 'comprehensive-request-456',
        imp: [{
          id: 'imp-1',
          banner: {
            w: 728,
            h: 90,
            format: [{ w: 728, h: 90 }]
          },
          bidfloor: 0.5,
          bidfloorcur: 'USD'
        }],
        site: {
          id: 'site-123',
          name: 'Test Site',
          domain: 'example.com',
          page: 'https://example.com/page'
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1',
          devicetype: 2
        },
        user: {
          id: 'user-789',
          yob: 1990,
          gender: 'M'
        },
        at: 1,
        tmax: 100,
        cur: ['USD'],
        test: 0
      };

      expect(comprehensiveRequest.id).toBe('comprehensive-request-456');
      expect(comprehensiveRequest.site?.domain).toBe('example.com');
      expect(comprehensiveRequest.device?.devicetype).toBe(2);
      expect(comprehensiveRequest.user?.gender).toBe('M');
    });

    it('should enforce required fields', () => {
      // TypeScript should catch missing required fields at compile time
      // This test verifies the structure is correct
      const request: ORTBRequest = {
        id: 'test-id',
        imp: [],
        at: 1
      };

      expect(request.id).toBeDefined();
      expect(Array.isArray(request.imp)).toBe(true);
      expect(typeof request.at).toBe('number');
    });
  });

  describe('Impression Interface', () => {
    it('should accept impression with banner', () => {
      const impression: Impression = {
        id: 'imp-banner-1',
        banner: {
          w: 300,
          h: 250,
          pos: 1
        },
        bidfloor: 1.0,
        bidfloorcur: 'USD'
      };

      expect(impression.id).toBe('imp-banner-1');
      expect(impression.banner?.w).toBe(300);
      expect(impression.banner?.h).toBe(250);
    });

    it('should accept impression with video', () => {
      const impression: Impression = {
        id: 'imp-video-1',
        video: {
          mimes: ['video/mp4', 'video/webm'],
          minduration: 5,
          maxduration: 30,
          w: 640,
          h: 480
        }
      };

      expect(impression.video?.mimes).toContain('video/mp4');
      expect(impression.video?.minduration).toBe(5);
    });

    it('should accept impression with audio', () => {
      const impression: Impression = {
        id: 'imp-audio-1',
        audio: {
          mimes: ['audio/mp3', 'audio/aac'],
          minduration: 10,
          maxduration: 60
        }
      };

      expect(impression.audio?.mimes).toContain('audio/mp3');
    });

    it('should accept impression with native', () => {
      const impression: Impression = {
        id: 'imp-native-1',
        native: {
          request: '{"ver":"1.2","layout":1}',
          ver: '1.2'
        }
      };

      expect(impression.native?.request).toBeDefined();
      expect(impression.native?.ver).toBe('1.2');
    });
  });

  describe('Site Interface', () => {
    it('should accept valid site object', () => {
      const site: Site = {
        id: 'site-123',
        name: 'Example Site',
        domain: 'example.com',
        cat: ['IAB1', 'IAB2'],
        page: 'https://example.com/article',
        ref: 'https://google.com',
        publisher: {
          id: 'pub-456',
          name: 'Example Publisher',
          domain: 'publisher.com'
        }
      };

      expect(site.domain).toBe('example.com');
      expect(site.cat).toContain('IAB1');
      expect(site.publisher?.name).toBe('Example Publisher');
    });
  });

  describe('App Interface', () => {
    it('should accept valid app object', () => {
      const app: App = {
        id: 'app-123',
        name: 'Example App',
        bundle: 'com.example.app',
        domain: 'example.com',
        storeurl: 'https://play.google.com/store/apps/details?id=com.example.app',
        cat: ['IAB1-1'],
        ver: '2.1.0',
        paid: 0,
        publisher: {
          id: 'pub-789',
          name: 'App Publisher'
        }
      };

      expect(app.bundle).toBe('com.example.app');
      expect(app.ver).toBe('2.1.0');
      expect(app.paid).toBe(0);
    });
  });

  describe('Device Interface', () => {
    it('should accept comprehensive device object', () => {
      const device: Device = {
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        geo: {
          lat: 37.7749,
          lon: -122.4194,
          country: 'USA',
          region: 'CA',
          city: 'San Francisco'
        },
        dnt: 0,
        lmt: 0,
        ip: '192.168.1.100',
        devicetype: 1,
        make: 'Apple',
        model: 'iPhone',
        os: 'iOS',
        osv: '14.0',
        w: 375,
        h: 812,
        js: 1,
        language: 'en'
      };

      expect(device.make).toBe('Apple');
      expect(device.model).toBe('iPhone');
      expect(device.geo?.city).toBe('San Francisco');
    });
  });

  describe('User Interface', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: 'user-123',
        buyeruid: 'buyer-456',
        yob: 1985,
        gender: 'F',
        keywords: 'sports,technology,travel',
        geo: {
          country: 'USA',
          region: 'NY'
        },
        data: [{
          id: 'data-provider-1',
          name: 'Demographics',
          segment: [{
            id: 'seg-1',
            name: 'Tech Enthusiast',
            value: 'high'
          }]
        }]
      };

      expect(user.yob).toBe(1985);
      expect(user.gender).toBe('F');
      expect(user.data?.[0]?.segment?.[0]?.name).toBe('Tech Enthusiast');
    });
  });

  describe('Banner Interface', () => {
    it('should accept banner with format array', () => {
      const banner: Banner = {
        format: [
          { w: 300, h: 250 },
          { w: 728, h: 90 },
          { w: 320, h: 50 }
        ],
        pos: 1,
        mimes: ['image/jpeg', 'image/png', 'image/gif'],
        topframe: 1,
        api: [3, 5]
      };

      expect(banner.format).toHaveLength(3);
      expect(banner.format?.[0]?.w).toBe(300);
      expect(banner.mimes).toContain('image/jpeg');
    });

    it('should accept banner with explicit dimensions', () => {
      const banner: Banner = {
        w: 300,
        h: 250,
        pos: 3,
        btype: [1, 3],
        battr: [1, 2, 3]
      };

      expect(banner.w).toBe(300);
      expect(banner.h).toBe(250);
      expect(banner.btype).toContain(1);
    });
  });

  describe('Video Interface', () => {
    it('should accept comprehensive video object', () => {
      const video: Video = {
        mimes: ['video/mp4', 'video/webm'],
        minduration: 5,
        maxduration: 30,
        protocols: [2, 3, 5, 6],
        w: 640,
        h: 480,
        startdelay: 0,
        placement: 1,
        linearity: 1,
        skip: 1,
        skipmin: 5,
        skipafter: 5,
        playbackmethod: [1, 2],
        api: [1, 2]
      };

      expect(video.mimes).toContain('video/mp4');
      expect(video.protocols).toContain(2);
      expect(video.skip).toBe(1);
    });
  });

  describe('PMP Interface', () => {
    it('should accept private marketplace with deals', () => {
      const pmp: PMP = {
        private_auction: 1,
        deals: [{
          id: 'deal-123',
          bidfloor: 2.5,
          bidfloorcur: 'USD',
          at: 1,
          wseat: ['seat1', 'seat2']
        }]
      };

      expect(pmp.private_auction).toBe(1);
      expect(pmp.deals?.[0]?.id).toBe('deal-123');
      expect(pmp.deals?.[0]?.bidfloor).toBe(2.5);
    });
  });

  describe('Type Safety Tests', () => {
    it('should enforce string types for IDs', () => {
      const request: ORTBRequest = {
        id: 'string-id', // Must be string
        imp: [{
          id: 'imp-string-id' // Must be string
        }],
        at: 1
      };

      expect(typeof request.id).toBe('string');
      expect(typeof request.imp[0].id).toBe('string');
    });

    it('should enforce number types for numeric fields', () => {
      const impression: Impression = {
        id: 'imp-1',
        bidfloor: 1.5, // Must be number
        instl: 0, // Must be number
        secure: 1 // Must be number
      };

      expect(typeof impression.bidfloor).toBe('number');
      expect(typeof impression.instl).toBe('number');
      expect(typeof impression.secure).toBe('number');
    });

    it('should enforce array types', () => {
      const request: ORTBRequest = {
        id: 'test',
        imp: [], // Must be array
        at: 1,
        cur: ['USD', 'EUR'], // Must be string array
        bcat: ['IAB1', 'IAB2'] // Must be string array
      };

      expect(Array.isArray(request.imp)).toBe(true);
      expect(Array.isArray(request.cur)).toBe(true);
      expect(Array.isArray(request.bcat)).toBe(true);
    });
  });

  describe('Extension Fields', () => {
    it('should accept extension fields in all objects', () => {
      const request: ORTBRequest = {
        id: 'ext-test',
        imp: [{
          id: 'imp-ext',
          ext: {
            customField: 'customValue',
            numericField: 42
          }
        }],
        at: 1,
        ext: {
          exchangeSpecific: true,
          customData: {
            nested: 'value'
          }
        }
      };

      expect(request.ext?.exchangeSpecific).toBe(true);
      expect(request.imp[0].ext?.customField).toBe('customValue');
    });
  });

  describe('Nested Object Validation', () => {
    it('should properly handle deeply nested structures', () => {
      const request: ORTBRequest = {
        id: 'nested-test',
        imp: [{
          id: 'imp-1',
          banner: {
            format: [{
              w: 300,
              h: 250,
              ext: {
                customFormat: true
              }
            }]
          }
        }],
        site: {
          publisher: {
            id: 'pub-1',
            ext: {
              publisherData: 'value'
            }
          },
          content: {
            producer: {
              id: 'producer-1',
              name: 'Content Producer'
            }
          }
        },
        at: 1
      };

      expect(request.imp[0].banner?.format?.[0]?.w).toBe(300);
      expect(request.site?.publisher?.id).toBe('pub-1');
      expect(request.site?.content?.producer?.name).toBe('Content Producer');
    });
  });
});