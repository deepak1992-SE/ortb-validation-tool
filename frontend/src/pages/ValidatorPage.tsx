import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Download,
  Copy,
  FileText,
  Zap,
  Clock
} from 'lucide-react'
import { apiClient, ValidationResult } from '@/lib/api'
import { cn, downloadFile, copyToClipboard, isValidJSON, prettifyJSON } from '@/lib/utils'
import { JsonEditor } from '@/components/JsonEditor'
import { ValidationResults } from '@/components/ValidationResults'
import { FileUpload } from '@/components/FileUpload'

const sampleRequest = {
  id: "sample-request-001",
  imp: [{
    id: "1",
    banner: {
      w: 300,
      h: 250,
      format: [{ w: 300, h: 250 }]
    },
    bidfloor: 0.5,
    bidfloorcur: "USD"
  }],
  site: {
    id: "sample-site",
    domain: "example.com",
    page: "https://example.com/page"
  },
  device: {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ip: "192.168.1.1"
  },
  at: 1,
  tmax: 120
}

export function ValidatorPage() {
  const [jsonInput, setJsonInput] = useState(prettifyJSON(sampleRequest))
  const [validationOptions, setValidationOptions] = useState({
    strict: false,
    includeWarnings: true
  })
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const validateMutation = useMutation({
    mutationFn: apiClient.validateRequest,
    onSuccess: (result) => {
      setValidationResult(result)
      if (result.isValid) {
        toast.success('Validation successful!')
      } else {
        toast.error(`Validation failed with ${result.errors.length} errors`)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Validation failed')
      console.error('Validation error:', error)
    }
  })

  const handleValidate = () => {
    if (!jsonInput.trim()) {
      toast.error('Please enter a JSON request to validate')
      return
    }

    if (!isValidJSON(jsonInput)) {
      toast.error('Invalid JSON format')
      return
    }

    try {
      const request = JSON.parse(jsonInput)
      validateMutation.mutate({
        request,
        options: validationOptions
      })
    } catch (error) {
      toast.error('Failed to parse JSON')
    }
  }

  const handleFileUpload = (content: string) => {
    setJsonInput(content)
    toast.success('File uploaded successfully')
  }

  const handleCopyResult = async () => {
    if (validationResult) {
      try {
        await copyToClipboard(prettifyJSON(validationResult))
        toast.success('Results copied to clipboard')
      } catch {
        toast.error('Failed to copy to clipboard')
      }
    }
  }

  const handleDownloadResult = () => {
    if (validationResult) {
      const filename = `validation-result-${Date.now()}.json`
      downloadFile(prettifyJSON(validationResult), filename)
      toast.success('Results downloaded')
    }
  }

  const handleLoadSample = () => {
    setJsonInput(prettifyJSON(sampleRequest))
    toast.success('Sample request loaded')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ORTB Request Validator
        </h1>
        <p className="text-lg text-gray-600">
          Validate your OpenRTB 2.6 bid requests against IAB specifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                JSON Request
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLoadSample}
                  className="btn-secondary btn-sm inline-flex items-center space-x-1"
                >
                  <FileText className="w-4 h-4" />
                  <span>Load Sample</span>
                </button>
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            </div>

            <div className="mb-4">
              <JsonEditor
                value={jsonInput}
                onChange={setJsonInput}
                height="400px"
                placeholder="Paste your OpenRTB JSON request here..."
              />
            </div>

            {/* Validation Options */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Validation Options
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={validationOptions.strict}
                    onChange={(e) => setValidationOptions(prev => ({
                      ...prev,
                      strict: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Strict validation mode
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={validationOptions.includeWarnings}
                    onChange={(e) => setValidationOptions(prev => ({
                      ...prev,
                      includeWarnings: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include warnings
                  </span>
                </label>
              </div>
            </div>

            {/* Validate Button */}
            <div className="mt-6">
              <button
                onClick={handleValidate}
                disabled={validateMutation.isPending || !jsonInput.trim()}
                className={cn(
                  "btn-primary btn-lg w-full inline-flex items-center justify-center space-x-2",
                  validateMutation.isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                {validateMutation.isPending ? (
                  <>
                    <div className="spinner" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Validate Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {validationResult ? (
            <>
              {/* Results Summary */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Validation Results
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyResult}
                      className="btn-secondary btn-sm inline-flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={handleDownloadResult}
                      className="btn-secondary btn-sm inline-flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  <div className={cn(
                    "inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium",
                    validationResult.isValid
                      ? "bg-success-100 text-success-800"
                      : "bg-error-100 text-error-800"
                  )}>
                    {validationResult.isValid ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>
                      {validationResult.isValid ? 'Valid Request' : 'Invalid Request'}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {validationResult.complianceScore}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Compliance Score
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-1">
                      <Clock className="w-5 h-5" />
                      <span>{validationResult.processingTime}ms</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Processing Time
                    </div>
                  </div>
                </div>

                {/* Compliance Level */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Compliance Level</div>
                  <div className={cn(
                    "inline-block px-3 py-1 rounded-full text-sm font-medium",
                    validationResult.complianceScore >= 90 ? "bg-success-100 text-success-800" :
                    validationResult.complianceScore >= 70 ? "bg-warning-100 text-warning-800" :
                    "bg-error-100 text-error-800"
                  )}>
                    {validationResult.complianceLevel}
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <ValidationResults result={validationResult} />
            </>
          ) : (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to validate
              </h3>
              <p className="text-gray-600">
                Enter your OpenRTB JSON request and click validate to see detailed results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}