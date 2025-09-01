import { ORTBRequest, SampleConfig } from '../../models';

/**
 * Test data generator for integration tests
 * Provides official IAB samples, edge cases, and invalid samples for comprehensive testing
 */
export class TestDataGenerator {
  
  /**
   * Generate official IAB OpenRTB 2.6 compliant samples
   */
  static getIABCompliantSamples(): Record<string, ORTBRequest> {
    return {
      displayBanner: {
        id: 'iab-display-banner-001',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250,
            format: [
              { w: 300, h: 250 },
              { w: 320, h: 50 },
              { w: 728, h: 90 }
            ],
            btype: [1, 3],
            battr: [1, 2, 3, 4, 5, 6, 7, 12],
            pos: 1,
            mimes: ['image/jpeg', 'image/png', 'image/gif'],
            topframe: 1,
            expdir: [2, 4],
            api: [3, 5]
          },
          displaymanager: 'TestRenderer',
          displaymanagerver: '1.0',
          instl: 0,
          tagid: 'banner-tag-001',
          bidfloor: 0.5,
          bidfloorcur: 'USD',
          secure: 1,
          iframebuster: ['vendor1.com', 'vendor2.com'],
          exp: 3600
        }],
        site: {
          id: 'site-001',
          name: 'Test Publisher Site',
          domain: 'testpublisher.com',
          cat: ['IAB1', 'IAB2'],
          sectioncat: ['IAB1-1'],
          pagecat: ['IAB1-1'],
          page: 'https://testpublisher.com/article/123',
          ref: 'https://google.com/search?q=test',
          search: 'test search terms',
          mobile: 0,
          privacypolicy: 1,
          publisher: {
            id: 'pub-001',
            name: 'Test Publisher',
            cat: ['IAB1'],
            domain: 'testpublisher.com'
          },
          content: {
            id: 'content-001',
            episode: 1,
            title: 'Test Article Title',
            series: 'Test Series',
            season: 'Season 1',
            genre: 'News',
            url: 'https://testpublisher.com/article/123',
            cat: ['IAB1'],
            prodq: 1,
            context: 1,
            contentrating: 'PG',
            userrating: '4.5',
            qagmediarating: 1,
            keywords: 'test,article,news',
            livestream: 0,
            sourcerelationship: 1,
            len: 1800,
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
          ip: '192.168.1.100',
          ipv6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          devicetype: 2,
          make: 'Apple',
          model: 'MacBook Pro',
          os: 'macOS',
          osv: '11.4',
          hwv: 'MacBookPro18,1',
          h: 1080,
          w: 1920,
          ppi: 220,
          pxratio: 2.0,
          js: 1,
          geofetch: 1,
          flashver: '0',
          language: 'en-US',
          carrier: 'WiFi',
          connectiontype: 2,
          ifa: '12345678-1234-1234-1234-123456789012'
        },
        user: {
          id: 'user-001',
          buyeruid: 'buyer-user-001',
          yob: 1985,
          gender: 'M',
          keywords: 'technology,news,sports',
          customdata: 'segment:tech_enthusiast',
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
            id: 'data-provider-001',
            name: 'Test Data Provider',
            segment: [{
              id: 'segment-001',
              name: 'Tech Enthusiasts',
              value: 'high_value'
            }, {
              id: 'segment-002',
              name: 'News Readers',
              value: 'medium_value'
            }]
          }]
        },
        at: 1,
        tmax: 120,
        wseat: ['seat1', 'seat2'],
        bseat: ['blocked-seat'],
        allimps: 0,
        cur: ['USD'],
        wlang: ['en'],
        bcat: ['IAB25', 'IAB26'],
        badv: ['blocked-advertiser.com'],
        bapp: ['com.blocked.app'],
        source: {
          fd: 1,
          tid: 'transaction-001',
          pchain: 'chain-001',
          schain: {
            complete: 1,
            nodes: [{
              asi: 'exchange.com',
              sid: 'seller-001',
              hp: 1,
              rid: 'request-001'
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
          custom_field: 'test_value'
        }
      },

      videoInstream: {
        id: 'iab-video-instream-001',
        imp: [{
          id: '1',
          video: {
            mimes: ['video/mp4', 'video/webm', 'video/x-flv'],
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
              expdir: [2, 4],
              api: [3, 5],
              mimes: ['image/jpeg', 'image/png']
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
          id: 'video-site-001',
          name: 'Video Publisher',
          domain: 'videopublisher.com',
          cat: ['IAB1'],
          page: 'https://videopublisher.com/video/123',
          publisher: {
            id: 'video-pub-001',
            name: 'Video Publisher Inc'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.101',
          devicetype: 2,
          js: 1,
          connectiontype: 2
        },
        at: 1,
        tmax: 120,
        cur: ['USD']
      },

      nativeAd: {
        id: 'iab-native-001',
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
                },
                {
                  id: 4,
                  required: 0,
                  data: {
                    type: 12,
                    len: 25
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
          id: 'native-app-001',
          name: 'Test Native App',
          bundle: 'com.test.nativeapp',
          domain: 'nativeapp.com',
          cat: ['IAB1'],
          ver: '1.0.0',
          privacypolicy: 1,
          publisher: {
            id: 'native-pub-001',
            name: 'Native Publisher'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
          ip: '192.168.1.102',
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
      },

      audioAd: {
        id: 'iab-audio-001',
        imp: [{
          id: '1',
          audio: {
            mimes: ['audio/mp3', 'audio/aac', 'audio/ogg'],
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
          id: 'audio-site-001',
          name: 'Podcast Site',
          domain: 'podcastsite.com',
          cat: ['IAB1'],
          page: 'https://podcastsite.com/episode/123',
          publisher: {
            id: 'audio-pub-001',
            name: 'Podcast Publisher'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.103',
          devicetype: 2,
          js: 1,
          connectiontype: 2
        },
        at: 1,
        tmax: 120,
        cur: ['USD']
      }
    };
  }

  /**
   * Generate invalid samples for negative testing
   */
  static getInvalidSamples(): Record<string, any> {
    return {
      missingRequiredAt: {
        id: 'invalid-missing-at',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 }
        }]
        // Missing required 'at' field
      },

      missingRequiredImp: {
        id: 'invalid-missing-imp',
        at: 1
        // Missing required 'imp' field
      },

      duplicateImpressionIds: {
        id: 'invalid-duplicate-imp-ids',
        imp: [
          { id: '1', banner: { w: 300, h: 250 } },
          { id: '1', banner: { w: 728, h: 90 } } // Duplicate ID
        ],
        at: 1
      },

      siteAndAppBoth: {
        id: 'invalid-site-app-both',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        site: { id: 'site1', domain: 'example.com' },
        app: { id: 'app1', bundle: 'com.example.app' }, // Mutually exclusive
        at: 1
      },

      invalidBannerDimensions: {
        id: 'invalid-banner-dimensions',
        imp: [{
          id: '1',
          banner: { w: -300, h: 0 } // Invalid dimensions
        }],
        at: 1
      },

      invalidAuctionType: {
        id: 'invalid-auction-type',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        at: 99 // Invalid auction type (should be 1 or 2)
      },

      invalidCurrency: {
        id: 'invalid-currency',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 },
          bidfloorcur: 'INVALID' // Invalid currency code
        }],
        at: 1
      },

      invalidDeviceType: {
        id: 'invalid-device-type',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        device: {
          devicetype: 99 // Invalid device type
        },
        at: 1
      },

      malformedNativeRequest: {
        id: 'invalid-native-request',
        imp: [{
          id: '1',
          native: {
            request: 'invalid json string' // Should be valid JSON
          }
        }],
        at: 1
      },

      invalidVideoProtocols: {
        id: 'invalid-video-protocols',
        imp: [{
          id: '1',
          video: {
            mimes: ['video/mp4'],
            protocols: [99, 100] // Invalid protocol values
          }
        }],
        at: 1
      }
    };
  }

  /**
   * Generate edge case samples for boundary testing
   */
  static getEdgeCaseSamples(): Record<string, ORTBRequest> {
    return {
      maxImpressions: {
        id: 'edge-max-impressions',
        imp: Array(10).fill(null).map((_, i) => ({
          id: `${i + 1}`,
          banner: { w: 300, h: 250 },
          bidfloor: 0.1 * (i + 1)
        })),
        at: 1
      },

      minimalRequired: {
        id: 'edge-minimal',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        at: 1
      },

      unicodeContent: {
        id: 'edge-unicode-测试',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        site: {
          id: 'unicode-site',
          name: '测试网站 🌟 العربية русский',
          domain: 'test-中文.com',
          keywords: 'keyword1,测试关键词,العربية'
        },
        at: 1
      },

      preciseNumbers: {
        id: 'edge-precise-numbers',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 },
          bidfloor: 1.23456789012345,
          bidfloorcur: 'USD'
        }],
        device: {
          geo: {
            lat: 40.712812345678901,
            lon: -74.006098765432109,
            accuracy: 1
          }
        },
        at: 1
      },

      largeStringFields: {
        id: 'edge-large-strings',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        site: {
          id: 'large-site',
          name: 'A'.repeat(1000), // Very long site name
          domain: 'example.com',
          keywords: Array(100).fill('keyword').join(',') // Many keywords
        },
        device: {
          ua: 'Mozilla/5.0 ' + 'X'.repeat(500) // Very long user agent
        },
        at: 1
      },

      allOptionalFields: {
        id: 'edge-all-optional',
        imp: [{
          id: '1',
          metric: [{ type: 'viewability', value: 0.95 }],
          banner: {
            w: 300,
            h: 250,
            format: [{ w: 300, h: 250 }],
            btype: [1, 3],
            battr: [1, 2, 3],
            pos: 1,
            mimes: ['image/jpeg'],
            topframe: 1,
            expdir: [2, 4],
            api: [3, 5]
          },
          displaymanager: 'TestRenderer',
          displaymanagerver: '1.0',
          instl: 0,
          tagid: 'comprehensive-tag',
          bidfloor: 0.5,
          bidfloorcur: 'USD',
          clickbrowser: 0,
          secure: 1,
          iframebuster: ['vendor.com'],
          exp: 3600,
          pmp: {
            private_auction: 1,
            deals: [{
              id: 'deal-001',
              bidfloor: 1.0,
              bidfloorcur: 'USD',
              at: 1,
              wseat: ['seat1'],
              wadomain: ['advertiser.com']
            }]
          }
        }],
        site: {
          id: 'comprehensive-site',
          name: 'Comprehensive Test Site',
          domain: 'comprehensive.com',
          cat: ['IAB1', 'IAB2'],
          sectioncat: ['IAB1-1'],
          pagecat: ['IAB1-1'],
          page: 'https://comprehensive.com/page',
          ref: 'https://referrer.com',
          search: 'test search',
          mobile: 0,
          privacypolicy: 1,
          publisher: {
            id: 'comprehensive-pub',
            name: 'Comprehensive Publisher',
            cat: ['IAB1'],
            domain: 'comprehensive.com'
          },
          content: {
            id: 'comprehensive-content',
            title: 'Test Content',
            cat: ['IAB1'],
            keywords: 'test,content'
          }
        },
        device: {
          ua: 'Mozilla/5.0 (comprehensive test)',
          geo: {
            lat: 40.7128,
            lon: -74.0060,
            country: 'USA',
            region: 'NY',
            city: 'New York'
          },
          dnt: 0,
          lmt: 0,
          ip: '192.168.1.1',
          devicetype: 2,
          make: 'Test',
          model: 'Device',
          os: 'TestOS',
          osv: '1.0',
          js: 1,
          connectiontype: 2,
          language: 'en'
        },
        user: {
          id: 'comprehensive-user',
          yob: 1985,
          gender: 'M',
          keywords: 'test,user'
        },
        at: 1,
        tmax: 120,
        wseat: ['seat1'],
        allimps: 0,
        cur: ['USD'],
        wlang: ['en'],
        source: {
          fd: 1,
          tid: 'comprehensive-transaction'
        },
        regs: {
          coppa: 0
        }
      }
    };
  }

  /**
   * Generate sample configurations for testing sample generation
   */
  static getSampleConfigs(): Record<string, SampleConfig> {
    return {
      basicDisplay: {
        requestType: 'display',
        includeOptionalFields: false
      },

      fullDisplay: {
        requestType: 'display',
        includeOptionalFields: true
      },

      basicVideo: {
        requestType: 'video',
        includeOptionalFields: false
      },

      fullVideo: {
        requestType: 'video',
        includeOptionalFields: true
      },

      basicNative: {
        requestType: 'native',
        includeOptionalFields: false
      },

      fullNative: {
        requestType: 'native',
        includeOptionalFields: true
      },

      basicAudio: {
        requestType: 'audio',
        includeOptionalFields: false
      },

      fullAudio: {
        requestType: 'audio',
        includeOptionalFields: true
      },

      customDisplay: {
        requestType: 'display',
        includeOptionalFields: true,
        customFields: {
          site: {
            domain: 'custom-publisher.com',
            name: 'Custom Publisher Site'
          },
          device: {
            devicetype: 1, // Mobile
            make: 'Apple',
            model: 'iPhone'
          }
        }
      },

      mobileApp: {
        requestType: 'display',
        includeOptionalFields: true,
        customFields: {
          app: {
            bundle: 'com.test.app',
            name: 'Test Mobile App',
            ver: '1.0.0'
          },
          device: {
            devicetype: 1,
            os: 'iOS',
            osv: '14.6'
          }
        }
      }
    };
  }

  /**
   * Generate test scenarios for comprehensive workflow testing
   */
  static getTestScenarios(): Array<{
    name: string;
    description: string;
    data: ORTBRequest | any;
    expectedValid: boolean;
    expectedErrors?: string[];
  }> {
    const validSamples = this.getIABCompliantSamples();
    const invalidSamples = this.getInvalidSamples();
    const edgeCases = this.getEdgeCaseSamples();

    return [
      // Valid scenarios
      {
        name: 'IAB Display Banner',
        description: 'Official IAB compliant display banner request',
        data: validSamples.displayBanner,
        expectedValid: true
      },
      {
        name: 'IAB Video Instream',
        description: 'Official IAB compliant video instream request',
        data: validSamples.videoInstream,
        expectedValid: true
      },
      {
        name: 'IAB Native Ad',
        description: 'Official IAB compliant native ad request',
        data: validSamples.nativeAd,
        expectedValid: true
      },
      {
        name: 'IAB Audio Ad',
        description: 'Official IAB compliant audio ad request',
        data: validSamples.audioAd,
        expectedValid: true
      },

      // Edge case scenarios
      {
        name: 'Minimal Required Fields',
        description: 'Request with only required fields',
        data: edgeCases.minimalRequired,
        expectedValid: true
      },
      {
        name: 'Maximum Impressions',
        description: 'Request with maximum allowed impressions',
        data: edgeCases.maxImpressions,
        expectedValid: true
      },
      {
        name: 'Unicode Content',
        description: 'Request with unicode characters in various fields',
        data: edgeCases.unicodeContent,
        expectedValid: true
      },

      // Invalid scenarios
      {
        name: 'Missing Required AT',
        description: 'Request missing required auction type field',
        data: invalidSamples.missingRequiredAt,
        expectedValid: false,
        expectedErrors: ['REQUIRED_FIELD_MISSING']
      },
      {
        name: 'Duplicate Impression IDs',
        description: 'Request with duplicate impression IDs',
        data: invalidSamples.duplicateImpressionIds,
        expectedValid: false,
        expectedErrors: ['DUPLICATE_IMPRESSION_ID']
      },
      {
        name: 'Site and App Both Present',
        description: 'Request with both site and app (mutually exclusive)',
        data: invalidSamples.siteAndAppBoth,
        expectedValid: false,
        expectedErrors: ['MUTUALLY_EXCLUSIVE_FIELDS']
      },
      {
        name: 'Invalid Banner Dimensions',
        description: 'Request with invalid banner dimensions',
        data: invalidSamples.invalidBannerDimensions,
        expectedValid: false,
        expectedErrors: ['INVALID_FIELD_VALUE']
      }
    ];
  }
}