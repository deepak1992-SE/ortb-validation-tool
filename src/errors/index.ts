/**
 * Error Handling Module
 * Centralized error handling, monitoring, and recovery
 */

export * from './error-handler';
export * from './error-monitor';
export * from './error-recovery';

// Re-export commonly used types
export type {
  ApplicationError,
  ErrorRecoveryAction,
  ErrorContext,
  ApplicationLayer,
  ErrorSeverity,
  ErrorCategory
} from './error-handler';

export type {
  ErrorMetrics,
  ErrorAlert,
  MonitoringConfig
} from './error-monitor';

export type {
  RecoveryStrategy,
  RecoveryResult,
  RecoveryContext
} from './error-recovery';

// Export singleton instances
export { globalErrorHandler } from './error-handler';
export { errorRecoveryManager } from './error-recovery';
export { defaultMonitoringConfig } from './error-monitor';