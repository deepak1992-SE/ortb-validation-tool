import { useState } from 'react'
import { 
  FileText, 
  Monitor, 
  Video, 
  Smartphone, 
  Volume2,
  Copy,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { copyToClipboard } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const quickTemplates = {
  'display-banner': {
    name: 'Display Banner',
    icon: Monitor,
    description: 'Standard 300x250 display banner',
    template: {
      id: "display-request-001",
      imp: [{
        id: "1",
        banner: {
          w: 300,
          h: 250,
          format: [{ w: 300, h: 250 }],
          pos: 1
        },
        bidfloor: 0.5,
        bidfloorcur: "USD"
      }],
      site: {
        id: "site-123",
        name: "Example Site",
        domain: "example.com",
        page: "https://example.com/article",
        cat: ["IAB1"],
        publisher: {
          id: "pub-123",
          name: "Example Publisher"
        }
      },
      device: {
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ip: "192.168.1.1",
        geo: {
          country: "USA",
          region: "CA",
          city: "San Francisco"
        },
        devicetype: 2
      },
      user: {
        id: "user-123",
        yob: 1985,
        gender: "M"
      },
      at: 1,
      tmax: 120,
      cur: ["USD"]
    }
  },
  'video-instream': {
    name: 'Video Instream',
    icon: Video,
    description: 'Pre-roll video advertisement',
    template: {
      id: "video-request-001",
      imp: [{
        id: "1",
        video: {
          w: 640,
          h: 480,
          minduration: 5,
          maxduration: 30,
          protocols: [2, 3, 5, 6],
          mimes: ["video/mp4", "video/webm"],
          pos: 1,
          playbackmethod: [1, 2]
        },
        bidfloor: 1.0,
        bidfloorcur: "USD"
      }],
      site: {
        id: "video-site-123",
        name: "Video Platform",
        domain: "videoplatform.com",
        cat: ["IAB1"],
        content: {
          title: "Example Video Content",
          len: 300
        }
      },
      device: {
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ip: "192.168.1.1",
        devicetype: 2
      },
      at: 1,
      tmax: 100,
      cur: ["USD"]
    }
  },
  'native-feed': {
    name: 'Native Feed',
    icon: Smartphone,
    description: 'Native advertisement for feeds',
    template: {
      id: "native-request-001",
      imp: [{
        id: "1",
        native: {
          request: {
            ver: "1.2",
            layout: 1,
            assets: [
              {
                id: 1,
                required: 1,
                title: {
                  len: 90
                }
              },
              {
                id: 2,
                required: 1,
                img: {
                  type: 3,
                  w: 300,
                  h: 250
                }
              }
            ]
          }
        },
        bidfloor: 0.75,
        bidfloorcur: "USD"
      }],
      app: {
        id: "app-123",
        name: "Social Media App",
        bundle: "com.example.socialapp",
        cat: ["IAB1"],
        publisher: {
          id: "pub-123",
          name: "App Publisher"
        }
      },
      device: {
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        ip: "192.168.1.1",
        devicetype: 1,
        make: "Apple",
        model: "iPhone12"
      },
      at: 1,
      tmax: 120,
      cur: ["USD"]
    }
  },
  'audio-podcast': {
    name: 'Audio Podcast',
    icon: Volume2,
    description: 'Audio advertisement for podcasts',
    template: {
      id: "audio-request-001",
      imp: [{
        id: "1",
        audio: {
          mimes: ["audio/mp3", "audio/mp4"],
          minduration: 15,
          maxduration: 30,
          protocols: [2, 3]
        },
        bidfloor: 0.25,
        bidfloorcur: "USD"
      }],
      app: {
        id: "podcast-app-123",
        name: "Podcast App",
        bundle: "com.example.podcastapp",
        cat: ["IAB1-7"],
        content: {
          title: "Tech Talk Podcast",
          cat: ["IAB19-6"]
        }
      },
      device: {
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        ip: "192.168.1.1",
        devicetype: 1
      },
      at: 1,
      tmax: 120,
      cur: ["USD"]
    }
  }
}

interface QuickTemplatesProps {
  onTemplateSelect?: (template: any, templateName: string) => void
  compact?: boolean
}

export function QuickTemplates({ onTemplateSelect, compact = false }: QuickTemplatesProps) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  const handleCopyTemplate = async (templateKey: string, template: any) => {
    try {
      await copyToClipboard(JSON.stringify(template, null, 2))
      toast.success(`${quickTemplates[templateKey as keyof typeof quickTemplates].name} template copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy template')
    }
  }

  const handleUseTemplate = (templateKey: string, template: any) => {
    const templateName = quickTemplates[templateKey as keyof typeof quickTemplates].name
    if (onTemplateSelect) {
      onTemplateSelect(template, templateName)
      toast.success(`${templateName} template loaded`)
    }
  }

  const toggleExpand = (templateKey: string) => {
    setExpandedTemplate(expandedTemplate === templateKey ? null : templateKey)
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(quickTemplates).map(([key, template]) => {
          const Icon = template.icon
          return (
            <button
              key={key}
              onClick={() => handleUseTemplate(key, template.template)}
              className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              title={`Use ${template.name} template`}
            >
              <Icon className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-xs font-medium text-gray-700 text-center">
                {template.name}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Templates</h3>
        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
          Operations
        </span>
      </div>
      
      <div className="space-y-3">
        {Object.entries(quickTemplates).map(([key, template]) => {
          const Icon = template.icon
          const isExpanded = expandedTemplate === key
          
          return (
            <div key={key} className="border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyTemplate(key, template.template)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {onTemplateSelect && (
                      <button
                        onClick={() => handleUseTemplate(key, template.template)}
                        className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors"
                      >
                        Use Template
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(key)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title={isExpanded ? "Collapse" : "Expand preview"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Template Preview</span>
                    </div>
                    <pre className="text-xs text-gray-600 overflow-x-auto max-h-48 overflow-y-auto">
                      {JSON.stringify(template.template, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Pro Tip:</strong> These templates are pre-validated and ready to use. 
            They follow OpenRTB 2.6 best practices and include all required fields for each ad type.
          </div>
        </div>
      </div>
    </div>
  )
}