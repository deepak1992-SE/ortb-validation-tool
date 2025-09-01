/**
 * Best Practices Documentation System
 * Provides comprehensive best practices and examples for ORTB implementation
 */

export interface BestPractice {
  /** Practice ID */
  id: string;
  /** Practice title */
  title: string;
  /** Practice category */
  category: BestPracticeCategory;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Short description */
  description: string;
  /** Detailed explanation */
  explanation: string;
  /** Why this practice is important */
  rationale: string;
  /** Code examples */
  examples: PracticeExample[];
  /** Common mistakes to avoid */
  commonMistakes: CommonMistake[];
  /** Related fields */
  relatedFields: string[];
  /** Impact on performance */
  performanceImpact: PerformanceImpact;
  /** Implementation difficulty */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Tags for categorization */
  tags: string[];
}

export type BestPracticeCategory = 
  | 'request-structure'
  | 'field-optimization'
  | 'performance'
  | 'security'
  | 'compliance'
  | 'debugging'
  | 'integration'
  | 'mobile-optimization'
  | 'video-advertising'
  | 'native-advertising';

export interface PracticeExample {
  /** Example title */
  title: string;
  /** Example description */
  description: string;
  /** Good example code */
  goodExample: any;
  /** Bad example code (if applicable) */
  badExample?: any;
  /** Explanation of the difference */
  explanation: string;
  /** Context when this example applies */
  context: string;
}

export interface CommonMistake {
  /** Mistake description */
  mistake: string;
  /** Why it's problematic */
  problem: string;
  /** How to fix it */
  solution: string;
  /** Example of the mistake */
  example?: any;
}

export interface PerformanceImpact {
  /** Impact on fill rates */
  fillRate: 'positive' | 'negative' | 'neutral';
  /** Impact on bid prices */
  bidPrices: 'positive' | 'negative' | 'neutral';
  /** Impact on latency */
  latency: 'positive' | 'negative' | 'neutral';
  /** Quantified impact description */
  description: string;
}

export interface BestPracticeGuide {
  /** Guide ID */
  id: string;
  /** Guide title */
  title: string;
  /** Guide description */
  description: string;
  /** Target audience */
  audience: 'beginner' | 'intermediate' | 'advanced' | 'all';
  /** Estimated reading time */
  readingTime: number;
  /** Practices included in this guide */
  practices: BestPractice[];
  /** Prerequisites */
  prerequisites: string[];
  /** Learning objectives */
  objectives: string[];
}

export class BestPracticesSystem {
  private practices: Map<string, BestPractice> = new Map();
  private guides: Map<string, BestPracticeGuide> = new Map();
  private categoryIndex: Map<BestPracticeCategory, string[]> = new Map();
  private tagIndex: Map<string, string[]> = new Map();

  constructor() {
    this.initializeBestPractices();
    this.initializeGuides();
    this.buildIndexes();
  }

  /**
   * Get best practice by ID
   */
  getBestPractice(id: string): BestPractice | null {
    return this.practices.get(id) || null;
  }

