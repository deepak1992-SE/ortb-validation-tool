import { useState } from 'react'
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Lightbulb,
  ExternalLink,
  CheckCircle,
  Copy,
  Download,
  BookOpen,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react'
import { ValidationResult } from '@/lib/api'
import { cn, copyToClipboard, downloadFile } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface ValidationResultsProps {
  result: ValidationResult
}

export function ValidationResults({ result }: ValidationResultsProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set())
  const [expandedWarnings, setExpandedWarnings] = useState<Set<number>>(new Set())
  
  const handleCopyResult = async () => {
    try {
      await copyToClipboard(JSON.stringify(result, null, 2))
      toast.success('Validation result copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy result')
    }
  }

  const handleDownloadResult = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `ortb-validation-${timestamp}-${result.requestId?.slice(-8) || 'result'}.json`
      downloadFile(JSON.stringify(result, null, 2), filename, 'application/json')
      toast.success('Validation result downloaded')
    } catch (error) {
      toast.error('Failed to download result')
    }
  }

  const getComplianceBadge = () => {
    const score = result.complianceScore || 0
    if (score >= 90) return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Excellent' }
    if (score >= 75) return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Good' }
    if (score >= 50) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Fair' }
    return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Poor' }
  }

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

  const badge = getComplianceBadge()

  return (
    <div className="space-y-6">
      {/* Validation Summary Card - New for Operations Teams */}
      <div className="card p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {result.isValid ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {result.isValid ? 'Valid ORTB Request' : 'Invalid ORTB Request'}
              </h2>
              <p className="text-gray-600">
                {result.isValid 
                  ? 'Your request meets OpenRTB 2.6 standards'
                  : `${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} found`
                }
              </p>
            </div>
          </div>
          
          {/* Action Buttons for Operations */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyResult}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Copy validation result"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy</span>
            </button>
            <button
              onClick={handleDownloadResult}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download validation result"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid for Operations Teams */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{result.complianceScore || 0}%</div>
            <div className="text-sm text-gray-600 mt-1">Compliance Score</div>
            <div className={cn("inline-block px-2 py-1 rounded-full text-xs font-medium border mt-2", badge.color)}>
              {badge.label}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="w-5 h-5 text-red-600 mr-1" />
              <div className="text-2xl font-bold text-gray-900">{result.errors.length}</div>
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-1" />
              <div className="text-2xl font-bold text-gray-900">{result.warnings?.length || 0}</div>
            </div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-5 h-5 text-blue-600 mr-1" />
              <div className="text-2xl font-bold text-gray-900">{result.processingTime || 0}</div>
            </div>
            <div className="text-sm text-gray-600">ms</div>
          </div>
        </div>

        {/* Quick Actions for Common Issues */}
        {!result.isValid && (
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
              Quick Fix Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <a
                href="/docs#common-errors"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Common Error Fixes</span>
              </a>
              <a
                href="/samples"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Target className="w-4 h-4" />
                <span>Generate Valid Sample</span>
              </a>
            </div>
          </div>
        )}
      </div>
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