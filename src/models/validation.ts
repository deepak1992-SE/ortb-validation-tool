/**
 * Validation Result Interfaces
 * Defines the structure for validation results and error reporting
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ComplianceLevel = 'compliant' | 'partial' | 'non-compliant';
export type ErrorType = 'schema' | 'required-field' | 'format' | 'value' | 'logical';

export interface ValidationError {
  /** The field path where the error occurred (e.g., "imp.0.banner.w") */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Severity level of the error */
  severity: ValidationSeverity;
  /** Error code for programmatic handling */
  code: string;
  /** Optional suggestion for fixing the error */
  suggestion?: string;
  /** The type of validation error */
  type: ErrorType;
  /** The actual value that caused the error */
  actualValue?: any;
  /** The expected value or format */
  expectedValue?: any;
}

export interface ValidationWarning {
  /** The field path where the warning occurred */
  field: string;
  /** Human-readable warning message */
  message: string;
  /** Warning code for programmatic handling */
  code: string;
  /** Optional suggestion for improvement */
  suggestion?: string;
  /** The actual value that triggered the warning */
  actualValue?: any;
  /** The recommended value or format */
  recommendedValue?: any;
}

export interface ValidationResult {
  /** Whether the ORTB request is valid */
  isValid: boolean;
  /** Array of validation errors found */
  errors: ValidationError[];
  /** Array of validation warnings found */
  warnings: ValidationWarning[];
  /** Overall compliance level with OpenRTB 2.6 specification */
  complianceLevel: ComplianceLevel;
  /** List of field paths that were successfully validated */
  validatedFields: string[];
  /** Compliance score as a percentage (0-100) */
  complianceScore: number;
  /** Timestamp when validation was performed */
  timestamp: Date;
  /** Unique identifier for this validation result */
  validationId: string;
  /** Version of OpenRTB specification used for validation */
  specVersion: string;
}

export interface BatchValidationResult {
  /** Array of individual validation results */
  results: ValidationResult[];
  /** Summary statistics for the batch */
  summary: BatchValidationSummary;
  /** Overall batch compliance score */
  overallComplianceScore: number;
  /** Timestamp when batch validation was performed */
  timestamp: Date;
  /** Unique identifier for this batch validation */
  batchId: string;
}

export interface BatchValidationSummary {
  /** Total number of requests validated */
  totalRequests: number;
  /** Number of valid requests */
  validRequests: number;
  /** Number of invalid requests */
  invalidRequests: number;
  /** Number of requests with warnings only */
  warningRequests: number;
  /** Most common error types found */
  commonErrors: ErrorFrequency[];
  /** Most common warning types found */
  commonWarnings: WarningFrequency[];
  /** Average compliance score across all requests */
  averageComplianceScore: number;
}

export interface ErrorFrequency {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Number of times this error occurred */
  count: number;
  /** Percentage of requests that had this error */
  percentage: number;
}

export interface WarningFrequency {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Number of times this warning occurred */
  count: number;
  /** Percentage of requests that had this warning */
  percentage: number;
}

export interface FieldValidationResult {
  /** The field path that was validated */
  fieldPath: string;
  /** Whether this specific field is valid */
  isValid: boolean;
  /** Field-specific errors */
  errors: ValidationError[];
  /** Field-specific warnings */
  warnings: ValidationWarning[];
  /** Whether this field is required by the specification */
  isRequired: boolean;
  /** Whether this field was present in the request */
  isPresent: boolean;
  /** The actual value of the field */
  actualValue?: any;
  /** Field definition from the specification */
  fieldDefinition?: FieldDefinition;
}

export type FieldRequirementLevel = 'required' | 'optional' | 'recommended';

export interface FieldDefinition {
  /** Field name */
  name: string;
  /** Full field path (e.g., "imp.banner.w") */
  path: string;
  /** Field description from OpenRTB specification */
  description: string;
  /** Data type of the field */
  type: string;
  /** Field requirement level */
  requirementLevel: FieldRequirementLevel;
  /** Whether the field is required (legacy support) */
  required: boolean;
  /** Possible values for enumerated fields */
  enumValues?: string[] | number[];
  /** Minimum value for numeric fields */
  minimum?: number;
  /** Maximum value for numeric fields */
  maximum?: number;
  /** Pattern for string fields */
  pattern?: string;
  /** Example values with descriptions */
  examples?: FieldExample[];
  /** Default value if not specified */
  defaultValue?: any;
  /** Additional documentation and context */
  documentation?: FieldDocumentation;
  /** Parent field path (for nested fields) */
  parentPath?: string;
  /** Child field paths (for object/array fields) */
  childPaths?: string[];
}

export interface FieldExample {
  /** Example value */
  value: any;
  /** Description of when to use this value */
  description: string;
  /** Whether this is a recommended example */
  recommended?: boolean;
}

export interface FieldDocumentation {
  /** Detailed explanation of the field */
  longDescription?: string;
  /** Usage notes and best practices */
  usageNotes?: string;
  /** Related fields that work together */
  relatedFields?: string[];
  /** OpenRTB specification section reference */
  specSection?: string;
  /** Common validation errors for this field */
  commonErrors?: string[];
  /** When this field is typically used */
  usageContext?: string;
}

export interface ValidationReport {
  /** Summary of validation results */
  summary: ValidationSummary;
  /** Detailed field-by-field results */
  fieldResults: FieldValidationResult[];
  /** Overall compliance score */
  complianceScore: number;
  /** Recommendations for improvement */
  recommendations: string[];
  /** Timestamp of report generation */
  timestamp: Date;
  /** Report metadata */
  metadata: ReportMetadata;
}

export interface ValidationSummary {
  /** Total number of fields validated */
  totalFields: number;
  /** Number of valid fields */
  validFields: number;
  /** Number of fields with errors */
  errorFields: number;
  /** Number of fields with warnings */
  warningFields: number;
  /** Number of required fields missing */
  missingRequiredFields: number;
  /** Overall validation status */
  status: 'passed' | 'failed' | 'warning';
}

export interface ReportMetadata {
  /** Report generation timestamp */
  generatedAt: Date;
  /** Version of the validation tool */
  toolVersion: string;
  /** OpenRTB specification version used */
  specVersion: string;
  /** Report format version */
  reportVersion: string;
  /** Additional metadata */
  additionalInfo?: Record<string, any>;
}

export interface ComplianceReport {
  /** Overall compliance assessment */
  overallCompliance: ComplianceLevel;
  /** Compliance score (0-100) */
  complianceScore: number;
  /** Compliance by category */
  categoryCompliance: CategoryCompliance[];
  /** Critical issues that must be addressed */
  criticalIssues: ValidationError[];
  /** Recommendations for achieving full compliance */
  recommendations: ComplianceRecommendation[];
  /** Timestamp of compliance assessment */
  timestamp: Date;
}

export interface CategoryCompliance {
  /** Category name (e.g., "Required Fields", "Format Validation") */
  category: string;
  /** Compliance level for this category */
  compliance: ComplianceLevel;
  /** Score for this category (0-100) */
  score: number;
  /** Number of issues in this category */
  issueCount: number;
  /** Details about issues in this category */
  issues: ValidationError[];
}

export interface ComplianceRecommendation {
  /** Priority level of the recommendation */
  priority: 'high' | 'medium' | 'low';
  /** Recommendation title */
  title: string;
  /** Detailed recommendation description */
  description: string;
  /** Fields affected by this recommendation */
  affectedFields: string[];
  /** Expected impact on compliance score */
  impactScore: number;
}