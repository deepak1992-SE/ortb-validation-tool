/**
 * Error Recovery Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ErrorRecoveryManager, RecoveryStrategy, RecoveryContext } from '../error-recovery';
import { ApplicationError } from '../error-handler';

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager;

  beforeEach(() => {
    recoveryManager = new ErrorRecoveryManager();
  });

  const createTestError = (overrides: Partial<ApplicationError> = {}): ApplicationError => ({
    id: `error-${Date.now()}-${Math.random()}`,
    code: 'TEST_ERROR',
    message: 'Test error message',
    userMessage: 'Test user message',
    severity: 'error',
    category: 'validation',
    layer: 'api',
    timestamp: new Date(),
    recoverySuggestions: [],
    retryable: false,
    ...overrides
  });

  describe('strategy registration', () => {
    test('should register custom recovery strategy', () => {
      const customStrategy: RecoveryStrategy = {
        id: 'custom-strategy',
        name: 'Custom Strategy',
        description: 'Custom recovery strategy',
        applicableCategories: ['validation'],
        applicableLayers: ['api'],
        automatic: true,
        priority: 5,
        maxRetries: 2,
        recover: async () => ({
          success: true,
          strategyUsed: 'custom-strategy',
          recoveryTime: 100,
          requiresManualIntervention: false,
          additionalActions: [],
          message: 'Recovery successful'
        })
      };

      recoveryManager.registerStrategy(customStrategy);

      const error = createTestError({ category: 'validation', layer: 'api' });
      const suggestions = recoveryManager.getRecoverySuggestions(error);

      expect(suggestions.some(action => action.id === 'strategy-custom-strategy')).toBe(true);
    });
  });

  describe('attemptRecovery', () => {
    test('should attempt recovery with applicable strategies', async () => {
      const error = createTestError({ 
        category: 'network', 
        layer: 'api',
        retryable: true
      });

      const mockOperation = vi.fn().mockResolvedValue('success');
      const context: RecoveryContext = {
        originalOperation: mockOperation
      };

      const result = await recoveryManager.attemptRecovery(error, context);

      expect(result.success).toBe(true);
      expect(result.strategyUsed).toBe('network-retry');
      expect(result.data).toBe('success');
      expect(mockOperation).toHaveBeenCalled();
    });

    test('should return failure when no applicable strategies exist', async () => {
      const error = createTestError({ 
        category: 'user-input', 
        layer: 'ui' // No strategies for UI layer
      });

      const result = await recoveryManager.attemptRecovery(error);

      expect(result.success).toBe(false);
      expect(result.strategyUsed).toBe('none');
      expect(result.requiresManualIntervention).toBe(true);
      expect(result.additionalActions.length).toBeGreaterThan(0);
    });

    test('should try multiple strategies in priority order', async () => {
      const error = createTestError({ 
        category: 'system', 
        layer: 'service',
        retryable: true
      });

      // Mock fallback data strategy to fail, network retry to succeed
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Still failing'))
        .mockResolvedValueOnce('success');

      const context: RecoveryContext = {
        originalOperation: mockOperation,
        fallbackData: { fallback: true }
      };

      const result = await recoveryManager.attemptRecovery(error, context);

      expect(result.success).toBe(true);
      expect(result.strategyUsed).toBe('fallback-data');
      expect(result.data).toEqual({ fallback: true });
    });

    test('should record recovery attempts', async () => {
      const error = createTestError({ 
        category: 'network', 
        layer: 'api',
        retryable: true
      });

      const mockOperation = vi.fn().mockResolvedValue('success');
      const context: RecoveryContext = {
        originalOperation: mockOperation
      };

      await recoveryManager.attemptRecovery(error, context);

      const history = recoveryManager.getRecoveryHistory(error.id);
      expect(history.length).toBe(1);
      expect(history[0].errorId).toBe(error.id);
      expect(history[0].strategyId).toBe('network-retry');
      expect(history[0].success).toBe(true);
    });
  });

  describe('retryWithBackoff', () => {
    test('should retry operation with exponential backoff', async () => {
      let attempts = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Operation failed');
        }
        return Promise.resolve('success');
      });

      const result = await recoveryManager.retryWithBackoff(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10, // Short delay for testing
        backoffMultiplier: 2,
        maxDelay: 1000,
        jitter: 0
      });

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max attempts', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        recoveryManager.retryWithBackoff(mockOperation, {
          maxAttempts: 2,
          baseDelay: 10,
          backoffMultiplier: 2,
          maxDelay: 1000,
          jitter: 0
        })
      ).rejects.toThrow('Always fails');

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('should apply jitter to delay', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail once'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      
      await recoveryManager.retryWithBackoff(mockOperation, {
        maxAttempts: 2,
        baseDelay: 100,
        backoffMultiplier: 1,
        maxDelay: 1000,
        jitter: 0.5 // 50% jitter
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay due to jitter, but less than max possible
      expect(duration).toBeGreaterThan(50); // At least some delay
      expect(duration).toBeLessThan(200); // But not too much
    });
  });

  describe('getRecoverySuggestions', () => {
    test('should provide recovery suggestions for validation errors', () => {
      const error = createTestError({ 
        category: 'validation', 
        layer: 'validation' 
      });

      const suggestions = recoveryManager.getRecoverySuggestions(error);

      expect(suggestions.some(action => 
        action.description.includes('validation errors')
      )).toBe(true);
      expect(suggestions.some(action => 
        action.description.includes('sample request')
      )).toBe(true);
    });

    test('should provide recovery suggestions for authentication errors', () => {
      const error = createTestError({ 
        category: 'authentication', 
        layer: 'api' 
      });

      const suggestions = recoveryManager.getRecoverySuggestions(error);

      expect(suggestions.some(action => 
        action.description.includes('API key')
      )).toBe(true);
    });

    test('should provide recovery suggestions for rate limit errors', () => {
      const error = createTestError({ 
        category: 'rate-limit', 
        layer: 'api' 
      });

      const suggestions = recoveryManager.getRecoverySuggestions(error);

      expect(suggestions.some(action => 
        action.description.includes('wait')
      )).toBe(true);
    });

    test('should provide recovery suggestions for network errors', () => {
      const error = createTestError({ 
        category: 'network', 
        layer: 'api' 
      });

      const suggestions = recoveryManager.getRecoverySuggestions(error);

      expect(suggestions.some(action => 
        action.description.includes('connection')
      )).toBe(true);
    });
  });

  describe('default strategies', () => {
    test('should have network retry strategy', async () => {
      const error = createTestError({ 
        category: 'network', 
        layer: 'api',
        retryable: true
      });

      const mockOperation = vi.fn().mockResolvedValue('success');
      const context: RecoveryContext = {
        originalOperation: mockOperation
      };

      const result = await recoveryManager.attemptRecovery(error, context);

      expect(result.success).toBe(true);
      expect(result.strategyUsed).toBe('network-retry');
    });

    test('should have fallback data strategy', async () => {
      const error = createTestError({ 
        category: 'system', 
        layer: 'service' 
      });

      const context: RecoveryContext = {
        fallbackData: { message: 'fallback' }
      };

      const result = await recoveryManager.attemptRecovery(error, context);

      expect(result.success).toBe(true);
      expect(result.strategyUsed).toBe('fallback-data');
      expect(result.data).toEqual({ message: 'fallback' });
    });

    test('should have rate limit backoff strategy', async () => {
      const error = createTestError({ 
        category: 'rate-limit', 
        layer: 'api' 
      });

      const mockOperation = vi.fn().mockResolvedValue('success');
      const context: RecoveryContext = {
        originalOperation: mockOperation
      };

      // Mock setTimeout to avoid actual delay in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((fn) => {
        fn();
        return 1;
      });

      const result = await recoveryManager.attemptRecovery(error, context);

      expect(result.success).toBe(true);
      expect(result.strategyUsed).toBe('rate-limit-backoff');

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('recovery history', () => {
    test('should maintain recovery history', async () => {
      const error1 = createTestError({ 
        id: 'error-1',
        category: 'network', 
        layer: 'api' 
      });
      const error2 = createTestError({ 
        id: 'error-2',
        category: 'system', 
        layer: 'service' 
      });

      const mockOperation = vi.fn().mockResolvedValue('success');
      
      await recoveryManager.attemptRecovery(error1, { originalOperation: mockOperation });
      await recoveryManager.attemptRecovery(error2, { fallbackData: {} });

      const allHistory = recoveryManager.getRecoveryHistory();
      expect(allHistory.length).toBe(2);

      const error1History = recoveryManager.getRecoveryHistory('error-1');
      expect(error1History.length).toBe(1);
      expect(error1History[0].errorId).toBe('error-1');

      const error2History = recoveryManager.getRecoveryHistory('error-2');
      expect(error2History.length).toBe(1);
      expect(error2History[0].errorId).toBe('error-2');
    });

    test('should clear recovery history', async () => {
      const error = createTestError({ 
        category: 'network', 
        layer: 'api' 
      });

      await recoveryManager.attemptRecovery(error, { 
        originalOperation: vi.fn().mockResolvedValue('success') 
      });

      expect(recoveryManager.getRecoveryHistory().length).toBe(1);

      recoveryManager.clearRecoveryHistory();

      expect(recoveryManager.getRecoveryHistory().length).toBe(0);
    });

    test('should limit recovery history size', async () => {
      // Create many recovery attempts
      for (let i = 0; i < 150; i++) {
        const error = createTestError({ 
          id: `error-${i}`,
          category: 'system', 
          layer: 'service' 
        });
        
        await recoveryManager.attemptRecovery(error, { 
          fallbackData: { attempt: i } 
        });
      }

      const history = recoveryManager.getRecoveryHistory();
      expect(history.length).toBe(100); // Should be limited to 100
      
      // Should keep the most recent attempts
      expect(history[history.length - 1].errorId).toBe('error-149');
    });
  });
});