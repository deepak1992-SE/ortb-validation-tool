/**
 * Unit tests for model exports
 * Tests that all model interfaces are properly exported
 */

import { describe, it, expect } from 'vitest';

describe('Model Exports', () => {
  it('should export ORTB models', async () => {
    const ortbModule = await import('../ortb');
    
    // Check that key interfaces are exported
    expect(typeof ortbModule).toBe('object');
    
    // Test that we can create objects with the exported types
    const testRequest: ortbModule.ORTBRequest = {
      id: 'test',
      imp: [{ id: 'imp-1' }],
      at: 1
    };
    
    expect(testRequest.id).toBe('test');
  });

  it('should export validation models', async () => {
    const validationModule = await import('../validation');
    
    expect(typeof validationModule).toBe('object');
    
    // Test that we can create objects with the exported types
    const testError: validationModule.ValidationError = {
      field: 'test',
      message: 'test message',
      severity: 'error',
      code: 'TEST_CODE',
      type: 'schema'
    };
    
    expect(testError.field).toBe('test');
  });

  it('should export sample models', async () => {
    const sampleModule = await import('../sample');
    
    expect(typeof sampleModule).toBe('object');
    
    // Test that we can create objects with the exported types
    const testConfig: sampleModule.SampleConfig = {
      requestType: 'display',
      includeOptionalFields: false,
      complexity: 'minimal'
    };
    
    expect(testConfig.requestType).toBe('display');
  });

  it('should export all models through index', async () => {
    const indexModule = await import('../index');
    
    expect(typeof indexModule).toBe('object');
    
    // Test that we can access all types through the index
    const testRequest: indexModule.ORTBRequest = {
      id: 'test',
      imp: [{ id: 'imp-1' }],
      at: 1
    };
    
    const testError: indexModule.ValidationError = {
      field: 'test',
      message: 'test message',
      severity: 'error',
      code: 'TEST_CODE',
      type: 'schema'
    };
    
    const testConfig: indexModule.SampleConfig = {
      requestType: 'display',
      includeOptionalFields: false,
      complexity: 'minimal'
    };
    
    expect(testRequest.id).toBe('test');
    expect(testError.field).toBe('test');
    expect(testConfig.requestType).toBe('display');
  });
});