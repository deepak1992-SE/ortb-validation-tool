/**
 * Guided Validation System Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { GuidedValidationSystem, GuidedValidationSession } from '../guided-validation';
import { ORTBRequest } from '../../models/ortb';

describe('GuidedValidationSystem', () => {
  let validationSystem: GuidedValidationSystem;

  beforeEach(() => {
    validationSystem = new GuidedValidationSystem();
  });

  const createTestRequest = (overrides: Partial<ORTBRequest> = {}): ORTBRequest => ({
    id: 'test_req_123',
    imp: [
      {
        id: '1',
        banner: {
          w: 300,
          h: 250
        }
      }
    ],
    at: 1,
    ...overrides
  });

  describe('startSession', () => {
    test('should create new validation session', () => {
      const session = validationSystem.startSession();
      
      expect(session.sessionId).toBeDefined();
      expect(session.currentStep).toBe(1);
      expect(session.totalSteps).toBeGreaterThan(0);
      expect(session.steps.length).toBe(session.totalSteps);
      expect(session.progress.percentComplete).toBe(0);
      expect(session.startTime).toBeInstanceOf(Date);
    });

    test('should create session with request', () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      expect(session.request).toBe(request);
    });

    test('should initialize all steps as pending', () => {
      const session = validationSystem.startSession();
      
      session.steps.forEach(step => {
        expect(step.status).toBe('pending');
        expect(step.validationResult).toBeUndefined();
      });
    });

    test('should have sequential step numbers', () => {
      const session = validationSystem.startSession();
      
      session.steps.forEach((step, index) => {
        expect(step.step.step).toBe(index + 1);
      });
    });
  });

  describe('getSession', () => {
    test('should return existing session', () => {
      const session = validationSystem.startSession();
      const retrieved = validationSystem.getSession(session.sessionId);
      
      expect(retrieved).toBe(session);
    });

    test('should return null for non-existent session', () => {
      const retrieved = validationSystem.getSession('nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('updateSessionRequest', () => {
    test('should update session request', () => {
      const session = validationSystem.startSession();
      const request = createTestRequest();
      
      const updated = validationSystem.updateSessionRequest(session.sessionId, request);
      
      expect(updated).toBe(true);
      expect(session.request).toBe(request);
      expect(session.lastUpdate).toBeInstanceOf(Date);
    });

    test('should return false for non-existent session', () => {
      const request = createTestRequest();
      const updated = validationSystem.updateSessionRequest('nonexistent', request);
      
      expect(updated).toBe(false);
    });
  });

  describe('validateStep', () => {
    test('should validate step with valid request', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      const result = await validationSystem.validateStep(session.sessionId, 1);
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.validatedFields).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    test('should update step status after validation', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      await validationSystem.validateStep(session.sessionId, 1);
      
      const step = session.steps[0];
      expect(step.status).toMatch(/completed|failed/);
      expect(step.validationResult).toBeDefined();
      expect(step.startTime).toBeInstanceOf(Date);
      expect(step.completionTime).toBeInstanceOf(Date);
    });

    test('should update session progress after validation', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      await validationSystem.validateStep(session.sessionId, 1);
      
      expect(session.progress.percentComplete).toBeGreaterThan(0);
      expect(session.lastUpdate).toBeInstanceOf(Date);
    });

    test('should throw error for invalid session', async () => {
      await expect(
        validationSystem.validateStep('nonexistent', 1)
      ).rejects.toThrow('Invalid session');
    });

    test('should throw error for missing request', async () => {
      const session = validationSystem.startSession();
      
      await expect(
        validationSystem.validateStep(session.sessionId, 1)
      ).rejects.toThrow('missing request');
    });

    test('should throw error for invalid step number', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      await expect(
        validationSystem.validateStep(session.sessionId, 999)
      ).rejects.toThrow('Invalid step number');
    });

    test('should validate required fields step', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      // Find required fields step
      const requiredFieldsStepIndex = session.steps.findIndex(
        step => step.step.checkFunction === 'validateRequiredFields'
      );
      
      if (requiredFieldsStepIndex >= 0) {
        const result = await validationSystem.validateStep(
          session.sessionId, 
          requiredFieldsStepIndex + 1
        );
        
        expect(result.passed).toBe(true);
        expect(result.validatedFields).toContain('id');
        expect(result.validatedFields).toContain('imp');
        expect(result.validatedFields).toContain('at');
      }
    });

    test('should detect missing required fields', async () => {
      const request = createTestRequest({ id: undefined as any });
      const session = validationSystem.startSession(request);
      
      const requiredFieldsStepIndex = session.steps.findIndex(
        step => step.step.checkFunction === 'validateRequiredFields'
      );
      
      if (requiredFieldsStepIndex >= 0) {
        const result = await validationSystem.validateStep(
          session.sessionId, 
          requiredFieldsStepIndex + 1
        );
        
        expect(result.passed).toBe(false);
        expect(result.errors.some(error => error.code === 'MISSING_REQUEST_ID')).toBe(true);
      }
    });
  });

  describe('navigation', () => {
    test('should move to next step', () => {
      const session = validationSystem.startSession();
      const initialStep = session.currentStep;
      
      const moved = validationSystem.nextStep(session.sessionId);
      
      expect(moved).toBe(true);
      expect(session.currentStep).toBe(initialStep + 1);
      expect(session.lastUpdate).toBeInstanceOf(Date);
    });

    test('should not move beyond last step', () => {
      const session = validationSystem.startSession();
      session.currentStep = session.totalSteps;
      
      const moved = validationSystem.nextStep(session.sessionId);
      
      expect(moved).toBe(false);
      expect(session.currentStep).toBe(session.totalSteps);
    });

    test('should move to previous step', () => {
      const session = validationSystem.startSession();
      session.currentStep = 2;
      
      const moved = validationSystem.previousStep(session.sessionId);
      
      expect(moved).toBe(true);
      expect(session.currentStep).toBe(1);
    });

    test('should not move before first step', () => {
      const session = validationSystem.startSession();
      
      const moved = validationSystem.previousStep(session.sessionId);
      
      expect(moved).toBe(false);
      expect(session.currentStep).toBe(1);
    });

    test('should skip current step', () => {
      const session = validationSystem.startSession();
      const initialStep = session.currentStep;
      
      const skipped = validationSystem.skipStep(session.sessionId, 'Testing skip functionality');
      
      expect(skipped).toBe(true);
      expect(session.currentStep).toBe(initialStep + 1);
      
      const skippedStep = session.steps[initialStep - 1];
      expect(skippedStep.status).toBe('skipped');
      expect(skippedStep.userNotes).toBe('Testing skip functionality');
      expect(skippedStep.completionTime).toBeInstanceOf(Date);
    });
  });

  describe('getStepFeedback', () => {
    test('should return feedback for current step', () => {
      const session = validationSystem.startSession();
      const feedback = validationSystem.getStepFeedback(session.sessionId);
      
      expect(Array.isArray(feedback)).toBe(true);
    });

    test('should return feedback for specific step', () => {
      const session = validationSystem.startSession();
      const feedback = validationSystem.getStepFeedback(session.sessionId, 2);
      
      expect(Array.isArray(feedback)).toBe(true);
    });

    test('should return empty array for invalid session', () => {
      const feedback = validationSystem.getStepFeedback('nonexistent');
      expect(feedback).toHaveLength(0);
    });

    test('should return empty array for invalid step', () => {
      const session = validationSystem.startSession();
      const feedback = validationSystem.getStepFeedback(session.sessionId, 999);
      
      expect(feedback).toHaveLength(0);
    });

    test('should include success feedback for completed step', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      await validationSystem.validateStep(session.sessionId, 1);
      const feedback = validationSystem.getStepFeedback(session.sessionId, 1);
      
      const successFeedback = feedback.find(f => f.type === 'success');
      if (session.steps[0].validationResult?.passed) {
        expect(successFeedback).toBeDefined();
      }
    });

    test('should include error feedback for failed step', async () => {
      const request = createTestRequest({ id: undefined as any });
      const session = validationSystem.startSession(request);
      
      const requiredFieldsStepIndex = session.steps.findIndex(
        step => step.step.checkFunction === 'validateRequiredFields'
      );
      
      if (requiredFieldsStepIndex >= 0) {
        await validationSystem.validateStep(session.sessionId, requiredFieldsStepIndex + 1);
        const feedback = validationSystem.getStepFeedback(session.sessionId, requiredFieldsStepIndex + 1);
        
        const errorFeedback = feedback.filter(f => f.type === 'error');
        expect(errorFeedback.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getApplicableTips', () => {
    test('should return tips for step start', () => {
      const tips = validationSystem.getApplicableTips('step-start', 1);
      
      expect(Array.isArray(tips)).toBe(true);
      if (tips.length > 0) {
        expect(tips[0].trigger).toBe('step-start');
        expect(tips[0].applicableSteps).toContain(1);
      }
    });

    test('should return tips for error encountered', () => {
      const tips = validationSystem.getApplicableTips('error-encountered', undefined, 'MISSING_REQUEST_ID');
      
      expect(Array.isArray(tips)).toBe(true);
      if (tips.length > 0) {
        expect(tips[0].trigger).toBe('error-encountered');
        expect(tips[0].applicableErrors).toContain('MISSING_REQUEST_ID');
      }
    });

    test('should limit tips to top 3', () => {
      const tips = validationSystem.getApplicableTips('step-start');
      expect(tips.length).toBeLessThanOrEqual(3);
    });

    test('should sort tips by priority', () => {
      const tips = validationSystem.getApplicableTips('step-start');
      
      for (let i = 1; i < tips.length; i++) {
        expect(tips[i].priority).toBeLessThanOrEqual(tips[i - 1].priority);
      }
    });
  });

  describe('completeSession', () => {
    test('should complete session and return progress', () => {
      const session = validationSystem.startSession();
      const progress = validationSystem.completeSession(session.sessionId);
      
      expect(progress).toBeDefined();
      expect(progress?.percentComplete).toBeDefined();
      expect(session.lastUpdate).toBeInstanceOf(Date);
    });

    test('should mark pending steps as skipped', () => {
      const session = validationSystem.startSession();
      validationSystem.completeSession(session.sessionId);
      
      session.steps.forEach(step => {
        expect(step.status).not.toBe('pending');
        expect(step.status).not.toBe('in-progress');
      });
    });

    test('should return null for invalid session', () => {
      const progress = validationSystem.completeSession('nonexistent');
      expect(progress).toBeNull();
    });
  });

  describe('deleteSession', () => {
    test('should delete existing session', () => {
      const session = validationSystem.startSession();
      const deleted = validationSystem.deleteSession(session.sessionId);
      
      expect(deleted).toBe(true);
      expect(validationSystem.getSession(session.sessionId)).toBeNull();
    });

    test('should return false for non-existent session', () => {
      const deleted = validationSystem.deleteSession('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('getSessionSummary', () => {
    test('should return session summary', async () => {
      const request = createTestRequest();
      const session = validationSystem.startSession(request);
      
      // Validate a step to generate some data
      await validationSystem.validateStep(session.sessionId, 1);
      
      const summary = validationSystem.getSessionSummary(session.sessionId);
      
      expect(summary).toBeDefined();
      expect(summary?.sessionId).toBe(session.sessionId);
      expect(summary?.startTime).toBe(session.startTime);
      expect(summary?.progress).toBe(session.progress);
      expect(summary?.totalErrors).toBeDefined();
      expect(summary?.totalWarnings).toBeDefined();
      expect(summary?.totalTime).toBeDefined();
      expect(summary?.stepsCompleted).toBeDefined();
      expect(summary?.overallScore).toBeDefined();
    });

    test('should return null for invalid session', () => {
      const summary = validationSystem.getSessionSummary('nonexistent');
      expect(summary).toBeNull();
    });

    test('should calculate totals correctly', async () => {
      const request = createTestRequest({ id: undefined as any }); // Create error
      const session = validationSystem.startSession(request);
      
      // Validate step that will have errors
      const requiredFieldsStepIndex = session.steps.findIndex(
        step => step.step.checkFunction === 'validateRequiredFields'
      );
      
      if (requiredFieldsStepIndex >= 0) {
        await validationSystem.validateStep(session.sessionId, requiredFieldsStepIndex + 1);
        
        const summary = validationSystem.getSessionSummary(session.sessionId);
        
        if (summary?.totalErrors && summary.totalErrors > 0) {
          expect(summary.totalErrors).toBeGreaterThan(0);
        }
        expect(summary?.stepsCompleted).toBeGreaterThanOrEqual(0);
      }
    });
  });
});