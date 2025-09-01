/**
 * OpenRTB-Specific Validation Rules
 * Implements business logic validation beyond basic JSON schema
 */

import { ORTBRequest, ValidationError, ValidationWarning } from '../models';

export interface ValidationRules {
  validateBusinessLogic(request: ORTBRequest): ValidationResult;
  validateCrossFieldRules(request: ORTBRequest): ValidationResult;
  validateEnumeratedValues(request: ORTBRequest): ValidationResult;
  validateConstraints(request: ORTBRequest): ValidationResult;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * OpenRTB-specific validation rules implementation
 */
export class ORTBValidationRules implements ValidationRules {
  
  /**
   * Validate business logic rules
   */
  validateBusinessLogic(request: ORTBRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule: Impression IDs must be unique within a request
    if (request.imp && request.imp.length > 0) {
      const impressionIds = new Set<string>();
      const duplicateIds = new Set<string>();

      request.imp.forEach((imp, _index) => {
        if (imp.id) {
          if (impressionIds.has(imp.id)) {
            duplicateIds.add(imp.id);
          } else {
            impressionIds.add(imp.id);
          }
        }
      });

      duplicateIds.forEach(duplicateId => {
        errors.push({
          field: 'imp[].id',
          message: `Duplicate impression ID '${duplicateId}' found. Impression IDs must be unique within a request.`,
          severity: 'error',
          code: 'ORTB_DUPLICATE_IMPRESSION_ID',
          type: 'logical',
          actualValue: duplicateId,
          expectedValue: 'unique impression ID',
          suggestion: 'Ensure each impression has a unique ID within the request'
        });
      });
    }

    // Rule: At least one impression must have an ad format (banner, video, audio, or native)
    if (request.imp && request.imp.length > 0) {
      const impressionsWithoutFormat = request.imp.filter((imp, _index) => 
        !imp.banner && !imp.video && !imp.audio && !imp.native
      );

      impressionsWithoutFormat.forEach((imp, _index) => {
        const actualIndex = request.imp.indexOf(imp);
        errors.push({
          field: `imp.${actualIndex}`,
          message: 'Impression must specify at least one ad format (banner, video, audio, or native)',
          severity: 'error',
          code: 'ORTB_MISSING_AD_FORMAT',
          type: 'logical',
          actualValue: imp,
          expectedValue: 'impression with at least one ad format',
          suggestion: 'Add banner, video, audio, or native object to the impression'
        });
      });
    }

    // Rule: Bid floor currency should be valid ISO-4217 code
    if (request.imp) {
      request.imp.forEach((imp, index) => {
        if (imp.bidfloorcur && !this.isValidCurrencyCode(imp.bidfloorcur)) {
          warnings.push({
            field: `imp.${index}.bidfloorcur`,
            message: `Currency code '${imp.bidfloorcur}' may not be a valid ISO-4217 code`,
            code: 'ORTB_INVALID_CURRENCY_CODE',
            actualValue: imp.bidfloorcur,
            recommendedValue: 'Valid ISO-4217 currency code (e.g., USD, EUR, GBP)',
            suggestion: 'Use a valid ISO-4217 currency code'
          });
        }
      });
    }

    // Rule: Test flag should be 0 or 1
    if (request.test !== undefined && request.test !== 0 && request.test !== 1) {
      warnings.push({
        field: 'test',
        message: 'Test flag should be 0 (live) or 1 (test mode)',
        code: 'ORTB_INVALID_TEST_FLAG',
        actualValue: request.test,
        recommendedValue: '0 or 1',
        suggestion: 'Set test to 0 for live traffic or 1 for test mode'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate cross-field rules
   */
  validateCrossFieldRules(request: ORTBRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule: Site and App are mutually exclusive (already handled in basic validation)
    // This is a more detailed check
    if (request.site && request.app) {
      errors.push({
        field: 'site/app',
        message: 'Request cannot contain both site and app objects - they are mutually exclusive',
        severity: 'error',
        code: 'ORTB_SITE_APP_MUTUAL_EXCLUSION',
        type: 'logical',
        actualValue: { site: !!request.site, app: !!request.app },
        expectedValue: 'either site or app, not both',
        suggestion: 'Remove either the site or app object, depending on your inventory type'
      });
    }

    // Rule: If device.lmt is set, it should be 0 or 1
    if (request.device?.lmt !== undefined && request.device.lmt !== 0 && request.device.lmt !== 1) {
      warnings.push({
        field: 'device.lmt',
        message: 'Limit Ad Tracking (lmt) should be 0 (tracking allowed) or 1 (limit tracking)',
        code: 'ORTB_INVALID_LMT_VALUE',
        actualValue: request.device.lmt,
        recommendedValue: '0 or 1',
        suggestion: 'Set lmt to 0 to allow tracking or 1 to limit tracking'
      });
    }

    // Rule: If device.dnt is set, it should be 0 or 1
    if (request.device?.dnt !== undefined && request.device.dnt !== 0 && request.device.dnt !== 1) {
      warnings.push({
        field: 'device.dnt',
        message: 'Do Not Track (dnt) should be 0 (tracking allowed) or 1 (do not track)',
        code: 'ORTB_INVALID_DNT_VALUE',
        actualValue: request.device.dnt,
        recommendedValue: '0 or 1',
        suggestion: 'Set dnt to 0 to allow tracking or 1 for do not track'
      });
    }

    // Rule: User year of birth should be reasonable
    if (request.user?.yob !== undefined) {
      const currentYear = new Date().getFullYear();
      const minYear = 1900;
      const maxAge = 120;
      const minValidYear = currentYear - maxAge;

      if (request.user.yob < minYear || request.user.yob > currentYear) {
        warnings.push({
          field: 'user.yob',
          message: `Year of birth ${request.user.yob} seems unrealistic`,
          code: 'ORTB_UNREALISTIC_BIRTH_YEAR',
          actualValue: request.user.yob,
          recommendedValue: `Year between ${minValidYear} and ${currentYear}`,
          suggestion: 'Verify the year of birth is correct'
        });
      }
    }

    // Rule: Timeout (tmax) should be reasonable
    if (request.tmax !== undefined) {
      if (request.tmax < 50) {
        warnings.push({
          field: 'tmax',
          message: 'Timeout (tmax) is very low and may result in fewer bids',
          code: 'ORTB_LOW_TIMEOUT',
          actualValue: request.tmax,
          recommendedValue: '100-300ms',
          suggestion: 'Consider increasing timeout to allow more bidders to respond'
        });
      } else if (request.tmax > 1000) {
        warnings.push({
          field: 'tmax',
          message: 'Timeout (tmax) is very high and may slow down ad serving',
          code: 'ORTB_HIGH_TIMEOUT',
          actualValue: request.tmax,
          recommendedValue: '100-300ms',
          suggestion: 'Consider reducing timeout for faster ad serving'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate enumerated values
   */
  validateEnumeratedValues(request: ORTBRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule: Auction type (at) must be valid
    if (request.at !== undefined) {
      const validAuctionTypes = [1, 2, 3]; // 1=First Price, 2=Second Price, 3=Fixed Price
      if (!validAuctionTypes.includes(request.at)) {
        errors.push({
          field: 'at',
          message: `Invalid auction type '${request.at}'. Must be 1 (First Price), 2 (Second Price), or 3 (Fixed Price)`,
          severity: 'error',
          code: 'ORTB_INVALID_AUCTION_TYPE',
          type: 'value',
          actualValue: request.at,
          expectedValue: 'Valid auction type (1, 2, or 3)',
          suggestion: 'Use 1 for First Price, 2 for Second Price, or 3 for Fixed Price auction'
        });
      }
    }

    // Rule: Device type should be valid
    if (request.device?.devicetype !== undefined) {
      const validDeviceTypes = [1, 2, 3, 4, 5, 6, 7]; // Mobile, PC, TV, Phone, Tablet, Connected Device, Set Top Box
      if (!validDeviceTypes.includes(request.device.devicetype)) {
        warnings.push({
          field: 'device.devicetype',
          message: `Device type '${request.device.devicetype}' is not a standard OpenRTB device type`,
          code: 'ORTB_INVALID_DEVICE_TYPE',
          actualValue: request.device.devicetype,
          recommendedValue: 'Valid device type (1-7)',
          suggestion: 'Use standard device types: 1=Mobile, 2=PC, 3=TV, 4=Phone, 5=Tablet, 6=Connected Device, 7=Set Top Box'
        });
      }
    }

    // Rule: Connection type should be valid
    if (request.device?.connectiontype !== undefined) {
      const validConnectionTypes = [0, 1, 2, 3, 4, 5, 6]; // Unknown, Ethernet, WiFi, Cellular Unknown, 2G, 3G, 4G
      if (!validConnectionTypes.includes(request.device.connectiontype)) {
        warnings.push({
          field: 'device.connectiontype',
          message: `Connection type '${request.device.connectiontype}' is not a standard OpenRTB connection type`,
          code: 'ORTB_INVALID_CONNECTION_TYPE',
          actualValue: request.device.connectiontype,
          recommendedValue: 'Valid connection type (0-6)',
          suggestion: 'Use standard connection types: 0=Unknown, 1=Ethernet, 2=WiFi, 3=Cellular, 4=2G, 5=3G, 6=4G'
        });
      }
    }

    // Rule: Banner position should be valid
    if (request.imp) {
      request.imp.forEach((imp, index) => {
        if (imp.banner?.pos !== undefined) {
          const validPositions = [0, 1, 2, 3, 4, 5, 6, 7]; // Unknown, Above Fold, Below Fold, Header, Footer, Sidebar, Full Screen
          if (!validPositions.includes(imp.banner.pos)) {
            warnings.push({
              field: `imp.${index}.banner.pos`,
              message: `Banner position '${imp.banner.pos}' is not a standard OpenRTB position`,
              code: 'ORTB_INVALID_BANNER_POSITION',
              actualValue: imp.banner.pos,
              recommendedValue: 'Valid position (0-7)',
              suggestion: 'Use standard positions: 0=Unknown, 1=Above Fold, 2=Below Fold, 3=Header, 4=Footer, 5=Sidebar, 6=Full Screen'
            });
          }
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate constraints and business rules
   */
  validateConstraints(request: ORTBRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Rule: Banner dimensions should be positive
    if (request.imp) {
      request.imp.forEach((imp, index) => {
        if (imp.banner) {
          if (imp.banner.w !== undefined && imp.banner.w <= 0) {
            errors.push({
              field: `imp.${index}.banner.w`,
              message: 'Banner width must be greater than 0',
              severity: 'error',
              code: 'ORTB_INVALID_BANNER_WIDTH',
              type: 'value',
              actualValue: imp.banner.w,
              expectedValue: 'positive integer',
              suggestion: 'Set banner width to a positive value'
            });
          }

          if (imp.banner.h !== undefined && imp.banner.h <= 0) {
            errors.push({
              field: `imp.${index}.banner.h`,
              message: 'Banner height must be greater than 0',
              severity: 'error',
              code: 'ORTB_INVALID_BANNER_HEIGHT',
              type: 'value',
              actualValue: imp.banner.h,
              expectedValue: 'positive integer',
              suggestion: 'Set banner height to a positive value'
            });
          }

          // Warn about non-standard banner sizes
          if (imp.banner.w && imp.banner.h) {
            const standardSizes = [
              { w: 300, h: 250 }, { w: 728, h: 90 }, { w: 320, h: 50 },
              { w: 160, h: 600 }, { w: 300, h: 600 }, { w: 970, h: 250 },
              { w: 320, h: 100 }, { w: 468, h: 60 }, { w: 234, h: 60 },
              { w: 120, h: 600 }, { w: 120, h: 240 }, { w: 125, h: 125 }
            ];

            const isStandardSize = standardSizes.some(size => 
              size.w === imp.banner?.w && size.h === imp.banner?.h
            );

            if (!isStandardSize) {
              warnings.push({
                field: `imp.${index}.banner`,
                message: `Banner size ${imp.banner?.w}x${imp.banner?.h} is not a standard IAB size`,
                code: 'ORTB_NON_STANDARD_BANNER_SIZE',
                actualValue: `${imp.banner?.w}x${imp.banner?.h}`,
                recommendedValue: 'Standard IAB banner size',
                suggestion: 'Consider using standard IAB banner sizes for better fill rates'
              });
            }
          }
        }
      });
    }

    // Rule: Bid floor should be non-negative
    if (request.imp) {
      request.imp.forEach((imp, index) => {
        if (imp.bidfloor !== undefined && imp.bidfloor < 0) {
          errors.push({
            field: `imp.${index}.bidfloor`,
            message: 'Bid floor cannot be negative',
            severity: 'error',
            code: 'ORTB_NEGATIVE_BID_FLOOR',
            type: 'value',
            actualValue: imp.bidfloor,
            expectedValue: 'non-negative number',
            suggestion: 'Set bid floor to 0 or a positive value'
          });
        }
      });
    }

    // Rule: Video duration constraints
    if (request.imp) {
      request.imp.forEach((imp, index) => {
        if (imp.video) {
          if (imp.video.minduration !== undefined && imp.video.maxduration !== undefined) {
            if (imp.video.minduration > imp.video.maxduration) {
              errors.push({
                field: `imp.${index}.video`,
                message: 'Video minimum duration cannot be greater than maximum duration',
                severity: 'error',
                code: 'ORTB_INVALID_VIDEO_DURATION',
                type: 'logical',
                actualValue: { min: imp.video.minduration, max: imp.video.maxduration },
                expectedValue: 'minduration <= maxduration',
                suggestion: 'Ensure minimum duration is less than or equal to maximum duration'
              });
            }
          }

          if (imp.video.minduration !== undefined && imp.video.minduration <= 0) {
            errors.push({
              field: `imp.${index}.video.minduration`,
              message: 'Video minimum duration must be greater than 0',
              severity: 'error',
              code: 'ORTB_INVALID_MIN_DURATION',
              type: 'value',
              actualValue: imp.video.minduration,
              expectedValue: 'positive integer',
              suggestion: 'Set minimum duration to a positive value in seconds'
            });
          }

          if (imp.video.maxduration !== undefined && imp.video.maxduration <= 0) {
            errors.push({
              field: `imp.${index}.video.maxduration`,
              message: 'Video maximum duration must be greater than 0',
              severity: 'error',
              code: 'ORTB_INVALID_MAX_DURATION',
              type: 'value',
              actualValue: imp.video.maxduration,
              expectedValue: 'positive integer',
              suggestion: 'Set maximum duration to a positive value in seconds'
            });
          }
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Check if currency code is valid ISO-4217
   */
  private isValidCurrencyCode(code: string): boolean {
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
      'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR', 'BRL', 'INR', 'KRW', 'PLN',
      'RUB', 'THB', 'CZK', 'DKK', 'HUF', 'ILS', 'CLP', 'PHP', 'AED', 'COP',
      'SAR', 'MYR', 'RON', 'BGN', 'HRK', 'ISK', 'EGP', 'QAR', 'MAD', 'JOD'
    ];
    return validCurrencies.includes(code.toUpperCase());
  }
}