import { useState } from 'react'
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Lightbulb,
  ExternalLink
} from 'lucide-react'
import { ValidationResult } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ValidationResultsProps {
  result: ValidationResult
}

export function ValidationResults({ result }: ValidationResultsProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set())
  const [expandedWarnings, setExpandedWarnings] = useState<Set<number>>(new Set())

  const toggleErrorExpansion = (index: number) => {
    const newExpanded = new Set(expandedErrors)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedErrors(newExpanded)
  }

  const toggleWarningExpansion = (index: number) => {
    const newExpanded = new Set(expandedWarnings)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedWarnings(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-error-600 bg-error-50 border-error-200'
      case 'warning':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Errors Section */}
      {result.errors.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <XCircle className="w-5 h-5 text-error-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Errors ({result.errors.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-4",
                  getSeverityColor(error.severity)
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getSeverityIcon(error.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {error.code}
                        </span>
                        {error.field && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {error.field}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2">
                        {error.message}
                      </p>
                      
                      {error.suggestion && (
                        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium mb-1">Suggestion:</div>
                              <div className="text-sm">{error.suggestion}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(error.suggestion) && (
                    <button
                      onClick={() => toggleErrorExpansion(index)}
                      className="ml-2 p-1 hover:bg-white hover:bg-opacity-50 rounded"
                    >
                      {expandedErrors.has(index) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {result.warnings.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Warnings ({result.warnings.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {result.warnings.map((warning, index) => (
              <div
                key={index}
                className="border border-warning-200 bg-warning-50 text-warning-600 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {warning.code}
                        </span>
                        {warning.field && (
                          <span className="text-xs bg-warning-200 text-warning-800 px-2 py-1 rounded">
                            {warning.field}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2">
                        {warning.message}
                      </p>
                      
                      {warning.suggestion && expandedWarnings.has(index) && (
                        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-warning-300">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium mb-1">Suggestion:</div>
                              <div className="text-sm">{warning.suggestion}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {warning.suggestion && (
                    <button
                      onClick={() => toggleWarningExpansion(index)}
                      className="ml-2 p-1 hover:bg-white hover:bg-opacity-50 rounded"
                    >
                      {expandedWarnings.has(index) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {result.isValid && result.errors.length === 0 && (
        <div className="card p-6 bg-success-50 border-success-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-success-900 mb-1">
                Validation Successful!
              </h3>
              <p className="text-success-700">
                Your OpenRTB request is fully compliant with IAB specifications.
                {result.warnings.length > 0 && (
                  <span className="block mt-1">
                    Note: There are {result.warnings.length} warnings that you may want to review.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="card p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Additional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Request ID:</span>
            <span className="ml-2 font-mono text-gray-900">{result.requestId}</span>
          </div>
          <div>
            <span className="text-gray-600">Processing Time:</span>
            <span className="ml-2 text-gray-900">{result.processingTime}ms</span>
          </div>
          <div>
            <span className="text-gray-600">Compliance Score:</span>
            <span className="ml-2 text-gray-900">{result.complianceScore}%</span>
          </div>
          <div>
            <span className="text-gray-600">Compliance Level:</span>
            <span className="ml-2 text-gray-900">{result.complianceLevel}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm">
            <a
              href="/docs"
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <span>View Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.iab.com/guidelines/openrtb/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <span>OpenRTB Specification</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}