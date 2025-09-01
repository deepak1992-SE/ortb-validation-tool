/**
 * ORTB Field Help System
 * Provides contextual help and guidance for ORTB fields
 */

import { FieldDefinition, FieldExample, FieldDocumentation } from '../models/validation';

export interface FieldHelp {
  /** Field path (e.g., "imp.banner.w") */
  fieldPath: string;
  /** Field name */
  name: string;
  /** Short description */
  description: string;
  /** Detailed explanation */
  longDescription: string;
  /** Field type information */
  type: FieldTypeInfo;
  /** Requirement level */
  requirementLevel: 'required' | 'optional' | 'recommended';
  /** Usage examples */
  examples: FieldHelpExample[];
  /** Common validation errors */
  commonErrors: FieldError[];
  /** Best practices */
  bestPractices: string[];
  /** Related fields */
  relatedFields: RelatedField[];
  /** When to use this field */
  usageGuidance: UsageGuidance;
  /** OpenRTB specification reference */
  specReference: SpecReference;
}

export interface FieldTypeInfo {
  /** Primary type (string, number, object, array, etc.) */
  type: string;
  /** Format constraints */
  format?: string;
  /** Minimum value (for numbers) */
  minimum?: number;
  /** Maximum value (for numbers) */
  maximum?: number;
  /** Allowed values (for enums) */
  allowedValues?: Array<{ value: any; description: string }>;
  /** Pattern (for strings) */
  pattern?: string;
  /** Default value */
  defaultValue?: any;
}

export interface FieldHelpExample {
  /** Example value */
  value: any;
  /** Description of the example */
  description: string;
  /** Context when this example is appropriate */
  context: string;
  /** Whether this is a recommended example */
  recommended: boolean;
  /** Complete request snippet showing field in context */
  requestSnippet?: any;
}

export interface FieldError {
  /** Error code */
  code: string;
  /** Error description */
  description: string;
  /** How to fix this error */
  solution: string;
  /** Example of incorrect usage */
  incorrectExample?: any;
  /** Example of correct usage */
  correctExample?: any;
}

export interface RelatedField {
  /** Related field path */
  fieldPath: string;
  /** Relationship type */
  relationship: 'required-with' | 'mutually-exclusive' | 'recommended-with' | 'alternative-to';
  /** Description of the relationship */
  description: string;
}

export interface UsageGuidance {
  /** When this field should be used */
  whenToUse: string[];
  /** When this field should not be used */
  whenNotToUse: string[];
  /** Impact on bid processing */
  bidProcessingImpact: string;
  /** Impact on fill rates */
  fillRateImpact?: string;
  /** Publisher considerations */
  publisherConsiderations?: string[];
}

export interface SpecReference {
  /** OpenRTB specification version */
  version: string;
  /** Section number */
  section: string;
  /** Page number (if applicable) */
  page?: number;
  /** Direct link to specification */
  link?: string;
}

export interface HelpSearchResult {
  /** Field help information */
  fieldHelp: FieldHelp;
  /** Relevance score (0-1) */
  relevance: number;
  /** Matching terms */
  matchingTerms: string[];
}

export class FieldHelpSystem {
  private fieldHelpData: Map<string, FieldHelp> = new Map();
  private searchIndex: Map<string, string[]> = new Map(); // term -> field paths

  constructor() {
    this.initializeFieldHelp();
    this.buildSearchIndex();
  }

  /**
   * Get help for a specific field
   */
  getFieldHelp(fieldPath: string): FieldHelp | null {
    return this.fieldHelpData.get(fieldPath) || null;
  }

