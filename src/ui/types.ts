/**
 * UI Type Definitions
 * Types for validation and sample generation UI components
 */

import { ValidationResult, ValidationError, ValidationWarning, ORTBRequest } from '../models';

// Validation UI Types
export interface ValidationUIState {
  jsonInput: string;
  isValidating: boolean;
  validationResult: ValidationResult | null;
  syntaxErrors: SyntaxError[];
  showDetails: boolean;
}

export interface ValidationInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (request: ORTBRequest) => void;
  isValidating: boolean;
  syntaxErrors: SyntaxError[];
  placeholder?: string;
  height?: string;
}

export interface ValidationResultsProps {
  result: ValidationResult | null;
  isLoading: boolean;
  onToggleDetails: () => void;
  showDetails: boolean;
}

export interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  expandedErrors: Set<string>;
  onToggleError: (errorId: string) => void;
}

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

// Sample Generation UI Types
export interface SampleGenerationUIState {
  selectedTemplate: string | null;
  customConfig: Record<string, any>;
  generatedSample: ORTBRequest | null;
  isGenerating: boolean;
  previewMode: 'formatted' | 'raw';
}

export interface SampleConfigFormProps {
  onGenerate: (config: any) => void;
  isGenerating: boolean;
  availableTemplates: SampleTemplate[];
}

export interface SamplePreviewProps {
  sample: ORTBRequest | null;
  mode: 'formatted' | 'raw';
  onModeChange: (mode: 'formatted' | 'raw') => void;
  onEdit: (sample: ORTBRequest) => void;
}

export interface SampleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
}

// Common UI Types
export interface ToolbarProps {
  mode: 'validation' | 'generation';
  onModeChange: (mode: 'validation' | 'generation') => void;
  onExport: () => void;
  onShare: () => void;
  canExport: boolean;
  canShare: boolean;
}

export interface NavigationProps {
  currentMode: 'validation' | 'generation';
  onNavigate: (mode: 'validation' | 'generation') => void;
  preserveContext: boolean;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeMetadata: boolean;
  anonymize: boolean;
}

export interface ShareOptions {
  generateLink: boolean;
  includeResults: boolean;
  expirationDays: number;
}