  /**
   * Get best practices by category
   */
  getBestPracticesByCategory(category: BestPracticeCategory): BestPractice[] {
    const practiceIds = this.categoryIndex.get(category) || [];
    return practiceIds
      .map(id => this.practices.get(id)!)
      .sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Get best practices by tag
   */
  getBestPracticesByTag(tag: string): BestPractice[] {
    const practiceIds = this.tagIndex.get(tag) || [];
    return practiceIds
      .map(id => this.practices.get(id)!)
      .sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Search best practices
   */
  searchBestPractices(query: string): BestPractice[] {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const results = new Map<string, number>();

    this.practices.forEach((practice, id) => {
      let score = 0;
      const searchableText = [
        practice.title,
        practice.description,
        practice.explanation,
        ...practice.tags,
        ...practice.relatedFields
      ].join(' ').toLowerCase();

      searchTerms.forEach(term => {
        const matches = (searchableText.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });

      if (score > 0) {
        results.set(id, score);
      }
    });

    return Array.from(results.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([id]) => this.practices.get(id)!)
      .slice(0, 10);
  }

  /**
   * Get best practices for specific field
   */
  getBestPracticesForField(fieldPath: string): BestPractice[] {
    return Array.from(this.practices.values())
      .filter(practice => practice.relatedFields.includes(fieldPath))
      .sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Get guide by ID
   */
  getGuide(id: string): BestPracticeGuide | null {
    return this.guides.get(id) || null;
  }

  /**
   * Get all guides
   */
  getAllGuides(): BestPracticeGuide[] {
    return Array.from(this.guides.values())
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get guides by audience
   */
  getGuidesByAudience(audience: BestPracticeGuide['audience']): BestPracticeGuide[] {
    return Array.from(this.guides.values())
      .filter(guide => guide.audience === audience || guide.audience === 'all')
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get quick tips for common scenarios
   */
  getQuickTips(scenario: 'first-request' | 'debugging' | 'optimization' | 'mobile' | 'video'): string[] {
    const tipMap = {
      'first-request': [
        'Start with required fields: id, imp array, and at (auction type)',
        'Use standard banner sizes like 300x250 for better fill rates',
        'Include either site or app object, never both',
        'Set a reasonable timeout (tmax) of 100-300ms',
        'Test with a simple single impression first'
      ],
      'debugging': [
        'Check that all impression IDs are unique within the request',
        'Verify JSON structure is valid and properly nested',
        'Ensure numeric fields contain numbers, not strings',
        'Use the validation tool to identify specific issues',
        'Check server logs for detailed error messages'
      ],
      'optimization': [
        'Add device information for better targeting',
        'Include geo data when available',
        'Use floor prices to improve yield',
        'Specify multiple banner sizes when flexible',
        'Add user segments for better personalization'
      ],
      'mobile': [
        'Use mobile-optimized banner sizes (320x50, 300x250)',
        'Include app object with bundle ID and store URL',
        'Add device type and connection type information',
        'Consider location data for mobile users',
        'Test on actual mobile devices'
      ],
      'video': [
        'Specify video duration constraints (minduration, maxduration)',
        'Include supported MIME types and protocols',
        'Set appropriate video placement (in-stream, out-stream)',
        'Define player size constraints',
        'Consider bandwidth limitations for mobile video'
      ]
    };

    return tipMap[scenario] || [];
  }

  /**
   * Initialize best practices
   */
  private initializeBestPractices(): void {
    // Request Structure Best Practices
    this.addBestPractice({
      id: 'unique-request-ids',
      title: 'Use Unique Request IDs',
      category: 'request-structure',
      priority: 'critical',
      description: 'Every bid request must have a globally unique identifier',
      explanation: 'Request IDs are used to correlate bid responses with requests and for debugging. They must be unique across all requests from your system to prevent conflicts and ensure proper tracking.',
      rationale: 'Duplicate request IDs can cause bid responses to be rejected or mismatched, leading to lost revenue and debugging difficulties.',
      examples: [
        {
          title: 'Good Request ID Format',
          description: 'Use a consistent format with timestamp and random component',
          goodExample: {
            id: 'req_1640995200_abc123def456'
          },
          explanation: 'This format includes a timestamp and random component, ensuring uniqueness',
          context: 'Use this format for production systems'
        },
        {
          title: 'UUID-based Request ID',
          description: 'Use UUID for guaranteed uniqueness',
          goodExample: {
            id: 'req_550e8400-e29b-41d4-a716-446655440000'
          },
          badExample: {
            id: 'request1'
          },
          explanation: 'UUIDs guarantee uniqueness, while simple sequential IDs can cause conflicts',
          context: 'Use UUIDs when you need absolute guarantee of uniqueness'
        }
      ],
      commonMistakes: [
        {
          mistake: 'Using sequential numbers like "1", "2", "3"',
          problem: 'Can cause conflicts when multiple servers generate requests',
          solution: 'Include server ID, timestamp, or use UUIDs',
          example: { id: '1' }
        },
        {
          mistake: 'Reusing request IDs',
          problem: 'Can cause bid responses to be rejected or mismatched',
          solution: 'Generate a new unique ID for every request'
        }
      ],
      relatedFields: ['id'],
      performanceImpact: {
        fillRate: 'positive',
        bidPrices: 'neutral',
        latency: 'neutral',
        description: 'Proper request IDs prevent bid rejections, improving fill rates'
      },
      difficulty: 'easy',
      tags: ['request-id', 'uniqueness', 'tracking', 'debugging']
    });

    this.addBestPractice({
      id: 'standard-banner-sizes',
      title: 'Use Standard IAB Banner Sizes',
      category: 'field-optimization',
      priority: 'high',
      description: 'Use standard IAB banner sizes for better fill rates and bid competition',
      explanation: 'Standard banner sizes have more available inventory and bidder support. Common sizes like 300x250, 728x90, and 320x50 are supported by most advertisers and have higher fill rates.',
      rationale: 'Non-standard sizes have limited advertiser support, resulting in lower fill rates and reduced revenue.',
      examples: [
        {
          title: 'Standard Desktop Banner Sizes',
          description: 'Most common desktop banner sizes with high fill rates',
          goodExample: {
            banner: {
              w: 300,
              h: 250,
              format: [
                { w: 300, h: 250 },
                { w: 728, h: 90 },
                { w: 160, h: 600 }
              ]
            }
          },
          explanation: 'These sizes are widely supported and have high advertiser demand',
          context: 'Use for desktop web traffic'
        },
        {
          title: 'Mobile Banner Sizes',
          description: 'Mobile-optimized banner sizes',
          goodExample: {
            banner: {
              w: 320,
              h: 50,
              format: [
                { w: 320, h: 50 },
                { w: 300, h: 250 },
                { w: 320, h: 100 }
              ]
            }
          },
          badExample: {
            banner: {
              w: 123,
              h: 456
            }
          },
          explanation: 'Standard mobile sizes vs. non-standard dimensions',
          context: 'Use for mobile web and app traffic'
        }
      ],
      commonMistakes: [
        {
          mistake: 'Using non-standard banner dimensions',
          problem: 'Reduces available inventory and fill rates',
          solution: 'Use IAB standard sizes or closest standard alternative',
          example: { banner: { w: 299, h: 251 } }
        },
        {
          mistake: 'Not specifying multiple sizes',
          problem: 'Limits bidder flexibility and competition',
          solution: 'Use format array to specify multiple acceptable sizes'
        }
      ],
      relatedFields: ['imp.banner.w', 'imp.banner.h', 'imp.banner.format'],
      performanceImpact: {
        fillRate: 'positive',
        bidPrices: 'positive',
        latency: 'neutral',
        description: 'Standard sizes can improve fill rates by 20-40% and increase bid competition'
      },
      difficulty: 'easy',
      tags: ['banner', 'sizes', 'iab-standards', 'fill-rate', 'optimization']
    });

    this.addBestPractice({
      id: 'site-app-exclusivity',
      title: 'Site and App Mutual Exclusivity',
      category: 'compliance',
      priority: 'critical',
      description: 'Include either site or app object, never both in the same request',
      explanation: 'The OpenRTB specification requires that site and app objects are mutually exclusive. A request represents either web inventory (site) or mobile app inventory (app), but never both simultaneously.',
      rationale: 'Including both objects violates the OpenRTB specification and will cause bid requests to be rejected by most exchanges.',
      examples: [
        {
          title: 'Correct Web Request',
          description: 'Request for website inventory',
          goodExample: {
            site: {
              id: 'site123',
              domain: 'example.com',
              page: 'https://example.com/article'
            }
            // No app object
          },
          explanation: 'Only site object is present for web inventory',
          context: 'Use for website traffic'
        },
        {
          title: 'Correct App Request',
          description: 'Request for mobile app inventory',
          goodExample: {
            app: {
              id: 'app456',
              bundle: 'com.example.app',
              storeurl: 'https://play.google.com/store/apps/details?id=com.example.app'
            }
            // No site object
          },
          badExample: {
            site: {
              id: 'site123',
              domain: 'example.com'
            },
            app: {
              id: 'app456',
              bundle: 'com.example.app'
            }
          },
          explanation: 'App-only vs. invalid dual presence',
          context: 'Use for mobile app traffic'
        }
      ],
      commonMistakes: [
        {
          mistake: 'Including both site and app objects',
          problem: 'Violates OpenRTB specification and causes bid rejections',
          solution: 'Choose the appropriate object based on inventory type',
          example: { site: {}, app: {} }
        },
        {
          mistake: 'Using site object for mobile app traffic',
          problem: 'Misrepresents inventory type and reduces targeting accuracy',
          solution: 'Use app object for mobile app inventory'
        }
      ],
      relatedFields: ['site', 'app'],
      performanceImpact: {
        fillRate: 'positive',
        bidPrices: 'positive',
        latency: 'neutral',
        description: 'Proper inventory classification improves targeting and prevents bid rejections'
      },
      difficulty: 'easy',
      tags: ['site', 'app', 'mutual-exclusivity', 'compliance', 'specification']
    });

    // Add more best practices...
    this.addPerformanceBestPractices();
    this.addSecurityBestPractices();
    this.addDebuggingBestPractices();
  }

  /**
   * Add performance-related best practices
   */
  private addPerformanceBestPractices(): void {
    this.addBestPractice({
      id: 'timeout-optimization',
      title: 'Optimize Request Timeouts',
      category: 'performance',
      priority: 'high',
      description: 'Set appropriate timeout values to balance fill rates and latency',
      explanation: 'The tmax field specifies the maximum time allowed for bid responses. Too short timeouts reduce fill rates, while too long timeouts increase page load times.',
      rationale: 'Optimal timeout values maximize both fill rates and user experience by allowing sufficient time for bidding while maintaining fast page loads.',
      examples: [
        {
          title: 'Recommended Timeout Values',
          description: 'Balanced timeout settings for different scenarios',
          goodExample: {
            tmax: 200  // 200ms for web display
          },
          badExample: {
            tmax: 50   // Too short
          },
          explanation: '200ms allows sufficient time for bidding without impacting user experience',
          context: 'Use 100-300ms for web display, 150-400ms for video'
        }
      ],
      commonMistakes: [
        {
          mistake: 'Setting timeout too low (< 100ms)',
          problem: 'Reduces fill rates as bidders cannot respond in time',
          solution: 'Use at least 100ms, preferably 150-200ms for display ads'
        },
        {
          mistake: 'Setting timeout too high (> 500ms)',
          problem: 'Increases page load times and hurts user experience',
          solution: 'Keep timeouts under 300ms for display, 400ms for video'
        }
      ],
      relatedFields: ['tmax'],
      performanceImpact: {
        fillRate: 'positive',
        bidPrices: 'positive',
        latency: 'negative',
        description: 'Optimal timeouts can improve fill rates by 10-20% while maintaining good UX'
      },
      difficulty: 'medium',
      tags: ['timeout', 'performance', 'latency', 'fill-rate', 'user-experience']
    });
  }

  /**
   * Add security-related best practices
   */
  private addSecurityBestPractices(): void {
    this.addBestPractice({
      id: 'secure-connections',
      title: 'Use HTTPS for Secure Connections',
      category: 'security',
      priority: 'high',
      description: 'Always use HTTPS for bid requests and specify secure ad serving requirements',
      explanation: 'HTTPS protects bid request data in transit and is required for serving ads on secure pages. The secure field indicates whether the impression requires secure ad serving.',
      rationale: 'Unsecured connections expose sensitive user data and prevent ad serving on HTTPS pages, reducing inventory value.',
      examples: [
        {
          title: 'Secure Impression Configuration',
          description: 'Properly configured secure impression',
          goodExample: {
            imp: [{
              id: '1',
              secure: 1,  // Require HTTPS ad serving
              banner: { w: 300, h: 250 }
            }]
          },
          explanation: 'Setting secure=1 ensures ads are served over HTTPS',
          context: 'Use for HTTPS pages and privacy-sensitive content'
        }
      ],
      commonMistakes: [
        {
          mistake: 'Not setting secure flag on HTTPS pages',
          problem: 'Prevents secure ad serving and reduces fill rates',
          solution: 'Set secure=1 for impressions on HTTPS pages'
        }
      ],
      relatedFields: ['imp.secure'],
      performanceImpact: {
        fillRate: 'positive',
        bidPrices: 'neutral',
        latency: 'neutral',
        description: 'Proper security settings prevent ad serving issues on secure pages'
      },
      difficulty: 'easy',
      tags: ['security', 'https', 'secure-serving', 'privacy']
    });
  }

  /**
   * Add debugging-related best practices
   */
  private addDebuggingBestPractices(): void {
    this.addBestPractice({
      id: 'test-mode-usage',
      title: 'Use Test Mode for Development',
      category: 'debugging',
      priority: 'medium',
      description: 'Use the test flag to identify development and testing traffic',
      explanation: 'The test field indicates that the request is for testing purposes and should not result in actual ad serving or billing. This helps separate test traffic from production.',
      rationale: 'Proper test mode usage prevents test traffic from affecting production metrics and billing.',
      examples: [
        {
          title: 'Test Request Configuration',
          description: 'Properly marked test request',
          goodExample: {
            id: 'test_req_123',
            test: 1,  // Mark as test traffic
            imp: [{ id: '1', banner: { w: 300, h: 250 } }],
            at: 1
          },
          explanation: 'Setting test=1 clearly identifies this as test traffic',
          context: 'Use during development and integration testing'
        }
      ],
      commonMistakes: [
        {
          mistake: 'Forgetting to remove test flag in production',
          problem: 'Production traffic treated as test traffic, no real ads served',
          solution: 'Remove or set test=0 for production requests'
        }
      ],
      relatedFields: ['test'],
      performanceImpact: {
        fillRate: 'neutral',
        bidPrices: 'neutral',
        latency: 'neutral',
        description: 'Proper test mode usage helps maintain clean metrics and debugging'
      },
      difficulty: 'easy',
      tags: ['testing', 'debugging', 'development', 'traffic-separation']
    });
  }

  /**
   * Initialize guides
   */
  private initializeGuides(): void {
    this.addGuide({
      id: 'beginner-guide',
      title: 'Getting Started with OpenRTB',
      description: 'A comprehensive guide for developers new to OpenRTB implementation',
      audience: 'beginner',
      readingTime: 15,
      practices: [
        this.practices.get('unique-request-ids')!,
        this.practices.get('standard-banner-sizes')!,
        this.practices.get('site-app-exclusivity')!
      ],
      prerequisites: [
        'Basic understanding of JSON',
        'Familiarity with HTTP requests',
        'Understanding of programmatic advertising concepts'
      ],
      objectives: [
        'Create valid OpenRTB bid requests',
        'Understand required vs optional fields',
        'Implement basic error handling',
        'Follow OpenRTB specification compliance'
      ]
    });

    this.addGuide({
      id: 'performance-optimization',
      title: 'Performance Optimization Guide',
      description: 'Advanced techniques for optimizing OpenRTB performance and revenue',
      audience: 'intermediate',
      readingTime: 25,
      practices: [
        this.practices.get('timeout-optimization')!,
        this.practices.get('standard-banner-sizes')!
      ],
      prerequisites: [
        'Experience with OpenRTB implementation',
        'Understanding of programmatic advertising metrics',
        'Knowledge of web performance optimization'
      ],
      objectives: [
        'Optimize fill rates and bid prices',
        'Reduce latency and improve user experience',
        'Implement advanced targeting features',
        'Monitor and analyze performance metrics'
      ]
    });
  }

  /**
   * Add best practice to the system
   */
  private addBestPractice(practice: BestPractice): void {
    this.practices.set(practice.id, practice);
  }

  /**
   * Add guide to the system
   */
  private addGuide(guide: BestPracticeGuide): void {
    this.guides.set(guide.id, guide);
  }

  /**
   * Build search indexes
   */
  private buildIndexes(): void {
    // Build category index
    this.practices.forEach((practice, id) => {
      if (!this.categoryIndex.has(practice.category)) {
        this.categoryIndex.set(practice.category, []);
      }
      this.categoryIndex.get(practice.category)!.push(id);
    });

    // Build tag index
    this.practices.forEach((practice, id) => {
      practice.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, []);
        }
        this.tagIndex.get(tag)!.push(id);
      });
    });
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: BestPractice['priority']): number {
    const weights = { critical: 1, high: 2, medium: 3, low: 4 };
    return weights[priority];
  }
}

// Export singleton instance
export const bestPracticesSystem = new BestPracticesSystem();