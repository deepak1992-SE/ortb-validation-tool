/**
 * Error Recovery System
 * Provides automatic and manual error recovery mechanisms
 */

import { ApplicationError, ErrorRecoveryAction, ApplicationLayer, ErrorCategory } from './error-handler';

export interface RecoveryStrategy {
  /** Strategy identifier */
  id: string;
  /** Strategy name */
  name: string;
  /** Strategy description */
  description: string;
  /** Applicable error categories */
  applicableCategories: ErrorCategory[];
  /** Applicable layers */
  applicableLayers: ApplicationLayer[];
  /** Recovery function */
  recover: (error: ApplicationError, context?: RecoveryContext) => Promise<RecoveryResult>;
  /** Whether strategy can be applied automatically */
  automatic: boolean;
  /** Priority (higher number = higher priority) */
  priority: number;
  /** Maximum retry attempts */
  maxRetries: number;
}

export interface RecoveryContext {
  /** Original operation that failed */
  originalOperation?: () => Promise<any>;
  /** Fallback data or configuration */
  fallbackData?: any;
  /** User preferences for recovery */
  userPreferences?: RecoveryPreferences;
  /** Additional context data */
  metadata?: Record<string, any>;
}

export interface RecoveryPreferences {
  /** Allow automatic recovery */
  allowAutomatic: boolean;
  /** Preferred recovery strategies */
  preferredStrategies: string[];
  /** Maximum retry attempts */
  maxRetries: number;
  /** Timeout for recovery operations */
  timeout: number;
}

export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** Result data if recovery succeeded */
  data?: any;
  /** Error if recovery failed */
  error?: Error;
  /** Strategy used for recovery */
  strategyUsed: string;
  /** Time taken for recovery */
  recoveryTime: number;
  /** Whether manual intervention is needed */
  requiresManualIntervention: boolean;
  /** Additional recovery actions available */
  additionalActions: ErrorRecoveryAction[];
  /** Recovery message */
  message: string;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries (ms) */
  baseDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Maximum delay between retries (ms) */
  maxDelay: number;
  /** Jitter factor (0-1) */
  jitter: number;
}

