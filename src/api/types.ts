/**
 * API Types and Interfaces
 */

import { Request, Response } from 'express';
import { 
  ORTBRequest, 
  ValidationResult, 
  BatchValidationResult,
  ValidationReport,
  ComplianceReport,
  SampleConfig,
  GeneratedSample,
  BatchSampleConfig,
  BatchSampleResult
} from '../models';
import { ExportOptions, ExportResult } from '../services/export-service';

// API Request/Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: APIMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface APIMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  version: string;
}

// Validation API Types
export interface ValidateRequest {
  request: ORTBRequest;
  options?: {
    includeFieldDetails?: boolean;
    includeComplianceReport?: boolean;
    timeout?: number;
  };
}

export interface ValidateResponse extends APIResponse<ValidationResult> {}

export interface ValidateBatchRequest {
  requests: ORTBRequest[];
  options?: {
    includeFieldDetails?: boolean;
    includeComplianceReport?: boolean;
    timeout?: number;
    concurrency?: number;
    failFast?: boolean;
  };
}

export interface ValidateBatchResponse extends APIResponse<BatchValidationResult> {}

// Sample Generation API Types
export interface GenerateRequest {
  config: SampleConfig;
}

export interface GenerateResponse extends APIResponse<GeneratedSample> {}

export interface GenerateBatchRequest {
  config: BatchSampleConfig;
}

export interface GenerateBatchResponse extends APIResponse<BatchSampleResult> {}

export interface TemplatesResponse extends APIResponse<any[]> {}

// Export API Types
export interface ExportRequest {
  data: any;
  options: ExportOptions;
}

export interface ExportResponse extends APIResponse<ExportResult> {}

// Report API Types
export interface ReportRequest {
  validationResult: ValidationResult;
  type: 'validation' | 'compliance';
}

export interface ReportResponse extends APIResponse<ValidationReport | ComplianceReport> {}

// Extended Express types
export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}

export interface APIController {
  [key: string]: any;
}

// API Configuration
export interface APIConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
  };
  auth: {
    required: boolean;
    apiKeys: string[];
  };
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
  };
}

// API Statistics
export interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  endpointStats: Record<string, EndpointStats>;
  rateLimitHits: number;
  authFailures: number;
}

export interface EndpointStats {
  path: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastAccessed: Date;
}