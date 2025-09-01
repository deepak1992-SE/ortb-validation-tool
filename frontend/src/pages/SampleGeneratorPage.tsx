import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  FileText, 
  Download, 
  Copy, 
  Shuffle, 
  Settings,
  Monitor,
  Video,
  Smartphone,
  Volume2
} from 'lucide-react'
import { apiClient, SampleResponse } from '@/lib/api'
import { cn, downloadFile, copyToClipboard, prettifyJSON } from '@/lib/utils'
import { JsonEditor } from '@/components/JsonEditor'

const adTypes = [
  {
    id: 'display',
    name: 'Display Banner',
    icon: Monitor,
    description: 'Standard display banner ads with various sizes and formats'
  },
  {
    id: 'video',
    name: 'Video',
    icon: Video,
    description: 'Video ads including instream, outstream, and rewarded video'
  },
  {
    id: 'native',
    name: 'Native',
    icon: Smartphone,
    description: 'Native ads that blend with content and app interfaces'
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: Volume2,
    description: 'Audio ads for podcasts, streaming, and voice applications'
  }
] as const

type AdType = typeof adTypes[number]['id']

export function SampleGeneratorPage() {
  const [selectedAdType, setSelectedAdType] = useState<AdType>('display')
  const [includeOptionalFields, setIncludeOptionalFields] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customFields, setCustomFields] = useState('{}')
  const [generatedSample, setGeneratedSample] = useState<SampleResponse | null>(null)

  // Fetch available templates
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: apiClient.getTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const generateMutation = useMutation({
    mutationFn: apiClient.generateSample,
    onSuccess: (result) => {
      setGeneratedSample(result)
      toast.success('Sample generated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate sample')
      console.error('Generation error:', error)
    }
  })

  const generateFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, customFields }: { templateId: string; customFields?: any }) =>
      apiClient.generateFromTemplate(templateId, customFields),
    onSuccess: (result) => {
      setGeneratedSample(result)
      toast.success('Sample generated from template!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate from template')
      console.error('Template generation error:', error)
    }
  })

  const handleGenerate = () => {
    if (selectedTemplate) {
      // Generate from template
      let parsedCustomFields = {}
      try {
        if (customFields.trim()) {
          parsedCustomFields = JSON.parse(customFields)
        }
      } catch {
        toast.error('Invalid JSON in custom fields')
        return
      }

      generateFromTemplateMutation.mutate({
        templateId: selectedTemplate,
        customFields: parsedCustomFields
      })
    } else {
      // Generate basic sample
      generateMutation.mutate({
        requestType: selectedAdType,
        includeOptionalFields
      })
    }
  }

  const handleCopySample = async () => {
    if (generatedSample) {
      try {
        await copyToClipboard(prettifyJSON(generatedSample.sample))
        toast.success('Sample copied to clipboard')
      } catch {
        toast.error('Failed to copy to clipboard')
      }
    }
  }

  const handleDownloadSample = () => {
    if (generatedSample) {
      const filename = `ortb-sample-${selectedAdType}-${Date.now()}.json`
      downloadFile(prettifyJSON(generatedSample.sample), filename)
      toast.success('Sample downloaded')
    }
  }

  const filteredTemplates = templates.filter(t => t.requestType === selectedAdType)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ORTB Sample Generator
        </h1>
        <p className="text-lg text-gray-600">
          Generate compliant OpenRTB 2.6 samples for different ad types and use cases
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Section */}
        <div className="space-y-6">
          {/* Ad Type Selection */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Ad Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedAdType(type.id)
                      setSelectedTemplate('')
                      setGeneratedSample(null)
                    }}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                      selectedAdType === type.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        selectedAdType === type.id
                          ? "bg-primary-100 text-primary-600"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {type.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Template Selection */}
          {filteredTemplates.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Templates (Optional)
              </h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="template"
                    value=""
                    checked={selectedTemplate === ''}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Generate basic sample
                  </span>
                </label>
                {filteredTemplates.map((template) => (
                  <label key={template.id} className="flex items-start">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mt-1 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {template.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Fields: {template.fields.join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Generation Options */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generation Options
            </h2>
            
            <div className="space-y-4">
              {!selectedTemplate && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeOptionalFields}
                    onChange={(e) => setIncludeOptionalFields(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include optional fields
                  </span>
                </label>
              )}

              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Fields (JSON)
                  </label>
                  <JsonEditor
                    value={customFields}
                    onChange={setCustomFields}
                    height="150px"
                    placeholder="Enter custom field overrides..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Override template fields with custom values
                  </p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="mt-6">
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || generateFromTemplateMutation.isPending}
                className={cn(
                  "btn-primary btn-lg w-full inline-flex items-center justify-center space-x-2",
                  (generateMutation.isPending || generateFromTemplateMutation.isPending) && "opacity-50 cursor-not-allowed"
                )}
              >
                {(generateMutation.isPending || generateFromTemplateMutation.isPending) ? (
                  <>
                    <div className="spinner" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-5 h-5" />
                    <span>Generate Sample</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Sample Section */}
        <div className="space-y-6">
          {generatedSample ? (
            <>
              {/* Sample Metadata */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Generated Sample
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopySample}
                      className="btn-secondary btn-sm inline-flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={handleDownloadSample}
                      className="btn-secondary btn-sm inline-flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {generatedSample.metadata.requestType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Generated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(generatedSample.metadata.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Compliance:</span>
                    <span className="ml-2 text-gray-900">
                      {generatedSample.metadata.complianceScore}%
                    </span>
                  </div>
                  {generatedSample.metadata.templateUsed && (
                    <div>
                      <span className="text-gray-600">Template:</span>
                      <span className="ml-2 text-gray-900">
                        {generatedSample.metadata.templateUsed}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample JSON */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  JSON Sample
                </h3>
                <JsonEditor
                  value={prettifyJSON(generatedSample.sample)}
                  onChange={() => {}} // Read-only
                  readOnly
                  height="500px"
                />
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to generate
              </h3>
              <p className="text-gray-600">
                Select your ad type and options, then click generate to create a compliant ORTB sample
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}