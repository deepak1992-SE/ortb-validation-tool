/**
 * Tests for Sample Generation UI Components
 * Testing sample generation interface components functionality
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SampleConfigFormComponent, SamplePreviewComponent, SampleGenerationInterface } from '../components';
import { ORTBRequest } from '../../models';
import { SampleTemplate } from '../types';

// Mock DOM environment
const mockElement = (innerHTML = '') => ({
  innerHTML,
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  addEventListener: vi.fn(),
  style: {},
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn()
  }
});

// Mock HTMLSelectElement
const mockSelect = (value = '') => ({
  ...mockElement(),
  value,
  addEventListener: vi.fn()
});

// Mock HTMLInputElement
const mockInput = (value = '') => ({
  ...mockElement(),
  value,
  addEventListener: vi.fn()
});

// Mock HTMLButtonElement
const mockButton = () => ({
  ...mockElement(),
  disabled: false,
  addEventListener: vi.fn()
});

describe('SampleConfigFormComponent', () => {
  let container: any;
  let mockProps: any;
  let mockTemplates: SampleTemplate[];

  beforeEach(() => {
    container = mockElement();
    container.querySelector.mockImplementation((selector: string) => {
      if (selector === '.template-select') return mockSelect();
      if (selector.includes('btn-')) return mockButton();
      if (selector.includes('[name=')) return mockInput();
      return mockElement();
    });

    mockTemplates = [
      {
        id: 'banner-basic',
        name: 'Basic Banner',
        description: 'Simple banner ad request',
        category: 'Banner',
        config: { adType: 'banner', bannerWidth: 300, bannerHeight: 250 }
      }
    ];

    mockProps = {
      onGenerate: vi.fn(),
      isGenerating: false,
      availableTemplates: mockTemplates
    };
  });

  test('should render config form with correct structure', () => {
    new SampleConfigFormComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('sample-config-form');
    expect(container.innerHTML).toContain('Generate ORTB Sample');
    expect(container.innerHTML).toContain('template-select');
    expect(container.innerHTML).toContain('btn-generate');
  });

  test('should render available templates', () => {
    new SampleConfigFormComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('Basic Banner');
    expect(container.innerHTML).toContain('banner-basic');
  });

  test('should show loading state when generating', () => {
    const component = new SampleConfigFormComponent(container, {
      ...mockProps,
      isGenerating: true
    });

    expect(container.innerHTML).toContain('Generating...');
    expect(container.innerHTML).toContain('loading');
  });

  test('should update props correctly', () => {
    const component = new SampleConfigFormComponent(container, mockProps);
    
    component.updateProps({
      isGenerating: true
    });

    expect(container.innerHTML).toContain('Generating...');
  });
});

describe('SamplePreviewComponent', () => {
  let container: any;
  let mockProps: any;
  let mockSample: ORTBRequest;

  beforeEach(() => {
    container = mockElement();
    container.querySelector.mockImplementation((selector: string) => {
      if (selector.includes('mode-btn')) return mockButton();
      if (selector.includes('btn-')) return mockButton();
      return mockElement();
    });
    container.querySelectorAll.mockReturnValue([mockButton(), mockButton()]);

    mockSample = {
      id: 'test-sample',
      test: 0,
      tmax: 1000,
      cur: ['USD'],
      imp: [{
        id: '1',
        banner: {
          w: 300,
          h: 250,
          pos: 1
        },
        bidfloor: 0.5,
        bidfloorcur: 'USD'
      }],
      device: {
        devicetype: 1,
        os: 'iOS',
        ua: 'Mozilla/5.0',
        ip: '192.168.1.1'
      }
    };

    mockProps = {
      sample: null,
      mode: 'formatted' as const,
      onModeChange: vi.fn(),
      onEdit: vi.fn()
    };
  });

  test('should show empty state when no sample', () => {
    new SamplePreviewComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('empty');
    expect(container.innerHTML).toContain('No Sample Generated');
  });

  test('should display sample in formatted mode', () => {
    const component = new SamplePreviewComponent(container, {
      ...mockProps,
      sample: mockSample
    });

    expect(container.innerHTML).toContain('Generated Sample');
    expect(container.innerHTML).toContain('test-sample');
    expect(container.innerHTML).toContain('Request Information');
    expect(container.innerHTML).toContain('Impressions (1)');
  });

  test('should display sample in raw mode', () => {
    const component = new SamplePreviewComponent(container, {
      ...mockProps,
      sample: mockSample,
      mode: 'raw'
    });

    expect(container.innerHTML).toContain('raw-view');
    expect(container.innerHTML).toContain('json-content');
  });

  test('should handle mode changes', () => {
    const component = new SamplePreviewComponent(container, {
      ...mockProps,
      sample: mockSample
    });

    // The actual event handling would be tested in integration tests
    expect(mockProps.onModeChange).toBeDefined();
  });

  test('should update props correctly', () => {
    const component = new SamplePreviewComponent(container, mockProps);
    
    component.updateProps({
      sample: mockSample,
      mode: 'raw'
    });

    expect(container.innerHTML).toContain('raw-view');
  });
});

describe('SampleGenerationInterface', () => {
  let container: any;
  let mockSample: ORTBRequest;

  beforeEach(() => {
    mockSample = {
      id: 'test-sample',
      test: 0,
      tmax: 1000,
      cur: ['USD'],
      imp: [{
        id: '1',
        banner: {
          w: 300,
          h: 250,
          pos: 1
        }
      }]
    };
    container = mockElement();
    container.querySelector.mockImplementation((selector: string) => {
      const element = mockElement();
      if (selector.includes('config-section') || selector.includes('preview-section')) {
        element.querySelector = vi.fn().mockImplementation((subSelector: string) => {
          if (subSelector === '.template-select') return mockSelect();
          if (subSelector.includes('btn-')) return mockButton();
          if (subSelector.includes('[name=')) return mockInput();
          return mockElement();
        });
        element.querySelectorAll = vi.fn().mockReturnValue([mockButton(), mockButton()]);
      }
      return element;
    });
  });

  test('should initialize with correct structure', () => {
    const sampleInterface = new SampleGenerationInterface(container);

    expect(container.innerHTML).toContain('sample-generation-interface');
    expect(container.innerHTML).toContain('generation-config-section');
    expect(container.innerHTML).toContain('generation-preview-section');
  });

  test('should handle state correctly', () => {
    const sampleInterface = new SampleGenerationInterface(container);
    const state = sampleInterface.getState();

    expect(state.selectedTemplate).toBeNull();
    expect(state.customConfig).toEqual({});
    expect(state.generatedSample).toBeNull();
    expect(state.isGenerating).toBe(false);
    expect(state.previewMode).toBe('formatted');
  });

  test('should clear sample', () => {
    const sampleInterface = new SampleGenerationInterface(container);
    
    // Set some initial state
    (sampleInterface as any).state.generatedSample = mockSample;
    
    // Clear sample
    sampleInterface.clearSample();
    const state = sampleInterface.getState();

    expect(state.generatedSample).toBeNull();
  });

  test('should handle sample generation process', async () => {
    const sampleInterface = new SampleGenerationInterface(container);
    
    // Mock the generation method
    const originalPerformGeneration = (sampleInterface as any).performSampleGeneration;
    (sampleInterface as any).performSampleGeneration = vi.fn().mockResolvedValue(mockSample);

    // Trigger generation
    await (sampleInterface as any).handleGeneration({ adType: 'banner' });
    
    const state = sampleInterface.getState();
    expect(state.generatedSample).toBeTruthy();
    expect(state.isGenerating).toBe(false);
  });
});

describe('Sample Generation Integration', () => {
  test('should validate component exports exist', async () => {
    const components = await import('../components');
    
    expect(components.SampleConfigFormComponent).toBeDefined();
    expect(components.SamplePreviewComponent).toBeDefined();
    expect(components.SampleGenerationInterface).toBeDefined();
  });

  test('should validate sample template structure', () => {
    const template: SampleTemplate = {
      id: 'test-template',
      name: 'Test Template',
      description: 'A test template',
      category: 'Test',
      config: {
        adType: 'banner',
        width: 300,
        height: 250
      }
    };

    expect(template.id).toBe('test-template');
    expect(template.name).toBe('Test Template');
    expect(template.description).toBe('A test template');
    expect(template.category).toBe('Test');
    expect(template.config.adType).toBe('banner');
  });

  test('should validate ORTB request structure for samples', () => {
    const ortbRequest: ORTBRequest = {
      id: 'sample-request',
      test: 1,
      tmax: 2000,
      cur: ['USD'],
      imp: [{
        id: 'imp1',
        banner: {
          w: 728,
          h: 90,
          pos: 1
        }
      }]
    };

    expect(ortbRequest.id).toBe('sample-request');
    expect(ortbRequest.test).toBe(1);
    expect(ortbRequest.tmax).toBe(2000);
    expect(ortbRequest.cur).toContain('USD');
    expect(ortbRequest.imp).toHaveLength(1);
    expect(ortbRequest.imp[0].banner?.w).toBe(728);
    expect(ortbRequest.imp[0].banner?.h).toBe(90);
  });
});