export class ErrorRecoveryManager {
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private recoveryHistory: RecoveryAttempt[] = [];
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000,
    jitter: 0.1
  };

  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Register a recovery strategy
   */
  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(
    error: ApplicationError,
    context?: RecoveryContext
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const applicableStrategies = this.getApplicableStrategies(error);

    if (applicableStrategies.length === 0) {
      return {
        success: false,
        error: new Error('No applicable recovery strategies found'),
        strategyUsed: 'none',
        recoveryTime: Date.now() - startTime,
        requiresManualIntervention: true,
        additionalActions: this.generateManualActions(error),
        message: 'No automatic recovery available. Manual intervention required.'
      };
    }

    // Try strategies in priority order
    for (const strategy of applicableStrategies) {
      try {
        const result = await this.executeStrategy(strategy, error, context);
        
        // Record recovery attempt
        this.recordRecoveryAttempt({
          errorId: error.id,
          strategyId: strategy.id,
          success: result.success,
          timestamp: new Date(),
          recoveryTime: result.recoveryTime,
          error: result.error
        });

        if (result.success) {
          return result;
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.id} failed:`, recoveryError);
        
        // Record failed attempt
        this.recordRecoveryAttempt({
          errorId: error.id,
          strategyId: strategy.id,
          success: false,
          timestamp: new Date(),
          recoveryTime: Date.now() - startTime,
          error: recoveryError as Error
        });
      }
    }

    // All strategies failed
    return {
      success: false,
      error: new Error('All recovery strategies failed'),
      strategyUsed: 'multiple-failed',
      recoveryTime: Date.now() - startTime,
      requiresManualIntervention: true,
      additionalActions: this.generateManualActions(error),
      message: 'Automatic recovery failed. Please try manual recovery options.'
    };
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
        const jitter = baseDelay * retryConfig.jitter * Math.random();
        const delay = Math.min(baseDelay + jitter, retryConfig.maxDelay);

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error: ApplicationError): ErrorRecoveryAction[] {
    const strategies = this.getApplicableStrategies(error);
    const actions: ErrorRecoveryAction[] = [];

    // Add strategy-based actions
    strategies.forEach(strategy => {
      actions.push({
        id: `strategy-${strategy.id}`,
        description: strategy.description,
        type: strategy.automatic ? 'system-action' : 'user-action',
        requiresUserAction: !strategy.automatic,
        execute: strategy.automatic ? 
          async () => { await this.executeStrategy(strategy, error); } : 
          undefined
      });
    });

    // Add general recovery actions
    actions.push(...this.generateManualActions(error));

    return actions;
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory(errorId?: string): RecoveryAttempt[] {
    if (errorId) {
      return this.recoveryHistory.filter(attempt => attempt.errorId === errorId);
    }
    return [...this.recoveryHistory];
  }

  /**
   * Clear recovery history
   */
  clearRecoveryHistory(): void {
    this.recoveryHistory = [];
  }

  /**
   * Get applicable strategies for an error
   */
  private getApplicableStrategies(error: ApplicationError): RecoveryStrategy[] {
    return Array.from(this.strategies.values())
      .filter(strategy => 
        strategy.applicableCategories.includes(error.category) &&
        strategy.applicableLayers.includes(error.layer)
      )
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute a recovery strategy
   */
  private async executeStrategy(
    strategy: RecoveryStrategy,
    error: ApplicationError,
    context?: RecoveryContext
  ): Promise<RecoveryResult> {
    const startTime = Date.now();

    try {
      const result = await strategy.recover(error, context);
      result.recoveryTime = Date.now() - startTime;
      result.strategyUsed = strategy.id;
      return result;
    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError as Error,
        strategyUsed: strategy.id,
        recoveryTime: Date.now() - startTime,
        requiresManualIntervention: true,
        additionalActions: [],
        message: `Recovery strategy ${strategy.name} failed: ${(recoveryError as Error).message}`
      };
    }
  }

  /**
   * Generate manual recovery actions
   */
  private generateManualActions(error: ApplicationError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.category) {
      case 'validation':
        actions.push({
          id: 'fix-validation-errors',
          description: 'Review and fix validation errors in your request',
          type: 'user-action',
          requiresUserAction: true
        });
        actions.push({
          id: 'use-sample-generator',
          description: 'Generate a valid sample request as reference',
          type: 'user-action',
          requiresUserAction: true
        });
        break;

      case 'authentication':
        actions.push({
          id: 'check-api-key',
          description: 'Verify your API key is correct and active',
          type: 'user-action',
          requiresUserAction: true
        });
        break;

      case 'rate-limit':
        actions.push({
          id: 'wait-and-retry',
          description: 'Wait a few minutes and try again',
          type: 'user-action',
          requiresUserAction: true
        });
        break;

      case 'network':
        actions.push({
          id: 'check-connection',
          description: 'Check your internet connection',
          type: 'user-action',
          requiresUserAction: true
        });
        break;
    }

    return actions;
  }

  /**
   * Record recovery attempt
   */
  private recordRecoveryAttempt(attempt: RecoveryAttempt): void {
    this.recoveryHistory.push(attempt);
    
    // Keep only last 100 attempts
    if (this.recoveryHistory.length > 100) {
      this.recoveryHistory = this.recoveryHistory.slice(-100);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultStrategies(): void {
    // Retry strategy for network errors
    this.registerStrategy({
      id: 'network-retry',
      name: 'Network Retry',
      description: 'Retry the operation after a brief delay',
      applicableCategories: ['network'],
      applicableLayers: ['api', 'service'],
      automatic: true,
      priority: 10,
      maxRetries: 3,
      recover: async (error: ApplicationError, context?: RecoveryContext) => {
        if (context?.originalOperation) {
          try {
            const data = await this.retryWithBackoff(context.originalOperation, {
              maxAttempts: 3,
              baseDelay: 1000
            });
            return {
              success: true,
              data,
              strategyUsed: 'network-retry',
              recoveryTime: 0,
              requiresManualIntervention: false,
              additionalActions: [],
              message: 'Operation succeeded after retry'
            };
          } catch (retryError) {
            return {
              success: false,
              error: retryError as Error,
              strategyUsed: 'network-retry',
              recoveryTime: 0,
              requiresManualIntervention: true,
              additionalActions: [],
              message: 'Retry failed. Manual intervention required.'
            };
          }
        }
        
        return {
          success: false,
          error: new Error('No operation to retry'),
          strategyUsed: 'network-retry',
          recoveryTime: 0,
          requiresManualIntervention: true,
          additionalActions: [],
          message: 'Cannot retry without original operation'
        };
      }
    });

    // Fallback data strategy
    this.registerStrategy({
      id: 'fallback-data',
      name: 'Fallback Data',
      description: 'Use fallback data when primary data is unavailable',
      applicableCategories: ['system', 'network'],
      applicableLayers: ['service', 'validation'],
      automatic: true,
      priority: 5,
      maxRetries: 1,
      recover: async (error: ApplicationError, context?: RecoveryContext) => {
        if (context?.fallbackData) {
          return {
            success: true,
            data: context.fallbackData,
            strategyUsed: 'fallback-data',
            recoveryTime: 0,
            requiresManualIntervention: false,
            additionalActions: [],
            message: 'Using fallback data'
          };
        }
        
        return {
          success: false,
          error: new Error('No fallback data available'),
          strategyUsed: 'fallback-data',
          recoveryTime: 0,
          requiresManualIntervention: true,
          additionalActions: [],
          message: 'No fallback data configured'
        };
      }
    });

    // Rate limit backoff strategy
    this.registerStrategy({
      id: 'rate-limit-backoff',
      name: 'Rate Limit Backoff',
      description: 'Wait and retry when rate limited',
      applicableCategories: ['rate-limit'],
      applicableLayers: ['api'],
      automatic: true,
      priority: 8,
      maxRetries: 2,
      recover: async (error: ApplicationError, context?: RecoveryContext) => {
        // Wait for rate limit to reset (typically 1 minute)
        await this.sleep(60000);
        
        if (context?.originalOperation) {
          try {
            const data = await context.originalOperation();
            return {
              success: true,
              data,
              strategyUsed: 'rate-limit-backoff',
              recoveryTime: 60000,
              requiresManualIntervention: false,
              additionalActions: [],
              message: 'Operation succeeded after rate limit reset'
            };
          } catch (retryError) {
            return {
              success: false,
              error: retryError as Error,
              strategyUsed: 'rate-limit-backoff',
              recoveryTime: 60000,
              requiresManualIntervention: true,
              additionalActions: [],
              message: 'Still rate limited. Please wait longer.'
            };
          }
        }
        
        return {
          success: false,
          error: new Error('No operation to retry'),
          strategyUsed: 'rate-limit-backoff',
          recoveryTime: 60000,
          requiresManualIntervention: true,
          additionalActions: [],
          message: 'Rate limit period passed, but no operation to retry'
        };
      }
    });
  }
}

interface RecoveryAttempt {
  errorId: string;
  strategyId: string;
  success: boolean;
  timestamp: Date;
  recoveryTime: number;
  error?: Error;
}

// Export singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();