/**
 * Guided Validation System
 * Provides step-by-step validation guidance and feedback
 */

import { ValidationResult, ValidationError, ValidationWarning } from '../models/validation';
import { ORTBRequest } from '../models/ortb';
import { fieldHelpSystem, FieldHelp, ValidationStep } from './field-help';

export interface GuidedValidationSession {
  /** Session ID */
  sessionId: string;
  /** Current step */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Validation steps */
  steps: GuidedValidationStep[];
  /** Overall progress */
  progress: ValidationProgress;
  /** Session start time */
  startTime: Date;
  /** Last update time */
  lastUpdate: Date;
  /** User's ORTB request */
  request?: ORTBRequest;
}

export interface GuidedValidationStep {
  /** Step information */
  step: ValidationStep;
  /** Step status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  /** Validation results for this step */
  validationResult?: StepValidationResult;
  /** User feedback/notes */
  userNotes?: string;
  /** Time spent on this step */
  timeSpent?: number;
  /** Step start time */
  startTime?: Date;
  /** Step completion time */
  completionTime?: Date;
}

export interface StepValidationResult {
  /** Whether the step passed validation */
  passed: boolean;
  /** Errors found in this step */
  errors: ValidationError[];
  /** Warnings found in this step */
  warnings: ValidationWarning[];
  /** Fields validated in this step */
  validatedFields: string[];
  /** Suggestions for improvement */
  suggestions: string[];
  /** Next recommended action */
  nextAction?: string;
}

export interface ValidationProgress {
  /** Percentage complete (0-100) */
  percentComplete: number;
  /** Number of steps completed */
  stepsCompleted: number;
  /** Number of steps with errors */
  stepsWithErrors: number;
  /** Number of steps with warnings */
  stepsWithWarnings: number;
  /** Overall validation score */
  overallScore: number;
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
}

export interface ValidationFeedback {
  /** Feedback type */
  type: 'success' | 'error' | 'warning' | 'info' | 'tip';
  /** Feedback message */
  message: string;
  /** Detailed explanation */
  details?: string;
  /** Related field path */
  fieldPath?: string;
  /** Suggested action */
  suggestedAction?: string;
  /** Help link or reference */
  helpReference?: string;
  /** Code example */
  codeExample?: any;
}

export interface ValidationTip {
  /** Tip ID */
  id: string;
  /** Tip title */
  title: string;
  /** Tip content */
  content: string;
  /** When to show this tip */
  trigger: 'step-start' | 'error-encountered' | 'field-focus' | 'validation-complete';
  /** Applicable steps */
  applicableSteps?: number[];
  /** Applicable error codes */
  applicableErrors?: string[];
  /** Applicable field paths */
  applicableFields?: string[];
  /** Priority (higher = more important) */
  priority: number;
}

export class GuidedValidationSystem {
  private sessions: Map<string, GuidedValidationSession> = new Map();
  private validationTips: ValidationTip[] = [];

  constructor() {
    this.initializeValidationTips();
  }

  /**
   * Start a new guided validation session
   */
  startSession(request?: ORTBRequest): GuidedValidationSession {
    const sessionId = this.generateSessionId();
    const validationSteps = fieldHelpSystem.getValidationGuidance();
    
    const session: GuidedValidationSession = {
      sessionId,
      currentStep: 1,
      totalSteps: validationSteps.length,
      steps: validationSteps.map(step => ({
        step,
        status: 'pending'
      })),
      progress: {
        percentComplete: 0,
        stepsCompleted: 0,
        stepsWithErrors: 0,
        stepsWithWarnings: 0,
        overallScore: 0
      },
      startTime: new Date(),
      lastUpdate: new Date(),
      request
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get existing session
   */
  getSession(sessionId: string): GuidedValidationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session with new request
   */
  updateSessionRequest(sessionId: string, request: ORTBRequest): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.request = request;
    session.lastUpdate = new Date();
    return true;
  }

  /**
   * Execute validation for a specific step
   */
  async validateStep(sessionId: string, stepNumber: number): Promise<StepValidationResult> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.request) {
      throw new Error('Invalid session or missing request');
    }

