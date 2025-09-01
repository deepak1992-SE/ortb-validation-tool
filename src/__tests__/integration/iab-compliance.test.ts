import { describe, it, expect, beforeAll } from 'vitest';
import { ORTBValidationService } from '../../services/validation-service';
import { ORTBSampleService } from '../../services/sample-service';
import { ORTBRequest } from '../../models';

describe('IAB OpenRTB 2.6 Compliance Tests', () => {
  let validationService: ORTBValidationService;
  let sampleService: ORTBSampleService;

  beforeAll(() => {
    validationService = new ORTBValidationService();
    sampleService = new ORTBSampleService();
  });

  describe('Official IAB Sample Validation', () => {
    it('should validate official IAB display ad request sample', async () => {
      const iabDisplaySample: ORTBRequest = {
        id: 'iab-sample-display-001',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250,
            format: [
              { w: 300, h: 250 },
              { w: 320, h: 50 }
            ],
            btype: [1, 3],
            battr: [1, 2, 3, 4, 5, 6, 7, 12]
          },
          displaymanager: 'MyRenderer',
          displaymanagerver: '1.0',
          instl: 0,
          tagid: 'tag-001',
          bidfloor: 0.5,
          bidfloorcur: 'USD',
          secure: 1
        }],
        site: {
          id: 'site123',
          name: 'Example Site',
          domain: 'example.com',
          cat: ['IAB1'],
          sectioncat: ['IAB1-1'],
          pagecat: ['IAB1-1'],
          page: 'https://example.com/page1',
          ref: 'https://referrer.com',
          search: 'keyword search',
          mobile: 0,
          privacypolicy: 1,
          publisher: {
            id: 'pub123',
            name: 'Example Publisher',
            cat: ['IAB1'],
            domain: 'publisher.com'
          },
          content: {
            id: 'content123',
            episode: 1,
            title: 'Example Content',
            series: 'Example Series',
            season: 'Season 1',
            artist: 'Artist Name',
            genre: 'Drama',
            album: 'Album Name',
            isrc: 'ISRC123',
            producer: {
              id: 'producer123',
              name: 'Example Producer'
            },
            url: 'https://example.com/content',
            cat: ['IAB1'],
            prodq: 1,
            context: 1,
            contentrating: 'PG-13',
            userrating: '4.5',
            qagmediarating: 1,
            keywords: 'keyword1,keyword2',
            livestream: 0,
            sourcerelationship: 1,
            len: 3600,
            language: 'en'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          geo: {
            lat: 40.7128,
            lon: -74.0060,
            type: 1,
            accuracy: 100,
            lastfix: 1625097600,
            ipservice: 1,
            country: 'USA',
            region: 'NY',
            regionfips104: 'US36',
            metro: '501',
            city: 'New York',
            zip: '10001'
          },
          dnt: 0,
          lmt: 0,
          ip: '192.168.1.1',
          ipv6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          devicetype: 2,
          make: 'Apple',
          model: 'iPhone',
          os: 'iOS',
          osv: '14.6',
          hwv: 'iPhone12,1',
          h: 812,
          w: 375,
          ppi: 326,
          pxratio: 3.0,
          js: 1,
          geofetch: 1,
          flashver: '0',
          language: 'en',
          carrier: 'Verizon',
          mccmnc: '310-004',
          connectiontype: 2,
          ifa: '12345678-1234-1234-1234-123456789012',
          didsha1: 'sha1hash',
          didmd5: 'md5hash',
          dpidsha1: 'dpidsha1hash',
          dpidmd5: 'dpidmd5hash',
          macsha1: 'macsha1hash',
          macmd5: 'macmd5hash'
        },
        user: {
          id: 'user123',
          buyeruid: 'buyer123',
          yob: 1985,
          gender: 'M',
          keywords: 'sports,technology',
          customdata: 'custom user data',
          geo: {
            lat: 40.7128,
            lon: -74.0060,
            type: 1,
            accuracy: 100,
            country: 'USA',
            region: 'NY',
            city: 'New York',
            zip: '10001'
          },
          data: [{
            id: 'data123',
            name: 'Example Data Provider',
            segment: [{
              id: 'segment123',
              name: 'Tech Enthusiasts',
              value: 'high_value'
            }]
          }]
        },
        at: 1,
        tmax: 120,
        wseat: ['seat1', 'seat2'],
        bseat: ['blockedseat1'],
        allimps: 0,
        cur: ['USD'],
        wlang: ['en'],
        bcat: ['IAB25', 'IAB26'],
        badv: ['blocked-advertiser.com'],
        bapp: ['com.blocked.app'],
        source: {
          fd: 1,
          tid: 'transaction123',
          pchain: 'chain123',
          schain: {
            complete: 1,
            nodes: [{
              asi: 'exchange.com',
              sid: 'seller123',
              hp: 1,
              rid: 'request123'
            }]
          }
        },
        regs: {
          coppa: 0,
          ext: {
            gdpr: 1,
            us_privacy: '1YNN'
          }
        },
        ext: {
          custom_field: 'custom_value'
        }
      };

      const result = await validationService.validateRequest(iabDisplaySample);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('FULLY_COMPLIANT');
    });

    it('should validate official IAB video ad request sample', async () => {
      const iabVideoSample: ORTBRequest = {
        id: 'iab-sample-video-001',
        imp: [{
          id: '1',
          video: {
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
            skipafter: 10,
            sequence: 1,
            battr: [1, 2, 3],
            maxextended: 30,
            minbitrate: 300,
            maxbitrate: 1500,
            boxingallowed: 1,
            playbackmethod: [1, 2],
            playbackend: 1,
            delivery: [2, 3],
            pos: 1,
            companionad: [{
              id: '1',
              w: 300,
              h: 250,
              pos: 1,
              btype: [1, 3],
              battr: [1, 2, 3],
              expdir: [2, 4]
            }],
            api: [1, 2, 5],
            companiontype: [1, 2, 3]
          },
          displaymanager: 'VideoRenderer',
          displaymanagerver: '2.0',
          instl: 0,
          tagid: 'video-tag-001',
          bidfloor: 2.0,
          bidfloorcur: 'USD',
          secure: 1
        }],
        site: {
          id: 'video-site123',
          name: 'Video Site',
          domain: 'videosite.com',
          cat: ['IAB1'],
          page: 'https://videosite.com/video-page',
          publisher: {
            id: 'video-pub123',
            name: 'Video Publisher'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1',
          devicetype: 2,
          js: 1,
          connectiontype: 2
        },
        at: 1,
        tmax: 120,
        cur: ['USD']
      };

      const result = await validationService.validateRequest(iabVideoSample);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('FULLY_COMPLIANT');
    });

    it('should validate official IAB native ad request sample', async () => {
      const iabNativeSample: ORTBRequest = {
        id: 'iab-sample-native-001',
        imp: [{
          id: '1',
          native: {
            request: JSON.stringify({
              ver: '1.2',
              context: 1,
              contextsubtype: 11,
              plcmttype: 1,
              plcmtcnt: 1,
              seq: 0,
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
                    h: 250,
                    mimes: ['image/jpeg', 'image/png']
                  }
                },
                {
                  id: 3,
                  required: 0,
                  data: {
                    type: 2,
                    len: 140
                  }
                }
              ]
            }),
            ver: '1.2',
            api: [3, 5],
            battr: [1, 2, 3]
          },
          displaymanager: 'NativeRenderer',
          displaymanagerver: '1.5',
          instl: 0,
          tagid: 'native-tag-001',
          bidfloor: 1.0,
          bidfloorcur: 'USD',
          secure: 1
        }],
        app: {
          id: 'native-app123',
          name: 'Native App',
          bundle: 'com.example.nativeapp',
          domain: 'nativeapp.com',
          cat: ['IAB1'],
          ver: '1.0',
          privacypolicy: 1,
          publisher: {
            id: 'native-pub123',
            name: 'Native Publisher'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
          ip: '192.168.1.1',
          devicetype: 1,
          make: 'Apple',
          model: 'iPhone',
          os: 'iOS',
          osv: '14.6',
          js: 1,
          connectiontype: 2,
          ifa: '12345678-1234-1234-1234-123456789012'
        },
        at: 1,
        tmax: 120,
        cur: ['USD']
      };

      const result = await validationService.validateRequest(iabNativeSample);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('FULLY_COMPLIANT');
    });

    it('should validate official IAB audio ad request sample', async () => {
      const iabAudioSample: ORTBRequest = {
        id: 'iab-sample-audio-001',
        imp: [{
          id: '1',
          audio: {
            mimes: ['audio/mp3', 'audio/aac'],
            minduration: 10,
            maxduration: 60,
            protocols: [2, 3, 5, 6],
            startdelay: 0,
            sequence: 1,
            battr: [1, 2],
            maxextended: 30,
            minbitrate: 64,
            maxbitrate: 320,
            delivery: [2, 3],
            companionad: [{
              id: '1',
              w: 300,
              h: 250,
              pos: 1,
              btype: [1, 3],
              battr: [1, 2, 3]
            }],
            api: [1, 2],
            companiontype: [1, 2],
            maxseq: 1,
            feed: 1,
            stitched: 1,
            nvol: 1
          },
          displaymanager: 'AudioRenderer',
          displaymanagerver: '1.0',
          instl: 0,
          tagid: 'audio-tag-001',
          bidfloor: 0.8,
          bidfloorcur: 'USD',
          secure: 1
        }],
        site: {
          id: 'audio-site123',
          name: 'Audio Site',
          domain: 'audiosite.com',
          cat: ['IAB1'],
          page: 'https://audiosite.com/podcast',
          publisher: {
            id: 'audio-pub123',
            name: 'Audio Publisher'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1',
          devicetype: 2,
          js: 1,
          connectiontype: 2
        },
        at: 1,
        tmax: 120,
        cur: ['USD']
      };

      const result = await validationService.validateRequest(iabAudioSample);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('FULLY_COMPLIANT');
    });
  });

  describe('Generated Sample Compliance Validation', () => {
    it('should ensure all generated display samples are IAB compliant', async () => {
      const displaySample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: true
      });

      const result = await validationService.validateRequest(displaySample);
      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBeOneOf(['FULLY_COMPLIANT', 'MOSTLY_COMPLIANT']);
      
      // Verify required fields are present
      expect(displaySample.id).toBeDefined();
      expect(displaySample.imp).toBeDefined();
      expect(displaySample.imp.length).toBeGreaterThan(0);
      expect(displaySample.at).toBeDefined();
      
      // Verify impression has required fields
      const imp = displaySample.imp[0];
      expect(imp.id).toBeDefined();
      expect(imp.banner).toBeDefined();
      expect(imp.banner!.w).toBeGreaterThan(0);
      expect(imp.banner!.h).toBeGreaterThan(0);
    });

    it('should ensure all generated video samples are IAB compliant', async () => {
      const videoSample = await sampleService.generateSample({
        requestType: 'video',
        includeOptionalFields: true
      });

      const result = await validationService.validateRequest(videoSample);
      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBeOneOf(['FULLY_COMPLIANT', 'MOSTLY_COMPLIANT']);
      
      // Verify video-specific fields
      const imp = videoSample.imp[0];
      expect(imp.video).toBeDefined();
      expect(imp.video!.mimes).toBeDefined();
      expect(imp.video!.mimes!.length).toBeGreaterThan(0);
      expect(imp.video!.minduration).toBeGreaterThan(0);
      expect(imp.video!.maxduration).toBeGreaterThan(0);
      expect(imp.video!.protocols).toBeDefined();
    });

    it('should ensure all generated native samples are IAB compliant', async () => {
      const nativeSample = await sampleService.generateSample({
        requestType: 'native',
        includeOptionalFields: true
      });

      const result = await validationService.validateRequest(nativeSample);
      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBeOneOf(['FULLY_COMPLIANT', 'MOSTLY_COMPLIANT']);
      
      // Verify native-specific fields
      const imp = nativeSample.imp[0];
      expect(imp.native).toBeDefined();
      expect(imp.native!.request).toBeDefined();
      
      // Parse and validate native request
      const nativeRequest = JSON.parse(imp.native!.request);
      expect(nativeRequest.assets).toBeDefined();
      expect(nativeRequest.assets.length).toBeGreaterThan(0);
    });

    it('should ensure all generated audio samples are IAB compliant', async () => {
      const audioSample = await sampleService.generateSample({
        requestType: 'audio',
        includeOptionalFields: true
      });

      const result = await validationService.validateRequest(audioSample);
      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBeOneOf(['FULLY_COMPLIANT', 'MOSTLY_COMPLIANT']);
      
      // Verify audio-specific fields
      const imp = audioSample.imp[0];
      expect(imp.audio).toBeDefined();
      expect(imp.audio!.mimes).toBeDefined();
      expect(imp.audio!.mimes!.length).toBeGreaterThan(0);
      expect(imp.audio!.minduration).toBeGreaterThan(0);
      expect(imp.audio!.maxduration).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Compliance Tests', () => {
    it('should handle requests with minimal required fields', async () => {
      const minimalRequest: ORTBRequest = {
        id: 'minimal-001',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250
          }
        }],
        at: 1
      };

      const result = await validationService.validateRequest(minimalRequest);
      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBeOneOf(['BASIC_COMPLIANT', 'MOSTLY_COMPLIANT']);
    });

    it('should handle requests with maximum field population', async () => {
      const maximalSample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: true,
        includeExtensions: true,
        populateAllFields: true
      });

      const result = await validationService.validateRequest(maximalSample);
      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBe('FULLY_COMPLIANT');
      
      // Verify comprehensive field population
      expect(maximalSample.site || maximalSample.app).toBeDefined();
      expect(maximalSample.device).toBeDefined();
      expect(maximalSample.user).toBeDefined();
      expect(maximalSample.source).toBeDefined();
      expect(maximalSample.regs).toBeDefined();
    });

    it('should validate cross-field dependencies correctly', async () => {
      // Test site vs app mutual exclusivity
      const invalidRequest: any = {
        id: 'invalid-site-app',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        site: { id: 'site123', domain: 'example.com' },
        app: { id: 'app123', bundle: 'com.example.app' }, // Should not have both
        at: 1
      };

      const result = await validationService.validateRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MUTUALLY_EXCLUSIVE_FIELDS')).toBe(true);
    });
  });
});