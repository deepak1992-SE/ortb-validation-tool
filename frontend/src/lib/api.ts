import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.')
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.')
    }
    return Promise.reject(error)
  }
)

export interface ValidationRequest {
  request: any
  options?: {
    strict?: boolean
    includeWarnings?: boolean
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    code: string
    message: string
    field?: string
    severity: 'error' | 'warning'
    suggestion?: string
  }>
  warnings: Array<{
    code: string
    message: string
    field?: string
    suggestion?: string
  }>
  complianceScore: number
  complianceLevel: string
  processingTime: number
  requestId: string
}

export interface SampleRequest {
  requestType: 'display' | 'video' | 'native' | 'audio'
  includeOptionalFields?: boolean
  customFields?: any
  templateId?: string
}

export interface SampleResponse {
  sample: any
  metadata: {
    generatedAt: string
    requestType: string
    templateUsed?: string
    complianceScore: number
  }
}

export interface ExportRequest {
  data: any
  format: 'json' | 'csv' | 'xml'
  options?: {
    prettify?: boolean
    includeMetadata?: boolean
  }
}

export interface ExportResponse {
  data: string
  format: string
  filename: string
  size: number
}

// API functions
export const apiClient = {
  // Validation endpoints
  validateRequest: async (data: ValidationRequest): Promise<ValidationResult> => {
    const response = await api.post('/validate', data)
    return response.data.data
  },

  validateBatch: async (requests: any[]): Promise<{
    results: ValidationResult[]
    summary: {
      totalRequests: number
      validRequests: number
      invalidRequests: number
      averageComplianceScore: number
    }
  }> => {
    const response = await api.post('/validate/batch', { requests })
    return response.data
  },

  // Sample generation endpoints
  generateSample: async (data: SampleRequest): Promise<SampleResponse> => {
    const config = {
      requestType: data.requestType,
      includeOptionalFields: data.includeOptionalFields || false,
      complexity: data.includeOptionalFields ? 'comprehensive' : 'standard',
      customFields: data.customFields || {}
    }
    const response = await api.post('/generate', { config })
    // Transform the backend response to match the frontend interface
    return {
      sample: response.data.data.request,
      metadata: {
        generatedAt: response.data.data.metadata.generatedAt,
        requestType: response.data.data.config.requestType,
        templateUsed: response.data.data.metadata.templateUsed,
        complianceScore: 100 // Backend doesn't provide this, so default to 100
      }
    }
  },

  getTemplates: async (): Promise<Array<{
    id: string
    name: string
    description: string
    requestType: string
    fields: string[]
  }>> => {
    const response = await api.get('/templates')
    // Transform backend template format to frontend format
    return response.data.data.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      requestType: template.requestType,
      fields: [...template.requiredFields, ...template.optionalFields]
    }))
  },

  generateFromTemplate: async (templateId: string, customFields?: any): Promise<SampleResponse> => {
    const response = await api.post(`/generate/from-template`, { templateId, customFields })
    // Transform the backend response to match the frontend interface
    return {
      sample: response.data.data.request,
      metadata: {
        generatedAt: response.data.data.metadata.generatedAt,
        requestType: response.data.data.config.requestType,
        templateUsed: templateId,
        complianceScore: 100
      }
    }
  },

  // Export endpoints
  exportValidationResult: async (result: ValidationResult, format: string): Promise<ExportResponse> => {
    const response = await api.post('/export/validation', { result, format })
    return response.data
  },

  exportSample: async (sample: any, format: string): Promise<ExportResponse> => {
    const response = await api.post('/export/sample', { sample, format })
    return response.data
  },

  // Analytics endpoints
  getAnalytics: async (): Promise<{
    totalValidations: number
    successRate: number
    commonErrors: Array<{
      code: string
      count: number
      percentage: number
    }>
    recentActivity: Array<{
      timestamp: string
      type: string
      result: string
    }>
  }> => {
    const response = await api.get('/analytics')
    return response.data
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; version: string; uptime: number }> => {
    const response = await api.get('/health')
    return response.data
  },
}

export default api