    const stepIndex = stepNumber - 1;
    if (stepIndex < 0 || stepIndex >= session.steps.length) {
      throw new Error('Invalid step number');
    }

    const guidedStep = session.steps[stepIndex];
    guidedStep.status = 'in-progress';
    guidedStep.startTime = new Date();

    try {
      const result = await this.executeStepValidation(guidedStep.step, session.request);
      
      guidedStep.validationResult = result;
      guidedStep.status = result.passed ? 'completed' : 'failed';
      guidedStep.completionTime = new Date();
      
      if (guidedStep.startTime) {
        guidedStep.timeSpent = guidedStep.completionTime.getTime() - guidedStep.startTime.getTime();
      }

      // Update session progress
      this.updateSessionProgress(session);
      session.lastUpdate = new Date();

      return result;
    } catch (error) {
      guidedStep.status = 'failed';
      guidedStep.completionTime = new Date();
      
      const errorResult: StepValidationResult = {
        passed: false,
        errors: [{
          field: 'system',
          message: `Step validation failed: ${(error as Error).message}`,
          severity: 'error',
          code: 'STEP_VALIDATION_ERROR',
          type: 'system'
        }],
        warnings: [],
        validatedFields: [],
        suggestions: ['Please check your request format and try again']
      };

      guidedStep.validationResult = errorResult;
      this.updateSessionProgress(session);
      
      return errorResult;
    }
  }

  /**
   * Move to next step
   */
  nextStep(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.currentStep < session.totalSteps) {
      session.currentStep++;
      session.lastUpdate = new Date();
      return true;
    }
    return false;
  }

  /**
   * Move to previous step
   */
  previousStep(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.currentStep > 1) {
      session.currentStep--;
      session.lastUpdate = new Date();
      return true;
    }
    return false;
  }

  /**
   * Skip current step
   */
  skipStep(sessionId: string, reason?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const currentStepIndex = session.currentStep - 1;
    if (currentStepIndex >= 0 && currentStepIndex < session.steps.length) {
      const step = session.steps[currentStepIndex];
      step.status = 'skipped';
      step.userNotes = reason || 'Skipped by user';
      step.completionTime = new Date();
      
      this.updateSessionProgress(session);
      session.lastUpdate = new Date();
      
      return this.nextStep(sessionId);
    }
    return false;
  }

  /**
   * Get validation feedback for current step
   */
  getStepFeedback(sessionId: string, stepNumber?: number): ValidationFeedback[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const targetStep = stepNumber || session.currentStep;
    const stepIndex = targetStep - 1;
    
    if (stepIndex < 0 || stepIndex >= session.steps.length) return [];

    const guidedStep = session.steps[stepIndex];
    const feedback: ValidationFeedback[] = [];

    // Add step-specific feedback
    if (guidedStep.validationResult) {
      const result = guidedStep.validationResult;
      
      // Success feedback
      if (result.passed && result.errors.length === 0) {
        feedback.push({
          type: 'success',
          message: `Step ${targetStep} completed successfully!`,
          details: guidedStep.step.description,
          suggestedAction: targetStep < session.totalSteps ? 'Continue to next step' : 'Complete validation'
        });
      }

      // Error feedback
      result.errors.forEach(error => {
        feedback.push({
          type: 'error',
          message: error.message,
          details: error.suggestion,
          fieldPath: error.field,
          suggestedAction: 'Fix this error before continuing',
          codeExample: this.getCodeExampleForError(error)
        });
      });

      // Warning feedback
      result.warnings.forEach(warning => {
        feedback.push({
          type: 'warning',
          message: warning.message,
          details: warning.suggestion,
          fieldPath: warning.field,
          suggestedAction: 'Consider addressing this warning'
        });
      });

      // Suggestions
      result.suggestions.forEach(suggestion => {
        feedback.push({
          type: 'tip',
          message: suggestion,
          suggestedAction: 'Consider implementing this suggestion'
        });
      });
    }

    // Add contextual tips
    const tips = this.getApplicableTips('step-start', targetStep);
    tips.forEach(tip => {
      feedback.push({
        type: 'info',
        message: tip.title,
        details: tip.content
      });
    });

    return feedback;
  }

  /**
   * Get applicable validation tips
   */
  getApplicableTips(trigger: ValidationTip['trigger'], stepNumber?: number, errorCode?: string, fieldPath?: string): ValidationTip[] {
    return this.validationTips
      .filter(tip => {
        if (tip.trigger !== trigger) return false;
        if (stepNumber && tip.applicableSteps && !tip.applicableSteps.includes(stepNumber)) return false;
        if (errorCode && tip.applicableErrors && !tip.applicableErrors.includes(errorCode)) return false;
        if (fieldPath && tip.applicableFields && !tip.applicableFields.includes(fieldPath)) return false;
        return true;
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // Top 3 most relevant tips
  }

  /**
   * Complete validation session
   */
  completeSession(sessionId: string): ValidationProgress | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Mark any remaining steps as skipped
    session.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'in-progress') {
        step.status = 'skipped';
        step.completionTime = new Date();
      }
    });

    this.updateSessionProgress(session);
    session.lastUpdate = new Date();

    return session.progress;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): SessionSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalErrors = session.steps.reduce((sum, step) => 
      sum + (step.validationResult?.errors.length || 0), 0);
    const totalWarnings = session.steps.reduce((sum, step) => 
      sum + (step.validationResult?.warnings.length || 0), 0);
    const totalTime = session.steps.reduce((sum, step) => 
      sum + (step.timeSpent || 0), 0);

    return {
      sessionId,
      startTime: session.startTime,
      lastUpdate: session.lastUpdate,
      progress: session.progress,
      totalErrors,
      totalWarnings,
      totalTime,
      stepsCompleted: session.progress.stepsCompleted,
      overallScore: session.progress.overallScore
    };
  }

  /**
   * Execute validation for a specific step
   */
  private async executeStepValidation(step: ValidationStep, request: ORTBRequest): Promise<StepValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validatedFields: string[] = [];
    const suggestions: string[] = [];

    // Execute step-specific validation based on checkFunction
    switch (step.checkFunction) {
      case 'validateRequiredFields':
        this.validateRequiredFields(request, errors, warnings, validatedFields);
        break;
      case 'validateStructure':
        this.validateStructure(request, errors, warnings, validatedFields);
        break;
      case 'validateImpressions':
        this.validateImpressions(request, errors, warnings, validatedFields);
        break;
      case 'validateSiteApp':
        this.validateSiteApp(request, errors, warnings, validatedFields);
        break;
      case 'validateOptionalFields':
        this.validateOptionalFields(request, errors, warnings, validatedFields, suggestions);
        break;
    }

    const passed = errors.length === 0;
    
    return {
      passed,
      errors,
      warnings,
      validatedFields,
      suggestions,
      nextAction: passed ? 'Continue to next step' : 'Fix errors before continuing'
    };
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(request: ORTBRequest, errors: ValidationError[], warnings: ValidationWarning[], validatedFields: string[]): void {
    // Check request ID
    if (!request.id) {
      errors.push({
        field: 'id',
        message: 'Request ID is required',
        severity: 'error',
        code: 'MISSING_REQUEST_ID',
        type: 'required-field',
        suggestion: 'Add a unique identifier to the "id" field'
      });
    } else {
      validatedFields.push('id');
    }

    // Check impressions array
    if (!request.imp || !Array.isArray(request.imp) || request.imp.length === 0) {
      errors.push({
        field: 'imp',
        message: 'At least one impression is required',
        severity: 'error',
        code: 'MISSING_IMPRESSIONS',
        type: 'required-field',
        suggestion: 'Add at least one impression object to the "imp" array'
      });
    } else {
      validatedFields.push('imp');
    }

    // Check auction type
    if (request.at === undefined) {
      errors.push({
        field: 'at',
        message: 'Auction type is required',
        severity: 'error',
        code: 'MISSING_AUCTION_TYPE',
        type: 'required-field',
        suggestion: 'Add auction type: 1 for first price, 2 for second price'
      });
    } else {
      validatedFields.push('at');
    }
  }

  /**
   * Validate request structure
   */
  private validateStructure(request: ORTBRequest, errors: ValidationError[], warnings: ValidationWarning[], validatedFields: string[]): void {
    // Validate request is an object
    if (typeof request !== 'object' || request === null) {
      errors.push({
        field: 'root',
        message: 'Request must be a valid JSON object',
        severity: 'error',
        code: 'INVALID_REQUEST_STRUCTURE',
        type: 'schema',
        suggestion: 'Ensure your request is a properly formatted JSON object'
      });
      return;
    }

    validatedFields.push('root');

    // Validate auction type values
    if (request.at !== undefined && ![1, 2].includes(request.at)) {
      errors.push({
        field: 'at',
        message: 'Auction type must be 1 (first price) or 2 (second price)',
        severity: 'error',
        code: 'INVALID_AUCTION_TYPE',
        type: 'value',
        actualValue: request.at,
        expectedValue: '1 or 2',
        suggestion: 'Use 1 for first price auction or 2 for second price auction'
      });
    }
  }

  /**
   * Validate impressions
   */
  private validateImpressions(request: ORTBRequest, errors: ValidationError[], warnings: ValidationWarning[], validatedFields: string[]): void {
    if (!request.imp || !Array.isArray(request.imp)) return;

    const impressionIds = new Set<string>();

    request.imp.forEach((imp, index) => {
      const fieldPrefix = `imp.${index}`;
      
      // Check impression ID
      if (!imp.id) {
        errors.push({
          field: `${fieldPrefix}.id`,
          message: `Impression ${index} is missing required ID`,
          severity: 'error',
          code: 'MISSING_IMPRESSION_ID',
          type: 'required-field',
          suggestion: 'Add a unique ID to each impression'
        });
      } else {
        if (impressionIds.has(imp.id)) {
          errors.push({
            field: `${fieldPrefix}.id`,
            message: `Duplicate impression ID: ${imp.id}`,
            severity: 'error',
            code: 'DUPLICATE_IMPRESSION_ID',
            type: 'logical',
            actualValue: imp.id,
            suggestion: 'Ensure each impression has a unique ID'
          });
        } else {
          impressionIds.add(imp.id);
          validatedFields.push(`${fieldPrefix}.id`);
        }
      }

      // Check for at least one ad format
      const hasAdFormat = !!(imp.banner || imp.video || imp.audio || imp.native);
      if (!hasAdFormat) {
        errors.push({
          field: fieldPrefix,
          message: `Impression ${index} must specify at least one ad format (banner, video, audio, or native)`,
          severity: 'error',
          code: 'MISSING_AD_FORMAT',
          type: 'logical',
          suggestion: 'Add a banner, video, audio, or native object to the impression'
        });
      } else {
        validatedFields.push(`${fieldPrefix}.format`);
      }
    });
  }

  /**
   * Validate site/app mutual exclusivity
   */
  private validateSiteApp(request: ORTBRequest, errors: ValidationError[], warnings: ValidationWarning[], validatedFields: string[]): void {
    const hasSite = !!(request.site);
    const hasApp = !!(request.app);

    if (hasSite && hasApp) {
      errors.push({
        field: 'site',
        message: 'Site and App objects are mutually exclusive',
        severity: 'error',
        code: 'SITE_APP_MUTUAL_EXCLUSION',
        type: 'logical',
        suggestion: 'Include either site OR app object, but not both'
      });
    } else if (!hasSite && !hasApp) {
      warnings.push({
        field: 'site',
        message: 'Neither site nor app object is present',
        code: 'MISSING_SITE_APP',
        suggestion: 'Consider adding site or app object for better targeting'
      });
    } else {
      if (hasSite) validatedFields.push('site');
      if (hasApp) validatedFields.push('app');
    }
  }

  /**
   * Validate optional fields
   */
  private validateOptionalFields(request: ORTBRequest, errors: ValidationError[], warnings: ValidationWarning[], validatedFields: string[], suggestions: string[]): void {
    // Check for device information
    if (!request.device) {
      suggestions.push('Consider adding device information for better targeting');
    } else {
      validatedFields.push('device');
    }

    // Check for user information
    if (!request.user) {
      suggestions.push('Consider adding user information for improved personalization');
    } else {
      validatedFields.push('user');
    }

    // Check for timeout
    if (!request.tmax) {
      suggestions.push('Consider setting a timeout (tmax) for bid responses');
    } else {
      validatedFields.push('tmax');
    }

    // Check for currency
    if (!request.cur || request.cur.length === 0) {
      suggestions.push('Consider specifying accepted currencies');
    } else {
      validatedFields.push('cur');
    }
  }

  /**
   * Update session progress
   */
  private updateSessionProgress(session: GuidedValidationSession): void {
    const completedSteps = session.steps.filter(step => 
      step.status === 'completed' || step.status === 'skipped'
    ).length;
    
    const stepsWithErrors = session.steps.filter(step => 
      step.validationResult && step.validationResult.errors.length > 0
    ).length;
    
    const stepsWithWarnings = session.steps.filter(step => 
      step.validationResult && step.validationResult.warnings.length > 0
    ).length;

    const percentComplete = (completedSteps / session.totalSteps) * 100;
    
    // Calculate overall score based on completion and error rates
    const errorPenalty = (stepsWithErrors / session.totalSteps) * 30;
    const warningPenalty = (stepsWithWarnings / session.totalSteps) * 10;
    const overallScore = Math.max(0, percentComplete - errorPenalty - warningPenalty);

    session.progress = {
      percentComplete: Math.round(percentComplete),
      stepsCompleted: completedSteps,
      stepsWithErrors,
      stepsWithWarnings,
      overallScore: Math.round(overallScore)
    };
  }

  /**
   * Get code example for error
   */
  private getCodeExampleForError(error: ValidationError): any {
    switch (error.code) {
      case 'MISSING_REQUEST_ID':
        return { id: 'req_12345_example', imp: [], at: 1 };
      case 'MISSING_IMPRESSIONS':
        return { id: 'req_123', imp: [{ id: '1', banner: { w: 300, h: 250 } }], at: 1 };
      case 'MISSING_AUCTION_TYPE':
        return { id: 'req_123', imp: [], at: 1 };
      default:
        return null;
    }
  }

  /**
   * Initialize validation tips
   */
  private initializeValidationTips(): void {
    this.validationTips = [
      {
        id: 'required-fields-tip',
        title: 'Start with the basics',
        content: 'Every ORTB request needs an ID, impressions array, and auction type. These are the foundation of your request.',
        trigger: 'step-start',
        applicableSteps: [1],
        priority: 10
      },
      {
        id: 'impression-id-tip',
        title: 'Unique impression IDs',
        content: 'Each impression in your request must have a unique ID. Use simple sequential numbers like "1", "2", "3" or descriptive names.',
        trigger: 'error-encountered',
        applicableErrors: ['MISSING_IMPRESSION_ID', 'DUPLICATE_IMPRESSION_ID'],
        priority: 9
      },
      {
        id: 'site-app-tip',
        title: 'Choose site OR app',
        content: 'Include either a site object (for websites) or an app object (for mobile apps), but never both in the same request.',
        trigger: 'step-start',
        applicableSteps: [4],
        priority: 8
      },
      {
        id: 'banner-size-tip',
        title: 'Use standard banner sizes',
        content: 'Standard IAB banner sizes like 300x250, 728x90, and 320x50 typically have better fill rates.',
        trigger: 'field-focus',
        applicableFields: ['imp.banner.w', 'imp.banner.h'],
        priority: 7
      },
      {
        id: 'optional-fields-tip',
        title: 'Optional fields improve performance',
        content: 'Adding device, user, and geo information helps bidders provide more relevant ads and better prices.',
        trigger: 'step-start',
        applicableSteps: [5],
        priority: 6
      }
    ];
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface SessionSummary {
  sessionId: string;
  startTime: Date;
  lastUpdate: Date;
  progress: ValidationProgress;
  totalErrors: number;
  totalWarnings: number;
  totalTime: number;
  stepsCompleted: number;
  overallScore: number;
}

// Export singleton instance
export const guidedValidationSystem = new GuidedValidationSystem();