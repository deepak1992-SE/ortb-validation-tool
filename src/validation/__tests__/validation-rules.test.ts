/**
 * OpenRTB Validation Rules Tests
 * Comprehensive unit tests for OpenRTB-specific validation rules
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ORTBValidationRules } from '../validation-rules';
import { ORTBRequest } from '../../models';

describe('ORTBValidationRules', () => {
  let validationRules: ORTBValidationRules;

  beforeEach(() => {
    validationRules = new ORTBValidationRules();
  });

  describe('validateBusinessLogic', () => {
    it('should detect duplicate impression IDs', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } },
          { id: 'imp-2', banner: { w: 728, h: 90 } },
          { id: 'imp-1', banner: { w: 320, h: 50 } } // Duplicate ID
        ],
        at: 2
      };

      const result = validationRules.validateBusinessLogic(request);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('ORTB_DUPLICATE_IMPRESSION_ID');
      expect(result.errors[0].field).toBe('imp[].id');
      expect(result.errors[0].actualValue).toBe('imp-1');
      expect(result.errors[0].suggestion).toContain('unique');
    });

    it('should detect impressions without ad formats', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } }, // Valid
          { id: 'imp-2' }, // Missing ad format
          { id: 'imp-3', bidfloor: 0.5 } // Missing ad format
        ],
        at: 2
      };

      const result = validationRules.validateBusinessLogic(request);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe('ORTB_MISSING_AD_FORMAT');
      expect(result.errors[0].field).toBe('imp.1');
      expect(result.errors[1].code).toBe('ORTB_MISSING_AD_FORMAT');
      expect(result.errors[1].field).toBe('imp.2');
    });

    it('should warn about invalid currency codes', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 }, bidfloorcur: 'USD' }, // Valid
          { id: 'imp-2', banner: { w: 728, h: 90 }, bidfloorcur: 'XYZ' }, // Invalid
          { id: 'imp-3', banner: { w: 320, h: 50 }, bidfloorcur: 'INVALID' } // Invalid
        ],
        at: 2
      };

      const result = validationRules.validateBusinessLogic(request);

      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_CURRENCY_CODE');
      expect(result.warnings[0].field).toBe('imp.1.bidfloorcur');
      expect(result.warnings[1].code).toBe('ORTB_INVALID_CURRENCY_CODE');
      expect(result.warnings[1].field).toBe('imp.2.bidfloorcur');
    });

    it('should warn about invalid test flag values', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 2,
        test: 5 // Invalid test flag
      };

      const result = validationRules.validateBusinessLogic(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_TEST_FLAG');
      expect(result.warnings[0].field).toBe('test');
      expect(result.warnings[0].actualValue).toBe(5);
    });

    it('should pass validation for valid business logic', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 }, bidfloorcur: 'USD' },
          { id: 'imp-2', video: { mimes: ['video/mp4'] }, bidfloorcur: 'EUR' }
        ],
        at: 2,
        test: 1
      };

      const result = validationRules.validateBusinessLogic(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateCrossFieldRules', () => {
    it('should detect site and app mutual exclusion', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        site: { id: 'site-1', domain: 'example.com' },
        app: { id: 'app-1', name: 'Test App' },
        at: 2
      };

      const result = validationRules.validateCrossFieldRules(request);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('ORTB_SITE_APP_MUTUAL_EXCLUSION');
      expect(result.errors[0].field).toBe('site/app');
    });

    it('should warn about invalid lmt values', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        device: { lmt: 5 }, // Invalid lmt value
        at: 2
      };

      const result = validationRules.validateCrossFieldRules(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_LMT_VALUE');
      expect(result.warnings[0].field).toBe('device.lmt');
    });

    it('should warn about invalid dnt values', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        device: { dnt: 2 }, // Invalid dnt value
        at: 2
      };

      const result = validationRules.validateCrossFieldRules(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_DNT_VALUE');
      expect(result.warnings[0].field).toBe('device.dnt');
    });

    it('should warn about unrealistic birth years', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        user: { yob: 1800 }, // Too old
        at: 2
      };

      const result = validationRules.validateCrossFieldRules(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_UNREALISTIC_BIRTH_YEAR');
      expect(result.warnings[0].field).toBe('user.yob');
    });

    it('should warn about very low timeout', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 2,
        tmax: 30 // Very low timeout
      };

      const result = validationRules.validateCrossFieldRules(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_LOW_TIMEOUT');
      expect(result.warnings[0].field).toBe('tmax');
    });

    it('should warn about very high timeout', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 2,
        tmax: 2000 // Very high timeout
      };

      const result = validationRules.validateCrossFieldRules(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_HIGH_TIMEOUT');
      expect(result.warnings[0].field).toBe('tmax');
    });
  });

  describe('validateEnumeratedValues', () => {
    it('should detect invalid auction types', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 5 // Invalid auction type
      };

      const result = validationRules.validateEnumeratedValues(request);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('ORTB_INVALID_AUCTION_TYPE');
      expect(result.errors[0].field).toBe('at');
      expect(result.errors[0].actualValue).toBe(5);
    });

    it('should warn about invalid device types', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        device: { devicetype: 10 }, // Invalid device type
        at: 2
      };

      const result = validationRules.validateEnumeratedValues(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_DEVICE_TYPE');
      expect(result.warnings[0].field).toBe('device.devicetype');
    });

    it('should warn about invalid connection types', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        device: { connectiontype: 10 }, // Invalid connection type
        at: 2
      };

      const result = validationRules.validateEnumeratedValues(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_CONNECTION_TYPE');
      expect(result.warnings[0].field).toBe('device.connectiontype');
    });

    it('should warn about invalid banner positions', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250, pos: 10 } } // Invalid position
        ],
        at: 2
      };

      const result = validationRules.validateEnumeratedValues(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_INVALID_BANNER_POSITION');
      expect(result.warnings[0].field).toBe('imp.0.banner.pos');
    });

    it('should pass validation for valid enumerated values', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250, pos: 1 } }],
        device: { devicetype: 2, connectiontype: 2 },
        at: 2
      };

      const result = validationRules.validateEnumeratedValues(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateConstraints', () => {
    it('should detect invalid banner dimensions', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 0, h: 250 } }, // Invalid width
          { id: 'imp-2', banner: { w: 300, h: -50 } } // Invalid height
        ],
        at: 2
      };

      const result = validationRules.validateConstraints(request);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe('ORTB_INVALID_BANNER_WIDTH');
      expect(result.errors[0].field).toBe('imp.0.banner.w');
      expect(result.errors[1].code).toBe('ORTB_INVALID_BANNER_HEIGHT');
      expect(result.errors[1].field).toBe('imp.1.banner.h');
    });

    it('should warn about non-standard banner sizes', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } }, // Standard size
          { id: 'imp-2', banner: { w: 123, h: 456 } } // Non-standard size
        ],
        at: 2
      };

      const result = validationRules.validateConstraints(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('ORTB_NON_STANDARD_BANNER_SIZE');
      expect(result.warnings[0].field).toBe('imp.1.banner');
      expect(result.warnings[0].actualValue).toBe('123x456');
    });

    it('should detect negative bid floors', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 }, bidfloor: -0.5 } // Negative bid floor
        ],
        at: 2
      };

      const result = validationRules.validateConstraints(request);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('ORTB_NEGATIVE_BID_FLOOR');
      expect(result.errors[0].field).toBe('imp.0.bidfloor');
    });

    it('should detect invalid video duration constraints', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          {
            id: 'imp-1',
            video: {
              mimes: ['video/mp4'],
              minduration: 30,
              maxduration: 15 // Max less than min
            }
          },
          {
            id: 'imp-2',
            video: {
              mimes: ['video/mp4'],
              minduration: -5 // Negative min duration
            }
          },
          {
            id: 'imp-3',
            video: {
              mimes: ['video/mp4'],
              maxduration: 0 // Zero max duration
            }
          }
        ],
        at: 2
      };

      const result = validationRules.validateConstraints(request);

      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].code).toBe('ORTB_INVALID_VIDEO_DURATION');
      expect(result.errors[0].field).toBe('imp.0.video');
      expect(result.errors[1].code).toBe('ORTB_INVALID_MIN_DURATION');
      expect(result.errors[1].field).toBe('imp.1.video.minduration');
      expect(result.errors[2].code).toBe('ORTB_INVALID_MAX_DURATION');
      expect(result.errors[2].field).toBe('imp.2.video.maxduration');
    });

    it('should pass validation for valid constraints', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 },
            bidfloor: 0.5
          },
          {
            id: 'imp-2',
            video: {
              mimes: ['video/mp4'],
              minduration: 15,
              maxduration: 30
            },
            bidfloor: 1.0
          }
        ],
        at: 2
      };

      const result = validationRules.validateConstraints(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('integration tests', () => {
    it('should handle complex request with multiple validation issues', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } },
          { id: 'imp-1' }, // Duplicate ID and missing format
          { id: 'imp-3', banner: { w: 0, h: 250 }, bidfloor: -1 } // Invalid dimensions and negative floor
        ],
        site: { id: 'site-1' },
        app: { id: 'app-1' }, // Site/app conflict
        device: { devicetype: 10, lmt: 5 }, // Invalid device type and lmt
        user: { yob: 1800 }, // Unrealistic birth year
        at: 5, // Invalid auction type
        tmax: 30, // Low timeout
        test: 3 // Invalid test flag
      };

      const businessLogic = validationRules.validateBusinessLogic(request);
      const crossField = validationRules.validateCrossFieldRules(request);
      const enumerated = validationRules.validateEnumeratedValues(request);
      const constraints = validationRules.validateConstraints(request);

      // Count total errors and warnings
      const totalErrors = businessLogic.errors.length + crossField.errors.length + 
                         enumerated.errors.length + constraints.errors.length;
      const totalWarnings = businessLogic.warnings.length + crossField.warnings.length + 
                           enumerated.warnings.length + constraints.warnings.length;

      expect(totalErrors).toBeGreaterThan(5); // Multiple errors expected
      expect(totalWarnings).toBeGreaterThan(3); // Multiple warnings expected
    });

    it('should handle empty impressions array gracefully', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [],
        at: 2
      };

      const businessLogic = validationRules.validateBusinessLogic(request);
      const crossField = validationRules.validateCrossFieldRules(request);
      const enumerated = validationRules.validateEnumeratedValues(request);
      const constraints = validationRules.validateConstraints(request);

      // Should not throw errors, just handle gracefully
      expect(businessLogic.errors).toHaveLength(0);
      expect(businessLogic.warnings).toHaveLength(0);
    });

    it('should handle request without optional fields', () => {
      const request: ORTBRequest = {
        id: 'test-request',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 2
      };

      const businessLogic = validationRules.validateBusinessLogic(request);
      const crossField = validationRules.validateCrossFieldRules(request);
      const enumerated = validationRules.validateEnumeratedValues(request);
      const constraints = validationRules.validateConstraints(request);

      expect(businessLogic.errors).toHaveLength(0);
      expect(crossField.errors).toHaveLength(0);
      expect(enumerated.errors).toHaveLength(0);
      expect(constraints.errors).toHaveLength(0);
    });
  });
});