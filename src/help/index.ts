/**
 * Help System Module
 * Comprehensive user guidance and help system for ORTB validation
 */

export * from './field-help';
export * from './guided-validation';
export * from './best-practices';

// Re-export commonly used types
export type {
  FieldHelp,
  FieldHelpExample,
  FieldError,
  RelatedField,
  UsageGuidance,
  HelpSearchResult
} from './field-help';

export type {
  GuidedValidationSession,
  GuidedValidationStep,
  ValidationProgress,
  ValidationFeedback,
  ValidationTip,
  SessionSummary
} from './guided-validation';

export type {
  BestPractice,
  BestPracticeCategory,
  BestPracticeGuide,
  PracticeExample,
  CommonMistake,
  PerformanceImpact
} from './best-practices';

// Export singleton instances
export { fieldHelpSystem } from './field-help';
export { guidedValidationSystem } from './guided-validation';
export { bestPracticesSystem } from './best-practices';