  /**
   * Search for field help by term
   */
  searchFieldHelp(query: string): HelpSearchResult[] {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const results = new Map<string, { score: number; terms: Set<string> }>();

    searchTerms.forEach(term => {
      const matchingFields = this.searchIndex.get(term) || [];
      matchingFields.forEach(fieldPath => {
        if (!results.has(fieldPath)) {
          results.set(fieldPath, { score: 0, terms: new Set() });
        }
        const result = results.get(fieldPath)!;
        result.score += 1;
        result.terms.add(term);
      });
    });

    return Array.from(results.entries())
      .map(([fieldPath, { score, terms }]) => {
        const fieldHelp = this.fieldHelpData.get(fieldPath)!;
        return {
          fieldHelp,
          relevance: score / searchTerms.length,
          matchingTerms: Array.from(terms)
        };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10); // Top 10 results
  }

  /**
   * Get help for fields by category
   */
  getFieldsByCategory(category: 'required' | 'recommended' | 'optional'): FieldHelp[] {
    return Array.from(this.fieldHelpData.values())
      .filter(help => help.requirementLevel === category)
      .sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
  }

  /**
   * Get related fields for a given field
   */
  getRelatedFields(fieldPath: string): FieldHelp[] {
    const fieldHelp = this.getFieldHelp(fieldPath);
    if (!fieldHelp) return [];

    return fieldHelp.relatedFields
      .map(related => this.getFieldHelp(related.fieldPath))
      .filter((help): help is FieldHelp => help !== null);
  }

  /**
   * Get contextual help based on validation errors
   */
  getHelpForValidationError(errorCode: string, fieldPath?: string): FieldHelp[] {
    const results: FieldHelp[] = [];

    // If field path is provided, get specific help
    if (fieldPath) {
      const fieldHelp = this.getFieldHelp(fieldPath);
      if (fieldHelp) {
        results.push(fieldHelp);
      }
    }

    // Find fields that commonly have this error
    Array.from(this.fieldHelpData.values()).forEach(help => {
      if (help.commonErrors.some(error => error.code === errorCode)) {
        if (!results.includes(help)) {
          results.push(help);
        }
      }
    });

    return results;
  }

  /**
   * Get guided validation steps
   */
  getValidationGuidance(): ValidationStep[] {
    return [
      {
        step: 1,
        title: 'Check Required Fields',
        description: 'Ensure all mandatory fields are present',
        fields: this.getFieldsByCategory('required').slice(0, 5),
        checkFunction: 'validateRequiredFields',
        helpText: 'These fields must be present in every ORTB request'
      },
      {
        step: 2,
        title: 'Validate Request Structure',
        description: 'Check that your request follows the correct JSON structure',
        fields: [
          this.getFieldHelp('id')!,
          this.getFieldHelp('imp')!,
          this.getFieldHelp('at')!
        ].filter(Boolean),
        checkFunction: 'validateStructure',
        helpText: 'The request must have a valid JSON structure with proper nesting'
      },
      {
        step: 3,
        title: 'Verify Impression Details',
        description: 'Ensure impression objects are properly configured',
        fields: [
          this.getFieldHelp('imp.id')!,
          this.getFieldHelp('imp.banner')!,
          this.getFieldHelp('imp.video')!
        ].filter(Boolean),
        checkFunction: 'validateImpressions',
        helpText: 'Each impression must have a unique ID and at least one ad format'
      },
      {
        step: 4,
        title: 'Check Site/App Configuration',
        description: 'Validate site or app information (mutually exclusive)',
        fields: [
          this.getFieldHelp('site')!,
          this.getFieldHelp('app')!
        ].filter(Boolean),
        checkFunction: 'validateSiteApp',
        helpText: 'Include either site OR app object, but not both'
      },
      {
        step: 5,
        title: 'Review Optional Fields',
        description: 'Consider adding recommended fields for better performance',
        fields: this.getFieldsByCategory('recommended').slice(0, 5),
        checkFunction: 'validateOptionalFields',
        helpText: 'These fields can improve bid processing and fill rates'
      }
    ];
  }

  /**
   * Initialize field help data
   */
  private initializeFieldHelp(): void {
    // Root level fields
    this.addFieldHelp({
      fieldPath: 'id',
      name: 'Request ID',
      description: 'Unique identifier for the bid request',
      longDescription: 'A unique identifier for the bid request. This ID is used to track the request through the bidding process and must be unique across all requests from the same source.',
      type: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      requirementLevel: 'required',
      examples: [
        {
          value: 'req_12345_abcdef',
          description: 'Standard request ID format',
          context: 'Most common format using prefix and unique identifier',
          recommended: true,
          requestSnippet: { id: 'req_12345_abcdef', imp: [], at: 1 }
        },
        {
          value: 'uuid-4f3d2e1c-9b8a-7654-3210-fedcba987654',
          description: 'UUID-based request ID',
          context: 'When using UUID for guaranteed uniqueness',
          recommended: true
        }
      ],
      commonErrors: [
        {
          code: 'MISSING_REQUEST_ID',
          description: 'Request ID is missing',
          solution: 'Add a unique string identifier to the "id" field',
          correctExample: 'req_12345_abcdef'
        },
        {
          code: 'INVALID_REQUEST_ID_FORMAT',
          description: 'Request ID contains invalid characters',
          solution: 'Use only alphanumeric characters, hyphens, and underscores',
          incorrectExample: 'req@12345#invalid',
          correctExample: 'req_12345_valid'
        }
      ],
      bestPractices: [
        'Use a consistent naming convention across all requests',
        'Include timestamp or sequence number for easier debugging',
        'Keep IDs reasonably short but descriptive',
        'Avoid special characters that might cause parsing issues'
      ],
      relatedFields: [
        {
          fieldPath: 'imp.id',
          relationship: 'required-with',
          description: 'Each impression must also have a unique ID within the request'
        }
      ],
      usageGuidance: {
        whenToUse: ['Every ORTB request must have a unique ID'],
        whenNotToUse: ['Never omit this field'],
        bidProcessingImpact: 'Essential for request tracking and response correlation',
        fillRateImpact: 'No direct impact, but required for proper bid processing'
      },
      specReference: {
        version: '2.6',
        section: '3.2.1',
        link: 'https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-API-Specification-Version-2-6-FINAL.pdf'
      }
    });

    this.addFieldHelp({
      fieldPath: 'imp',
      name: 'Impressions',
      description: 'Array of impression objects representing ad opportunities',
      longDescription: 'An array of impression objects, each representing a single ad opportunity. At least one impression is required per request. Each impression defines the characteristics of the ad space being offered.',
      type: {
        type: 'array',
        minimum: 1
      },
      requirementLevel: 'required',
      examples: [
        {
          value: [{ id: '1', banner: { w: 300, h: 250 } }],
          description: 'Single banner impression',
          context: 'Simple display ad request',
          recommended: true,
          requestSnippet: {
            id: 'req_123',
            imp: [{ id: '1', banner: { w: 300, h: 250 } }],
            at: 1
          }
        },
        {
          value: [
            { id: '1', banner: { w: 728, h: 90 } },
            { id: '2', banner: { w: 300, h: 250 } }
          ],
          description: 'Multiple banner impressions',
          context: 'When requesting multiple ad slots',
          recommended: true
        }
      ],
      commonErrors: [
        {
          code: 'MISSING_IMPRESSIONS',
          description: 'No impressions provided in request',
          solution: 'Add at least one impression object to the imp array',
          correctExample: [{ id: '1', banner: { w: 300, h: 250 } }]
        },
        {
          code: 'EMPTY_IMPRESSIONS_ARRAY',
          description: 'Impressions array is empty',
          solution: 'Include at least one impression object',
          incorrectExample: [],
          correctExample: [{ id: '1', banner: { w: 300, h: 250 } }]
        }
      ],
      bestPractices: [
        'Always include at least one impression',
        'Use descriptive impression IDs',
        'Specify appropriate ad formats for each impression',
        'Consider floor prices for better yield optimization'
      ],
      relatedFields: [
        {
          fieldPath: 'imp.id',
          relationship: 'required-with',
          description: 'Each impression must have a unique ID'
        },
        {
          fieldPath: 'imp.banner',
          relationship: 'alternative-to',
          description: 'Banner is one of several possible ad formats'
        }
      ],
      usageGuidance: {
        whenToUse: ['Every ORTB request must include impressions'],
        whenNotToUse: ['Never omit impressions'],
        bidProcessingImpact: 'Defines the ad opportunities available for bidding',
        fillRateImpact: 'More specific impression details can improve fill rates'
      },
      specReference: {
        version: '2.6',
        section: '3.2.4',
        link: 'https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-API-Specification-Version-2-6-FINAL.pdf'
      }
    });

    // Add more field help data for common fields
    this.addCommonFieldHelp();
  }

  /**
   * Add common field help data
   */
  private addCommonFieldHelp(): void {
    // Impression ID
    this.addFieldHelp({
      fieldPath: 'imp.id',
      name: 'Impression ID',
      description: 'Unique identifier for the impression within the request',
      longDescription: 'A unique identifier for the impression within the bid request. This ID must be unique among all impressions in the same request and is used to correlate bid responses.',
      type: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      requirementLevel: 'required',
      examples: [
        {
          value: '1',
          description: 'Simple numeric ID',
          context: 'When using sequential numbering',
          recommended: true
        },
        {
          value: 'banner_top',
          description: 'Descriptive impression ID',
          context: 'When ID describes the ad placement',
          recommended: true
        }
      ],
      commonErrors: [
        {
          code: 'MISSING_IMPRESSION_ID',
          description: 'Impression ID is missing',
          solution: 'Add a unique string identifier to each impression',
          correctExample: '1'
        },
        {
          code: 'DUPLICATE_IMPRESSION_ID',
          description: 'Multiple impressions have the same ID',
          solution: 'Ensure each impression has a unique ID within the request',
          incorrectExample: [{ id: '1' }, { id: '1' }],
          correctExample: [{ id: '1' }, { id: '2' }]
        }
      ],
      bestPractices: [
        'Use sequential numbering for simplicity',
        'Use descriptive names when helpful for debugging',
        'Keep IDs short but meaningful',
        'Ensure uniqueness within each request'
      ],
      relatedFields: [
        {
          fieldPath: 'id',
          relationship: 'required-with',
          description: 'Request ID is also required at the root level'
        }
      ],
      usageGuidance: {
        whenToUse: ['Every impression must have a unique ID'],
        whenNotToUse: ['Never omit impression IDs'],
        bidProcessingImpact: 'Essential for correlating bids with specific impressions',
        fillRateImpact: 'No direct impact, but required for proper bid processing'
      },
      specReference: {
        version: '2.6',
        section: '3.2.4',
        link: 'https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-API-Specification-Version-2-6-FINAL.pdf'
      }
    });

    // Banner width
    this.addFieldHelp({
      fieldPath: 'imp.banner.w',
      name: 'Banner Width',
      description: 'Width of the banner ad in pixels',
      longDescription: 'The width of the banner advertisement in pixels. This field is required when the banner object is present and helps bidders determine if they have appropriate creative assets.',
      type: {
        type: 'integer',
        minimum: 1,
        maximum: 10000
      },
      requirementLevel: 'required',
      examples: [
        {
          value: 300,
          description: 'Medium rectangle width',
          context: 'Standard 300x250 medium rectangle banner',
          recommended: true,
          requestSnippet: {
            imp: [{ id: '1', banner: { w: 300, h: 250 } }]
          }
        },
        {
          value: 728,
          description: 'Leaderboard width',
          context: 'Standard 728x90 leaderboard banner',
          recommended: true
        },
        {
          value: 320,
          description: 'Mobile banner width',
          context: 'Mobile-optimized banner size',
          recommended: true
        }
      ],
      commonErrors: [
        {
          code: 'MISSING_BANNER_WIDTH',
          description: 'Banner width is missing when banner object is present',
          solution: 'Add width (w) field to banner object',
          correctExample: { w: 300, h: 250 }
        },
        {
          code: 'INVALID_BANNER_WIDTH',
          description: 'Banner width is not a positive integer',
          solution: 'Use a positive integer value for width',
          incorrectExample: { w: -300 },
          correctExample: { w: 300 }
        }
      ],
      bestPractices: [
        'Use standard IAB banner sizes when possible',
        'Consider mobile-friendly sizes for mobile traffic',
        'Match the actual ad slot dimensions on your site',
        'Include multiple sizes if the slot is flexible'
      ],
      relatedFields: [
        {
          fieldPath: 'imp.banner.h',
          relationship: 'required-with',
          description: 'Height must be specified along with width'
        },
        {
          fieldPath: 'imp.banner.format',
          relationship: 'alternative-to',
          description: 'Format array can specify multiple size options'
        }
      ],
      usageGuidance: {
        whenToUse: ['When requesting banner advertisements'],
        whenNotToUse: ['When using video, native, or audio ad formats only'],
        bidProcessingImpact: 'Helps bidders match appropriate creative assets',
        fillRateImpact: 'Standard sizes typically have higher fill rates',
        publisherConsiderations: [
          'Ensure the specified size matches your actual ad slot',
          'Consider responsive ad units for better mobile experience'
        ]
      },
      specReference: {
        version: '2.6',
        section: '3.2.6',
        link: 'https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-API-Specification-Version-2-6-FINAL.pdf'
      }
    });

    // Banner height
    this.addFieldHelp({
      fieldPath: 'imp.banner.h',
      name: 'Banner Height',
      description: 'Height of the banner ad in pixels',
      longDescription: 'The height of the banner advertisement in pixels. This field is required when the banner object is present and helps bidders determine if they have appropriate creative assets.',
      type: {
        type: 'integer',
        minimum: 1,
        maximum: 10000
      },
      requirementLevel: 'required',
      examples: [
        {
          value: 250,
          description: 'Medium rectangle height',
          context: 'Standard 300x250 medium rectangle banner',
          recommended: true,
          requestSnippet: {
            imp: [{ id: '1', banner: { w: 300, h: 250 } }]
          }
        },
        {
          value: 90,
          description: 'Leaderboard height',
          context: 'Standard 728x90 leaderboard banner',
          recommended: true
        },
        {
          value: 50,
          description: 'Mobile banner height',
          context: 'Mobile-optimized banner size',
          recommended: true
        }
      ],
      commonErrors: [
        {
          code: 'MISSING_BANNER_HEIGHT',
          description: 'Banner height is missing when banner object is present',
          solution: 'Add height (h) field to banner object',
          correctExample: { w: 300, h: 250 }
        },
        {
          code: 'INVALID_BANNER_HEIGHT',
          description: 'Banner height is not a positive integer',
          solution: 'Use a positive integer value for height',
          incorrectExample: { h: -250 },
          correctExample: { h: 250 }
        }
      ],
      bestPractices: [
        'Use standard IAB banner sizes when possible',
        'Consider mobile-friendly sizes for mobile traffic',
        'Match the actual ad slot dimensions on your site',
        'Include multiple sizes if the slot is flexible'
      ],
      relatedFields: [
        {
          fieldPath: 'imp.banner.w',
          relationship: 'required-with',
          description: 'Width must be specified along with height'
        },
        {
          fieldPath: 'imp.banner.format',
          relationship: 'alternative-to',
          description: 'Format array can specify multiple size options'
        }
      ],
      usageGuidance: {
        whenToUse: ['When requesting banner advertisements'],
        whenNotToUse: ['When using video, native, or audio ad formats only'],
        bidProcessingImpact: 'Helps bidders match appropriate creative assets',
        fillRateImpact: 'Standard sizes typically have higher fill rates',
        publisherConsiderations: [
          'Ensure the specified size matches your actual ad slot',
          'Consider responsive ad units for better mobile experience'
        ]
      },
      specReference: {
        version: '2.6',
        section: '3.2.6',
        link: 'https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-API-Specification-Version-2-6-FINAL.pdf'
      }
    });

    // Add more fields as needed...
  }

  /**
   * Add field help to the system
   */
  private addFieldHelp(fieldHelp: FieldHelp): void {
    this.fieldHelpData.set(fieldHelp.fieldPath, fieldHelp);
  }

  /**
   * Build search index for field help
   */
  private buildSearchIndex(): void {
    this.fieldHelpData.forEach((help, fieldPath) => {
      const searchTerms = new Set<string>();
      
      // Add field path components
      fieldPath.split('.').forEach(part => {
        searchTerms.add(part.toLowerCase());
      });
      
      // Add name and description words
      help.name.toLowerCase().split(/\s+/).forEach(word => searchTerms.add(word));
      help.description.toLowerCase().split(/\s+/).forEach(word => searchTerms.add(word));
      
      // Add type information
      searchTerms.add(help.type.type.toLowerCase());
      searchTerms.add(help.requirementLevel.toLowerCase());
      
      // Add to search index
      searchTerms.forEach(term => {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, []);
        }
        this.searchIndex.get(term)!.push(fieldPath);
      });
    });
  }
}

export interface ValidationStep {
  /** Step number */
  step: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Related fields for this step */
  fields: FieldHelp[];
  /** Function name for validation check */
  checkFunction: string;
  /** Additional help text */
  helpText: string;
}

// Export singleton instance
export const fieldHelpSystem = new FieldHelpSystem();