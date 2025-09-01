/**
 * UI Component Interfaces and Implementations
 * Validation and sample generation UI components
 */

import { 
  ValidationUIState, 
  ValidationInputProps, 
  ValidationResultsProps, 
  ValidationErrorDisplayProps,
  SampleGenerationUIState,
  SampleConfigFormProps,
  SamplePreviewProps,
  ToolbarProps,
  NavigationProps,
  SyntaxError
} from './types';
import { ValidationResult, ValidationError, ValidationWarning, ORTBRequest } from '../models';

/**
 * JSON Input Component with Syntax Highlighting and Validation
 */
export class ValidationInputComponent {
  private element: HTMLElement;
  private props: ValidationInputProps;
  private syntaxHighlighter: SyntaxHighlighter;
  private validationTimer: NodeJS.Timeout | null = null;

  constructor(container: HTMLElement, props: ValidationInputProps) {
    this.element = container;
    this.props = props;
    this.syntaxHighlighter = new SyntaxHighlighter();
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="validation-input-container">
        <div class="input-header">
          <label class="input-label">ORTB Request JSON</label>
          <div class="input-actions">
            <button class="btn-format" title="Format JSON">Format</button>
            <button class="btn-clear" title="Clear">Clear</button>
          </div>
        </div>
        <div class="input-wrapper" style="height: ${this.props.height || '400px'}">
          <textarea 
            class="json-input"
            placeholder="${this.props.placeholder || 'Paste your ORTB request JSON here...'}"
            spellcheck="false"
          >${this.props.value}</textarea>
          <div class="syntax-overlay"></div>
          <div class="error-indicators"></div>
        </div>
        <div class="input-footer">
          <div class="syntax-status">
            ${this.renderSyntaxStatus()}
          </div>
          <button class="btn-validate ${this.props.isValidating ? 'loading' : ''}" 
                  ${this.props.isValidating ? 'disabled' : ''}>
            ${this.props.isValidating ? 'Validating...' : 'Validate'}
          </button>
        </div>
      </div>
    `;
    
    this.applySyntaxHighlighting();
    this.renderErrorIndicators();
  }

  private setupEventListeners(): void {
    const textarea = this.element.querySelector('.json-input') as HTMLTextAreaElement;
    const validateBtn = this.element.querySelector('.btn-validate') as HTMLButtonElement;
    const formatBtn = this.element.querySelector('.btn-format') as HTMLButtonElement;
    const clearBtn = this.element.querySelector('.btn-clear') as HTMLButtonElement;

    // Real-time validation on input
    textarea.addEventListener('input', (e) => {
      const value = (e.target as HTMLTextAreaElement).value;
      this.props.onChange(value);
      
      // Debounced validation
      if (this.validationTimer) {
        clearTimeout(this.validationTimer);
      }
      this.validationTimer = setTimeout(() => {
        this.performRealTimeValidation(value);
      }, 500);
    });

    // Manual validation
    validateBtn.addEventListener('click', () => {
      this.performValidation();
    });

    // Format JSON
    formatBtn.addEventListener('click', () => {
      this.formatJSON();
    });

    // Clear input
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      this.props.onChange('');
    });
  }

  private performRealTimeValidation(value: string): void {
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        this.props.onValidate(parsed as ORTBRequest);
      }
    } catch (error) {
      // Handle syntax errors
      this.handleSyntaxError(error as Error, value);
    }
  }

  private performValidation(): void {
    try {
      const parsed = JSON.parse(this.props.value);
      this.props.onValidate(parsed as ORTBRequest);
    } catch (error) {
      this.handleSyntaxError(error as Error, this.props.value);
    }
  }

  private handleSyntaxError(error: Error, json: string): void {
    const syntaxError = this.parseSyntaxError(error, json);
    // Update syntax errors in props would be handled by parent component
  }

  private parseSyntaxError(error: Error, json: string): SyntaxError {
    // Parse JSON syntax error to extract line/column information
    const match = error.message.match(/at position (\d+)/);
    if (match) {
      const position = parseInt(match[1]);
      const lines = json.substring(0, position).split('\n');
      return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
        message: error.message,
        severity: 'error'
      };
    }
    return {
      line: 1,
      column: 1,
      message: error.message,
      severity: 'error'
    };
  }

  private formatJSON(): void {
    try {
      const parsed = JSON.parse(this.props.value);
      const formatted = JSON.stringify(parsed, null, 2);
      const textarea = this.element.querySelector('.json-input') as HTMLTextAreaElement;
      textarea.value = formatted;
      this.props.onChange(formatted);
    } catch (error) {
      // Show error message
      console.error('Cannot format invalid JSON');
    }
  }

  private applySyntaxHighlighting(): void {
    const overlay = this.element.querySelector('.syntax-overlay') as HTMLElement;
    overlay.innerHTML = this.syntaxHighlighter.highlight(this.props.value);
  }

  private renderErrorIndicators(): void {
    const container = this.element.querySelector('.error-indicators') as HTMLElement;
    container.innerHTML = this.props.syntaxErrors.map(error => `
      <div class="error-indicator" style="top: ${(error.line - 1) * 20}px" title="${error.message}">
        <span class="error-icon">⚠</span>
      </div>
    `).join('');
  }

  private renderSyntaxStatus(): string {
    if (this.props.syntaxErrors.length === 0) {
      return '<span class="status-valid">✓ Valid JSON</span>';
    }
    return `<span class="status-error">✗ ${this.props.syntaxErrors.length} syntax error(s)</span>`;
  }

  updateProps(newProps: Partial<ValidationInputProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }
}

/**
 * Validation Results Display Component
 */
export class ValidationResultsComponent {
  private element: HTMLElement;
  private props: ValidationResultsProps;

  constructor(container: HTMLElement, props: ValidationResultsProps) {
    this.element = container;
    this.props = props;
    this.render();
  }

  private render(): void {
    if (this.props.isLoading) {
      this.element.innerHTML = `
        <div class="validation-results loading">
          <div class="loading-spinner"></div>
          <p>Validating ORTB request...</p>
        </div>
      `;
      return;
    }

    if (!this.props.result) {
      this.element.innerHTML = `
        <div class="validation-results empty">
          <p>Enter an ORTB request above and click "Validate" to see results.</p>
        </div>
      `;
      return;
    }

    const result = this.props.result;
    this.element.innerHTML = `
      <div class="validation-results">
        <div class="results-header">
          <div class="validation-status ${result.isValid ? 'valid' : 'invalid'}">
            <span class="status-icon">${result.isValid ? '✓' : '✗'}</span>
            <span class="status-text">
              ${result.isValid ? 'Valid ORTB Request' : 'Invalid ORTB Request'}
            </span>
          </div>
          <div class="results-summary">
            <span class="error-count">${result.errors.length} errors</span>
            <span class="warning-count">${result.warnings.length} warnings</span>
            <span class="compliance-score">Compliance: ${Math.round(result.complianceLevel * 100)}%</span>
          </div>
        </div>
        
        ${this.renderValidationDetails()}
        
        <div class="results-actions">
          <button class="btn-toggle-details" onclick="this.toggleDetails()">
            ${this.props.showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button class="btn-export-results">Export Results</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private renderValidationDetails(): string {
    if (!this.props.showDetails || !this.props.result) {
      return '';
    }

    const result = this.props.result;
    return `
      <div class="validation-details">
        ${result.errors.length > 0 ? this.renderErrors(result.errors) : ''}
        ${result.warnings.length > 0 ? this.renderWarnings(result.warnings) : ''}
        ${this.renderValidatedFields(result.validatedFields)}
      </div>
    `;
  }

  private renderErrors(errors: ValidationError[]): string {
    return `
      <div class="error-section">
        <h4>Errors (${errors.length})</h4>
        <div class="error-list">
          ${errors.map((error, index) => `
            <div class="error-item" data-error-id="${index}">
              <div class="error-header" onclick="this.toggleError('${index}')">
                <span class="error-icon">⚠</span>
                <span class="error-field">${error.field}</span>
                <span class="error-toggle">▼</span>
              </div>
              <div class="error-details">
                <p class="error-message">${error.message}</p>
                ${error.suggestion ? `<p class="error-suggestion">💡 ${error.suggestion}</p>` : ''}
                <div class="error-meta">
                  <span class="error-code">${error.code}</span>
                  <span class="error-severity">${error.severity}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderWarnings(warnings: ValidationWarning[]): string {
    return `
      <div class="warning-section">
        <h4>Warnings (${warnings.length})</h4>
        <div class="warning-list">
          ${warnings.map((warning, index) => `
            <div class="warning-item">
              <span class="warning-icon">⚠</span>
              <span class="warning-field">${warning.field}</span>
              <span class="warning-message">${warning.message}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderValidatedFields(fields: string[]): string {
    return `
      <div class="validated-fields-section">
        <h4>Validated Fields (${fields.length})</h4>
        <div class="validated-fields">
          ${fields.map(field => `
            <span class="validated-field">✓ ${field}</span>
          `).join('')}
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const toggleBtn = this.element.querySelector('.btn-toggle-details') as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.props.onToggleDetails();
      });
    }
  }

  updateProps(newProps: Partial<ValidationResultsProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }
}

/**
 * Syntax Highlighter for JSON
 */
export class SyntaxHighlighter {
  highlight(json: string): string {
    if (!json.trim()) return '';
    
    try {
      // Basic JSON syntax highlighting
      return json
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
        .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*null/g, ': <span class="json-null">null</span>');
    } catch (error) {
      return json;
    }
  }
}

/**
 * Sample Generation Configuration Form Component
 */
export class SampleConfigFormComponent {
  private element: HTMLElement;
  private props: SampleConfigFormProps;

  constructor(container: HTMLElement, props: SampleConfigFormProps) {
    this.element = container;
    this.props = props;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="sample-config-form">
        <div class="form-header">
          <h3>Generate ORTB Sample</h3>
          <p>Configure parameters to generate a sample ORTB request</p>
        </div>
        
        <div class="form-content">
          <div class="template-selection">
            <label class="form-label">Template</label>
            <select class="template-select">
              <option value="">Select a template...</option>
              ${this.props.availableTemplates.map(template => `
                <option value="${template.id}">${template.name}</option>
              `).join('')}
            </select>
            <div class="template-description"></div>
          </div>

          <div class="config-sections">
            <div class="config-section">
              <h4>Basic Configuration</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Request ID</label>
                  <input type="text" class="form-input" name="requestId" placeholder="Auto-generated">
                </div>
                <div class="form-group">
                  <label class="form-label">Test Mode</label>
                  <select class="form-select" name="testMode">
                    <option value="0">Live</option>
                    <option value="1">Test</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="config-section">
              <h4>Impression Configuration</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Number of Impressions</label>
                  <input type="number" class="form-input" name="impressionCount" value="1" min="1" max="10">
                </div>
                <div class="form-group">
                  <label class="form-label">Ad Type</label>
                  <select class="form-select" name="adType">
                    <option value="banner">Banner</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="native">Native</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="config-section banner-config">
              <h4>Banner Configuration</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Width</label>
                  <input type="number" class="form-input" name="bannerWidth" value="300">
                </div>
                <div class="form-group">
                  <label class="form-label">Height</label>
                  <input type="number" class="form-input" name="bannerHeight" value="250">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Position</label>
                  <select class="form-select" name="bannerPosition">
                    <option value="0">Unknown</option>
                    <option value="1">Above the fold</option>
                    <option value="3">Below the fold</option>
                    <option value="4">Header</option>
                    <option value="5">Footer</option>
                    <option value="6">Sidebar</option>
                    <option value="7">Fullscreen</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">API Frameworks</label>
                  <select class="form-select" name="apiFrameworks" multiple>
                    <option value="1">VPAID 1.0</option>
                    <option value="2">VPAID 2.0</option>
                    <option value="3">MRAID-1</option>
                    <option value="5">MRAID-2</option>
                    <option value="6">MRAID-3</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="config-section device-config">
              <h4>Device Configuration</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Device Type</label>
                  <select class="form-select" name="deviceType">
                    <option value="1">Mobile/Tablet</option>
                    <option value="2">Personal Computer</option>
                    <option value="3">Connected TV</option>
                    <option value="4">Phone</option>
                    <option value="5">Tablet</option>
                    <option value="6">Connected Device</option>
                    <option value="7">Set Top Box</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Operating System</label>
                  <select class="form-select" name="deviceOS">
                    <option value="iOS">iOS</option>
                    <option value="Android">Android</option>
                    <option value="Windows">Windows</option>
                    <option value="macOS">macOS</option>
                    <option value="Linux">Linux</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="config-section advanced-config">
              <h4>Advanced Configuration</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Currency</label>
                  <select class="form-select" name="currency">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Timeout (ms)</label>
                  <input type="number" class="form-input" name="timeout" value="1000" min="100" max="5000">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label class="form-label">Custom Extensions (JSON)</label>
                  <textarea class="form-textarea" name="extensions" placeholder='{"custom": "value"}'></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-generate ${this.props.isGenerating ? 'loading' : ''}" 
                  ${this.props.isGenerating ? 'disabled' : ''}>
            ${this.props.isGenerating ? 'Generating...' : 'Generate Sample'}
          </button>
          <button class="btn-reset" type="button">Reset Form</button>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const templateSelect = this.element.querySelector('.template-select') as HTMLSelectElement;
    const generateBtn = this.element.querySelector('.btn-generate') as HTMLButtonElement;
    const resetBtn = this.element.querySelector('.btn-reset') as HTMLButtonElement;
    const adTypeSelect = this.element.querySelector('[name="adType"]') as HTMLSelectElement;

    // Template selection
    templateSelect.addEventListener('change', (e) => {
      const templateId = (e.target as HTMLSelectElement).value;
      this.handleTemplateChange(templateId);
    });

    // Ad type change
    adTypeSelect.addEventListener('change', (e) => {
      const adType = (e.target as HTMLSelectElement).value;
      this.toggleAdTypeConfig(adType);
    });

    // Generate button
    generateBtn.addEventListener('click', () => {
      this.handleGenerate();
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      this.resetForm();
    });
  }

  private handleTemplateChange(templateId: string): void {
    const template = this.props.availableTemplates.find(t => t.id === templateId);
    const descriptionEl = this.element.querySelector('.template-description') as HTMLElement;
    
    if (template) {
      descriptionEl.innerHTML = `
        <div class="template-info">
          <p class="template-desc">${template.description}</p>
          <span class="template-category">${template.category}</span>
        </div>
      `;
      this.populateFormFromTemplate(template);
    } else {
      descriptionEl.innerHTML = '';
    }
  }

  private populateFormFromTemplate(template: SampleTemplate): void {
    const config = template.config;
    
    // Populate form fields based on template configuration
    Object.keys(config).forEach(key => {
      const input = this.element.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLSelectElement;
      if (input) {
        input.value = config[key];
      }
    });
  }

  private toggleAdTypeConfig(adType: string): void {
    const bannerConfig = this.element.querySelector('.banner-config') as HTMLElement;
    
    // Show/hide configuration sections based on ad type
    bannerConfig.style.display = adType === 'banner' ? 'block' : 'none';
  }

  private handleGenerate(): void {
    const config = this.collectFormData();
    this.props.onGenerate(config);
  }

  private collectFormData(): any {
    const formData = new FormData(this.element.querySelector('.sample-config-form') as HTMLFormElement);
    const config: any = {};

    // Collect all form data
    for (const [key, value] of formData.entries()) {
      config[key] = value;
    }

    // Handle special cases
    const extensionsInput = this.element.querySelector('[name="extensions"]') as HTMLTextAreaElement;
    if (extensionsInput.value.trim()) {
      try {
        config.extensions = JSON.parse(extensionsInput.value);
      } catch (error) {
        console.warn('Invalid JSON in extensions field');
      }
    }

    return config;
  }

  private resetForm(): void {
    const form = this.element.querySelector('.sample-config-form') as HTMLFormElement;
    form.reset();
    
    // Reset template selection
    const templateSelect = this.element.querySelector('.template-select') as HTMLSelectElement;
    templateSelect.value = '';
    this.handleTemplateChange('');
  }

  updateProps(newProps: Partial<SampleConfigFormProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }
}

/**
 * Sample Preview Component
 */
export class SamplePreviewComponent {
  private element: HTMLElement;
  private props: SamplePreviewProps;

  constructor(container: HTMLElement, props: SamplePreviewProps) {
    this.element = container;
    this.props = props;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    if (!this.props.sample) {
      this.element.innerHTML = `
        <div class="sample-preview empty">
          <div class="empty-state">
            <h3>No Sample Generated</h3>
            <p>Configure and generate a sample to see the preview here.</p>
          </div>
        </div>
      `;
      return;
    }

    this.element.innerHTML = `
      <div class="sample-preview">
        <div class="preview-header">
          <h3>Generated Sample</h3>
          <div class="preview-controls">
            <div class="mode-toggle">
              <button class="mode-btn ${this.props.mode === 'formatted' ? 'active' : ''}" 
                      data-mode="formatted">Formatted</button>
              <button class="mode-btn ${this.props.mode === 'raw' ? 'active' : ''}" 
                      data-mode="raw">Raw JSON</button>
            </div>
            <button class="btn-edit">Edit Sample</button>
          </div>
        </div>
        
        <div class="preview-content">
          ${this.renderSampleContent()}
        </div>
        
        <div class="preview-actions">
          <button class="btn-copy">Copy to Clipboard</button>
          <button class="btn-validate">Validate Sample</button>
          <button class="btn-export">Export Sample</button>
        </div>
      </div>
    `;
  }

  private renderSampleContent(): string {
    if (!this.props.sample) return '';

    if (this.props.mode === 'formatted') {
      return this.renderFormattedView();
    } else {
      return this.renderRawView();
    }
  }

  private renderFormattedView(): string {
    const sample = this.props.sample!;
    
    return `
      <div class="formatted-view">
        <div class="sample-section">
          <h4>Request Information</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>ID:</label>
              <span class="value">${sample.id}</span>
            </div>
            <div class="info-item">
              <label>Test Mode:</label>
              <span class="value">${sample.test ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-item">
              <label>Timeout:</label>
              <span class="value">${sample.tmax || 'Not set'} ms</span>
            </div>
            <div class="info-item">
              <label>Currency:</label>
              <span class="value">${sample.cur?.[0] || 'USD'}</span>
            </div>
          </div>
        </div>

        <div class="sample-section">
          <h4>Impressions (${sample.imp?.length || 0})</h4>
          ${sample.imp?.map((imp, index) => `
            <div class="impression-item">
              <h5>Impression ${index + 1}</h5>
              <div class="info-grid">
                <div class="info-item">
                  <label>ID:</label>
                  <span class="value">${imp.id}</span>
                </div>
                ${imp.banner ? `
                  <div class="info-item">
                    <label>Banner Size:</label>
                    <span class="value">${imp.banner.w}x${imp.banner.h}</span>
                  </div>
                  <div class="info-item">
                    <label>Position:</label>
                    <span class="value">${this.getBannerPositionName(imp.banner.pos)}</span>
                  </div>
                ` : ''}
                ${imp.bidfloor ? `
                  <div class="info-item">
                    <label>Bid Floor:</label>
                    <span class="value">${imp.bidfloor} ${imp.bidfloorcur || 'USD'}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('') || '<p>No impressions</p>'}
        </div>

        ${sample.device ? `
          <div class="sample-section">
            <h4>Device Information</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Type:</label>
                <span class="value">${this.getDeviceTypeName(sample.device.devicetype)}</span>
              </div>
              <div class="info-item">
                <label>OS:</label>
                <span class="value">${sample.device.os || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <label>User Agent:</label>
                <span class="value">${sample.device.ua || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <label>IP:</label>
                <span class="value">${sample.device.ip || 'Not specified'}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderRawView(): string {
    return `
      <div class="raw-view">
        <pre class="json-content"><code>${JSON.stringify(this.props.sample, null, 2)}</code></pre>
      </div>
    `;
  }

  private getBannerPositionName(pos?: number): string {
    const positions: Record<number, string> = {
      0: 'Unknown',
      1: 'Above the fold',
      3: 'Below the fold',
      4: 'Header',
      5: 'Footer',
      6: 'Sidebar',
      7: 'Fullscreen'
    };
    return positions[pos || 0] || 'Unknown';
  }

  private getDeviceTypeName(type?: number): string {
    const types: Record<number, string> = {
      1: 'Mobile/Tablet',
      2: 'Personal Computer',
      3: 'Connected TV',
      4: 'Phone',
      5: 'Tablet',
      6: 'Connected Device',
      7: 'Set Top Box'
    };
    return types[type || 1] || 'Unknown';
  }

  private setupEventListeners(): void {
    // Mode toggle buttons
    const modeButtons = this.element.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.target as HTMLButtonElement).dataset.mode as 'formatted' | 'raw';
        this.props.onModeChange(mode);
      });
    });

    // Edit button
    const editBtn = this.element.querySelector('.btn-edit') as HTMLButtonElement;
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (this.props.sample) {
          this.props.onEdit(this.props.sample);
        }
      });
    }

    // Copy button
    const copyBtn = this.element.querySelector('.btn-copy') as HTMLButtonElement;
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyToClipboard();
      });
    }
  }

  private async copyToClipboard(): Promise<void> {
    if (!this.props.sample) return;

    try {
      const text = JSON.stringify(this.props.sample, null, 2);
      await navigator.clipboard.writeText(text);
      
      // Show feedback
      const copyBtn = this.element.querySelector('.btn-copy') as HTMLButtonElement;
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  updateProps(newProps: Partial<SamplePreviewProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }
}

/**
 * Main Sample Generation Interface Component
 */
export class SampleGenerationInterface {
  private container: HTMLElement;
  private state: SampleGenerationUIState;
  private configFormComponent: SampleConfigFormComponent;
  private previewComponent: SamplePreviewComponent;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      selectedTemplate: null,
      customConfig: {},
      generatedSample: null,
      isGenerating: false,
      previewMode: 'formatted'
    };
    this.initialize();
  }

  private initialize(): void {
    this.container.innerHTML = `
      <div class="sample-generation-interface">
        <div class="generation-config-section"></div>
        <div class="generation-preview-section"></div>
      </div>
    `;

    const configSection = this.container.querySelector('.generation-config-section') as HTMLElement;
    const previewSection = this.container.querySelector('.generation-preview-section') as HTMLElement;

    // Mock available templates for now
    const availableTemplates: SampleTemplate[] = [
      {
        id: 'banner-basic',
        name: 'Basic Banner',
        description: 'Simple banner ad request with standard dimensions',
        category: 'Banner',
        config: {
          adType: 'banner',
          bannerWidth: 300,
          bannerHeight: 250,
          deviceType: 1
        }
      },
      {
        id: 'video-instream',
        name: 'In-Stream Video',
        description: 'Video ad request for in-stream placement',
        category: 'Video',
        config: {
          adType: 'video',
          deviceType: 1
        }
      },
      {
        id: 'mobile-banner',
        name: 'Mobile Banner',
        description: 'Mobile-optimized banner ad request',
        category: 'Mobile',
        config: {
          adType: 'banner',
          bannerWidth: 320,
          bannerHeight: 50,
          deviceType: 4
        }
      }
    ];

    this.configFormComponent = new SampleConfigFormComponent(configSection, {
      onGenerate: (config) => this.handleGeneration(config),
      isGenerating: this.state.isGenerating,
      availableTemplates
    });

    this.previewComponent = new SamplePreviewComponent(previewSection, {
      sample: this.state.generatedSample,
      mode: this.state.previewMode,
      onModeChange: (mode) => this.handleModeChange(mode),
      onEdit: (sample) => this.handleEditSample(sample)
    });
  }

  private async handleGeneration(config: any): Promise<void> {
    this.state.isGenerating = true;
    this.state.customConfig = config;
    this.updateComponents();

    try {
      // This would integrate with the actual sample service
      const generatedSample = await this.performSampleGeneration(config);
      this.state.generatedSample = generatedSample;
    } catch (error) {
      console.error('Sample generation failed:', error);
    } finally {
      this.state.isGenerating = false;
      this.updateComponents();
    }
  }

  private async performSampleGeneration(config: any): Promise<ORTBRequest> {
    // This would integrate with the SampleService
    // Simulated for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `sample-${Date.now()}`,
          test: config.testMode === '1' ? 1 : 0,
          tmax: parseInt(config.timeout) || 1000,
          cur: [config.currency || 'USD'],
          imp: [{
            id: '1',
            banner: config.adType === 'banner' ? {
              w: parseInt(config.bannerWidth) || 300,
              h: parseInt(config.bannerHeight) || 250,
              pos: parseInt(config.bannerPosition) || 0
            } : undefined,
            bidfloor: 0.5,
            bidfloorcur: config.currency || 'USD'
          }],
          device: {
            devicetype: parseInt(config.deviceType) || 1,
            os: config.deviceOS || 'iOS',
            ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            ip: '192.168.1.1'
          }
        });
      }, 1500);
    });
  }

  private handleModeChange(mode: 'formatted' | 'raw'): void {
    this.state.previewMode = mode;
    this.updateComponents();
  }

  private handleEditSample(sample: ORTBRequest): void {
    // This would open the sample in an editor
    console.log('Edit sample:', sample);
  }

  private updateComponents(): void {
    this.configFormComponent.updateProps({
      isGenerating: this.state.isGenerating
    });

    this.previewComponent.updateProps({
      sample: this.state.generatedSample,
      mode: this.state.previewMode
    });
  }

  // Public API
  public getState(): SampleGenerationUIState {
    return { ...this.state };
  }

  public clearSample(): void {
    this.state.generatedSample = null;
    this.updateComponents();
  }
}

/**
 * Main Validation Interface Component
 */
export class ValidationInterface {
  private container: HTMLElement;
  private state: ValidationUIState;
  private inputComponent: ValidationInputComponent;
  private resultsComponent: ValidationResultsComponent;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      jsonInput: '',
      isValidating: false,
      validationResult: null,
      syntaxErrors: [],
      showDetails: false
    };
    this.initialize();
  }

  private initialize(): void {
    this.container.innerHTML = `
      <div class="validation-interface">
        <div class="validation-input-section"></div>
        <div class="validation-results-section"></div>
      </div>
    `;

    const inputSection = this.container.querySelector('.validation-input-section') as HTMLElement;
    const resultsSection = this.container.querySelector('.validation-results-section') as HTMLElement;

    this.inputComponent = new ValidationInputComponent(inputSection, {
      value: this.state.jsonInput,
      onChange: (value) => this.handleInputChange(value),
      onValidate: (request) => this.handleValidation(request),
      isValidating: this.state.isValidating,
      syntaxErrors: this.state.syntaxErrors
    });

    this.resultsComponent = new ValidationResultsComponent(resultsSection, {
      result: this.state.validationResult,
      isLoading: this.state.isValidating,
      onToggleDetails: () => this.toggleDetails(),
      showDetails: this.state.showDetails
    });
  }

  private handleInputChange(value: string): void {
    this.state.jsonInput = value;
    // Clear previous validation results when input changes
    this.state.validationResult = null;
    this.updateComponents();
  }

  private async handleValidation(request: ORTBRequest): Promise<void> {
    this.state.isValidating = true;
    this.updateComponents();

    try {
      // This would integrate with the actual validation service
      // For now, we'll simulate the validation
      const validationResult = await this.performValidation(request);
      this.state.validationResult = validationResult;
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      this.state.isValidating = false;
      this.updateComponents();
    }
  }

  private async performValidation(request: ORTBRequest): Promise<ValidationResult> {
    // This would integrate with the ValidationService
    // Simulated for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isValid: true,
          errors: [],
          warnings: [],
          complianceLevel: 0.95,
          validatedFields: ['id', 'imp', 'imp.0.id', 'imp.0.banner'],
          timestamp: new Date(),
          requestId: 'test-request-id'
        });
      }, 1000);
    });
  }

  private toggleDetails(): void {
    this.state.showDetails = !this.state.showDetails;
    this.updateComponents();
  }

  private updateComponents(): void {
    this.inputComponent.updateProps({
      value: this.state.jsonInput,
      isValidating: this.state.isValidating,
      syntaxErrors: this.state.syntaxErrors
    });

    this.resultsComponent.updateProps({
      result: this.state.validationResult,
      isLoading: this.state.isValidating,
      showDetails: this.state.showDetails
    });
  }

  // Public API
  public getState(): ValidationUIState {
    return { ...this.state };
  }

  public setInput(json: string): void {
    this.state.jsonInput = json;
    this.updateComponents();
  }

  public clearResults(): void {
    this.state.validationResult = null;
    this.state.syntaxErrors = [];
    this.updateComponents();
  }
}

/**
 * Unified Toolbar Component
 */
export class ToolbarComponent {
  private element: HTMLElement;
  private props: ToolbarProps;

  constructor(container: HTMLElement, props: ToolbarProps) {
    this.element = container;
    this.props = props;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="unified-toolbar">
        <div class="toolbar-left">
          <div class="tool-logo">
            <span class="logo-icon">🔍</span>
            <span class="logo-text">ORTB Validator</span>
          </div>
          <div class="mode-navigation">
            <button class="nav-btn ${this.props.mode === 'validation' ? 'active' : ''}" 
                    data-mode="validation">
              <span class="nav-icon">✓</span>
              <span class="nav-text">Validation</span>
            </button>
            <button class="nav-btn ${this.props.mode === 'generation' ? 'active' : ''}" 
                    data-mode="generation">
              <span class="nav-icon">⚡</span>
              <span class="nav-text">Generation</span>
            </button>
          </div>
        </div>
        
        <div class="toolbar-right">
          <div class="toolbar-actions">
            <button class="action-btn ${!this.props.canExport ? 'disabled' : ''}" 
                    data-action="export" 
                    ${!this.props.canExport ? 'disabled' : ''}>
              <span class="action-icon">📥</span>
              <span class="action-text">Export</span>
            </button>
            <button class="action-btn ${!this.props.canShare ? 'disabled' : ''}" 
                    data-action="share"
                    ${!this.props.canShare ? 'disabled' : ''}>
              <span class="action-icon">🔗</span>
              <span class="action-text">Share</span>
            </button>
          </div>
          <div class="toolbar-menu">
            <button class="menu-btn" data-action="menu">
              <span class="menu-icon">⋮</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Mode navigation
    const navButtons = this.element.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLButtonElement).dataset.mode as 'validation' | 'generation';
        this.props.onModeChange(mode);
      });
    });

    // Action buttons
    const exportBtn = this.element.querySelector('[data-action="export"]') as HTMLButtonElement;
    const shareBtn = this.element.querySelector('[data-action="share"]') as HTMLButtonElement;

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (this.props.canExport) {
          this.props.onExport();
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (this.props.canShare) {
          this.props.onShare();
        }
      });
    }
  }

  updateProps(newProps: Partial<ToolbarProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }
}

/**
 * Navigation Component
 */
export class NavigationComponent {
  private element: HTMLElement;
  private props: NavigationProps;

  constructor(container: HTMLElement, props: NavigationProps) {
    this.element = container;
    this.props = props;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="navigation-component">
        <div class="nav-tabs">
          <button class="nav-tab ${this.props.currentMode === 'validation' ? 'active' : ''}" 
                  data-mode="validation">
            <span class="tab-icon">🔍</span>
            <span class="tab-label">Validate ORTB</span>
            <span class="tab-description">Check request compliance</span>
          </button>
          <button class="nav-tab ${this.props.currentMode === 'generation' ? 'active' : ''}" 
                  data-mode="generation">
            <span class="tab-icon">⚡</span>
            <span class="tab-label">Generate Sample</span>
            <span class="tab-description">Create test requests</span>
          </button>
        </div>
        
        ${this.props.preserveContext ? `
          <div class="context-indicator">
            <span class="context-icon">💾</span>
            <span class="context-text">Context preserved</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  private setupEventListeners(): void {
    const navTabs = this.element.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLButtonElement).dataset.mode as 'validation' | 'generation';
        this.props.onNavigate(mode);
      });
    });
  }

  updateProps(newProps: Partial<NavigationProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }
}

/**
 * Main Unified Tool Interface
 */
export class UnifiedToolInterface {
  private container: HTMLElement;
  private currentMode: 'validation' | 'generation';
  private preserveContext: boolean;
  private contextData: {
    validationInput?: string;
    validationResult?: any;
    generatedSample?: any;
  };

  private toolbarComponent: ToolbarComponent;
  private navigationComponent: NavigationComponent;
  private validationInterface: ValidationInterface;
  private sampleGenerationInterface: SampleGenerationInterface;

  constructor(container: HTMLElement) {
    this.container = container;
    this.currentMode = 'validation';
    this.preserveContext = true;
    this.contextData = {};
    this.initialize();
  }

  private initialize(): void {
    this.container.innerHTML = `
      <div class="unified-tool-interface">
        <div class="tool-header">
          <div class="toolbar-section"></div>
          <div class="navigation-section"></div>
        </div>
        <div class="tool-content">
          <div class="validation-mode" style="display: block;"></div>
          <div class="generation-mode" style="display: none;"></div>
        </div>
        <div class="tool-footer">
          <div class="status-bar">
            <span class="status-text">Ready</span>
            <span class="mode-indicator">${this.currentMode} mode</span>
          </div>
        </div>
      </div>
    `;

    this.setupComponents();
    this.setupEventListeners();
  }

  private setupComponents(): void {
    const toolbarSection = this.container.querySelector('.toolbar-section') as HTMLElement;
    const navigationSection = this.container.querySelector('.navigation-section') as HTMLElement;
    const validationSection = this.container.querySelector('.validation-mode') as HTMLElement;
    const generationSection = this.container.querySelector('.generation-mode') as HTMLElement;

    // Initialize toolbar
    this.toolbarComponent = new ToolbarComponent(toolbarSection, {
      mode: this.currentMode,
      onModeChange: (mode) => this.handleModeChange(mode),
      onExport: () => this.handleExport(),
      onShare: () => this.handleShare(),
      canExport: false,
      canShare: false
    });

    // Initialize navigation
    this.navigationComponent = new NavigationComponent(navigationSection, {
      currentMode: this.currentMode,
      onNavigate: (mode) => this.handleModeChange(mode),
      preserveContext: this.preserveContext
    });

    // Initialize validation interface
    this.validationInterface = new ValidationInterface(validationSection);

    // Initialize sample generation interface
    this.sampleGenerationInterface = new SampleGenerationInterface(generationSection);
  }

  private setupEventListeners(): void {
    // Listen for validation results to enable export/share
    this.monitorValidationState();
    this.monitorGenerationState();
  }

  private monitorValidationState(): void {
    // This would be implemented with proper event listeners or observers
    // For now, we'll use a simple polling mechanism
    setInterval(() => {
      const validationState = this.validationInterface.getState();
      const hasResults = validationState.validationResult !== null;
      
      if (this.currentMode === 'validation') {
        this.updateToolbarActions(hasResults, hasResults);
      }
      
      // Preserve context
      if (this.preserveContext) {
        this.contextData.validationInput = validationState.jsonInput;
        this.contextData.validationResult = validationState.validationResult;
      }
    }, 1000);
  }

  private monitorGenerationState(): void {
    setInterval(() => {
      const generationState = this.sampleGenerationInterface.getState();
      const hasSample = generationState.generatedSample !== null;
      
      if (this.currentMode === 'generation') {
        this.updateToolbarActions(hasSample, hasSample);
      }
      
      // Preserve context
      if (this.preserveContext) {
        this.contextData.generatedSample = generationState.generatedSample;
      }
    }, 1000);
  }

  private handleModeChange(mode: 'validation' | 'generation'): void {
    if (mode === this.currentMode) return;

    // Preserve current context if enabled
    if (this.preserveContext) {
      this.preserveCurrentContext();
    }

    // Switch modes
    this.currentMode = mode;
    this.switchToMode(mode);

    // Restore context if enabled
    if (this.preserveContext) {
      this.restoreContext(mode);
    }

    // Update components
    this.updateComponents();
    this.updateStatusBar();
  }

  private switchToMode(mode: 'validation' | 'generation'): void {
    const validationSection = this.container.querySelector('.validation-mode') as HTMLElement;
    const generationSection = this.container.querySelector('.generation-mode') as HTMLElement;

    if (mode === 'validation') {
      validationSection.style.display = 'block';
      generationSection.style.display = 'none';
    } else {
      validationSection.style.display = 'none';
      generationSection.style.display = 'block';
    }
  }

  private preserveCurrentContext(): void {
    if (this.currentMode === 'validation') {
      const state = this.validationInterface.getState();
      this.contextData.validationInput = state.jsonInput;
      this.contextData.validationResult = state.validationResult;
    } else {
      const state = this.sampleGenerationInterface.getState();
      this.contextData.generatedSample = state.generatedSample;
    }
  }

  private restoreContext(mode: 'validation' | 'generation'): void {
    if (mode === 'validation' && this.contextData.validationInput) {
      this.validationInterface.setInput(this.contextData.validationInput);
    }
    // Generation context is automatically preserved in the component state
  }

  private updateComponents(): void {
    this.toolbarComponent.updateProps({
      mode: this.currentMode
    });

    this.navigationComponent.updateProps({
      currentMode: this.currentMode,
      preserveContext: this.preserveContext
    });
  }

  private updateToolbarActions(canExport: boolean, canShare: boolean): void {
    this.toolbarComponent.updateProps({
      canExport,
      canShare
    });
  }

  private updateStatusBar(): void {
    const statusText = this.container.querySelector('.status-text') as HTMLElement;
    const modeIndicator = this.container.querySelector('.mode-indicator') as HTMLElement;

    statusText.textContent = 'Ready';
    modeIndicator.textContent = `${this.currentMode} mode`;
  }

  private handleExport(): void {
    if (this.currentMode === 'validation') {
      this.exportValidationResults();
    } else {
      this.exportGeneratedSample();
    }
  }

  private handleShare(): void {
    if (this.currentMode === 'validation') {
      this.shareValidationResults();
    } else {
      this.shareGeneratedSample();
    }
  }

  private exportValidationResults(): void {
    const state = this.validationInterface.getState();
    if (state.validationResult) {
      const data = {
        input: state.jsonInput,
        result: state.validationResult,
        timestamp: new Date().toISOString()
      };
      
      this.downloadJSON(data, `validation-results-${Date.now()}.json`);
    }
  }

  private exportGeneratedSample(): void {
    const state = this.sampleGenerationInterface.getState();
    if (state.generatedSample) {
      this.downloadJSON(state.generatedSample, `ortb-sample-${Date.now()}.json`);
    }
  }

  private shareValidationResults(): void {
    // This would integrate with the sharing service
    console.log('Sharing validation results...');
  }

  private shareGeneratedSample(): void {
    // This would integrate with the sharing service
    console.log('Sharing generated sample...');
  }

  private downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Public API
  public getCurrentMode(): 'validation' | 'generation' {
    return this.currentMode;
  }

  public setMode(mode: 'validation' | 'generation'): void {
    this.handleModeChange(mode);
  }

  public toggleContextPreservation(): void {
    this.preserveContext = !this.preserveContext;
    this.updateComponents();
  }

  public getValidationInterface(): ValidationInterface {
    return this.validationInterface;
  }

  public getSampleGenerationInterface(): SampleGenerationInterface {
    return this.sampleGenerationInterface;
  }
}