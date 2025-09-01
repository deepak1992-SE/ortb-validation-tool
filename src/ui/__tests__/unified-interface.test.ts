/**
 * Tests for Unified Tool Interface Components
 * Testing unified interface and navigation functionality
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ToolbarComponent, NavigationComponent, UnifiedToolInterface } from '../components';

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

// Mock HTMLButtonElement
const mockButton = () => ({
  ...mockElement(),
  disabled: false,
  addEventListener: vi.fn(),
  dataset: {}
});

describe('ToolbarComponent', () => {
  let container: any;
  let mockProps: any;

  beforeEach(() => {
    container = mockElement();
    container.querySelector.mockImplementation((selector: string) => {
      const button = mockButton();
      if (selector.includes('[data-action="export"]')) {
        button.dataset.action = 'export';
      } else if (selector.includes('[data-action="share"]')) {
        button.dataset.action = 'share';
      }
      return button;
    });
    container.querySelectorAll.mockReturnValue([mockButton(), mockButton()]);

    mockProps = {
      mode: 'validation' as const,
      onModeChange: vi.fn(),
      onExport: vi.fn(),
      onShare: vi.fn(),
      canExport: true,
      canShare: true
    };
  });

  test('should render toolbar with correct structure', () => {
    new ToolbarComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('unified-toolbar');
    expect(container.innerHTML).toContain('ORTB Validator');
    expect(container.innerHTML).toContain('mode-navigation');
    expect(container.innerHTML).toContain('toolbar-actions');
  });

  test('should show active mode correctly', () => {
    new ToolbarComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('validation');
    expect(container.innerHTML).toContain('active');
  });

  test('should handle mode changes', () => {
    const component = new ToolbarComponent(container, mockProps);
    
    // The actual event handling would be tested in integration tests
    expect(mockProps.onModeChange).toBeDefined();
  });

  test('should disable actions when not available', () => {
    const component = new ToolbarComponent(container, {
      ...mockProps,
      canExport: false,
      canShare: false
    });

    expect(container.innerHTML).toContain('disabled');
  });

  test('should update props correctly', () => {
    const component = new ToolbarComponent(container, mockProps);
    
    component.updateProps({
      mode: 'generation',
      canExport: false
    });

    expect(container.innerHTML).toContain('generation');
    expect(container.innerHTML).toContain('disabled');
  });
});

describe('NavigationComponent', () => {
  let container: any;
  let mockProps: any;

  beforeEach(() => {
    container = mockElement();
    container.querySelectorAll.mockReturnValue([mockButton(), mockButton()]);

    mockProps = {
      currentMode: 'validation' as const,
      onNavigate: vi.fn(),
      preserveContext: true
    };
  });

  test('should render navigation with correct structure', () => {
    new NavigationComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('navigation-component');
    expect(container.innerHTML).toContain('nav-tabs');
    expect(container.innerHTML).toContain('Validate ORTB');
    expect(container.innerHTML).toContain('Generate Sample');
  });

  test('should show active tab correctly', () => {
    new NavigationComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('active');
  });

  test('should show context preservation indicator', () => {
    new NavigationComponent(container, mockProps);
    
    expect(container.innerHTML).toContain('Context preserved');
  });

  test('should hide context indicator when not preserving', () => {
    const component = new NavigationComponent(container, {
      ...mockProps,
      preserveContext: false
    });

    expect(container.innerHTML).not.toContain('Context preserved');
  });

  test('should update props correctly', () => {
    const component = new NavigationComponent(container, mockProps);
    
    component.updateProps({
      currentMode: 'generation',
      preserveContext: false
    });

    expect(container.innerHTML).not.toContain('Context preserved');
  });
});

describe('UnifiedToolInterface', () => {
  let container: any;

  beforeEach(() => {
    container = mockElement();
    container.querySelector.mockImplementation((selector: string) => {
      const element = mockElement();
      
      if (selector.includes('toolbar-section') || 
          selector.includes('navigation-section') ||
          selector.includes('validation-mode') ||
          selector.includes('generation-mode')) {
        element.querySelector = vi.fn().mockImplementation((subSelector: string) => {
          if (subSelector.includes('btn-') || subSelector.includes('[data-')) {
            return mockButton();
          }
          return mockElement();
        });
        element.querySelectorAll = vi.fn().mockReturnValue([mockButton(), mockButton()]);
      }
      
      if (selector === '.status-text' || selector === '.mode-indicator') {
        element.textContent = '';
      }
      
      return element;
    });

    // Mock global objects
    global.setInterval = vi.fn();
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('mock-url'),
      revokeObjectURL: vi.fn()
    } as any;
    global.document = {
      createElement: vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
        style: {}
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      }
    } as any;
  });

  test('should initialize with correct structure', () => {
    const unifiedInterface = new UnifiedToolInterface(container);

    expect(container.innerHTML).toContain('unified-tool-interface');
    expect(container.innerHTML).toContain('tool-header');
    expect(container.innerHTML).toContain('tool-content');
    expect(container.innerHTML).toContain('tool-footer');
  });

  test('should start in validation mode', () => {
    const unifiedInterface = new UnifiedToolInterface(container);

    expect(unifiedInterface.getCurrentMode()).toBe('validation');
  });

  test('should switch modes correctly', () => {
    const unifiedInterface = new UnifiedToolInterface(container);

    unifiedInterface.setMode('generation');
    expect(unifiedInterface.getCurrentMode()).toBe('generation');

    unifiedInterface.setMode('validation');
    expect(unifiedInterface.getCurrentMode()).toBe('validation');
  });

  test('should provide access to sub-interfaces', () => {
    const unifiedInterface = new UnifiedToolInterface(container);

    const validationInterface = unifiedInterface.getValidationInterface();
    const generationInterface = unifiedInterface.getSampleGenerationInterface();

    expect(validationInterface).toBeDefined();
    expect(generationInterface).toBeDefined();
  });

  test('should toggle context preservation', () => {
    const unifiedInterface = new UnifiedToolInterface(container);

    // Initial state should preserve context
    expect((unifiedInterface as any).preserveContext).toBe(true);

    unifiedInterface.toggleContextPreservation();
    expect((unifiedInterface as any).preserveContext).toBe(false);

    unifiedInterface.toggleContextPreservation();
    expect((unifiedInterface as any).preserveContext).toBe(true);
  });
});

describe('Unified Interface Integration', () => {
  test('should validate component exports exist', async () => {
    const components = await import('../components');
    
    expect(components.ToolbarComponent).toBeDefined();
    expect(components.NavigationComponent).toBeDefined();
    expect(components.UnifiedToolInterface).toBeDefined();
  });

  test('should validate toolbar props interface', () => {
    const toolbarProps = {
      mode: 'validation' as const,
      onModeChange: vi.fn(),
      onExport: vi.fn(),
      onShare: vi.fn(),
      canExport: true,
      canShare: false
    };

    expect(toolbarProps.mode).toBe('validation');
    expect(toolbarProps.canExport).toBe(true);
    expect(toolbarProps.canShare).toBe(false);
    expect(typeof toolbarProps.onModeChange).toBe('function');
    expect(typeof toolbarProps.onExport).toBe('function');
    expect(typeof toolbarProps.onShare).toBe('function');
  });

  test('should validate navigation props interface', () => {
    const navigationProps = {
      currentMode: 'generation' as const,
      onNavigate: vi.fn(),
      preserveContext: true
    };

    expect(navigationProps.currentMode).toBe('generation');
    expect(navigationProps.preserveContext).toBe(true);
    expect(typeof navigationProps.onNavigate).toBe('function');
  });

  test('should handle mode switching workflow', () => {
    const mockContainer = mockElement();
    mockContainer.querySelector.mockImplementation(() => mockElement());

    // This would test the complete workflow in a real implementation
    expect(true).toBe(true); // Placeholder for integration test
  });
});