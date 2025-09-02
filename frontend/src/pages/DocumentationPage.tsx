import { useState } from 'react'
import { 
  BookOpen, 
  ChevronRight, 
  ExternalLink,
  Code,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    content: [
      {
        title: 'What is OpenRTB?',
        content: `OpenRTB (Real-Time Bidding) is a protocol that enables real-time auctions for digital advertising inventory. Version 2.6 is the current IAB standard that defines how bid requests and responses should be structured.`
      },
      {
        title: 'Using the Validator',
        content: `Our validation tool helps ensure your bid requests comply with OpenRTB 2.6 specifications. Simply paste your JSON request into the validator and get instant feedback on compliance issues.`
      }
    ]
  },
  {
    id: 'field-reference',
    title: 'Field Reference',
    icon: Code,
    content: [
      {
        title: 'Required Fields',
        content: `Every OpenRTB request must include these essential fields:`,
        list: [
          'id - Unique identifier for the bid request',
          'imp - Array of impression objects being offered',
          'at - Auction type (1 = First Price, 2 = Second Price)'
        ]
      },
      {
        title: 'Impression Object',
        content: `Each impression must specify the ad format:`,
        list: [
          'id - Unique identifier for the impression',
          'banner/video/native/audio - Ad format specification',
          'bidfloor - Minimum bid price (optional)',
          'bidfloorcur - Currency for bid floor (optional)'
        ]
      }
    ]
  },
  {
    id: 'validation-rules',
    title: 'Validation Rules',
    icon: CheckCircle,
    content: [
      {
        title: 'Compliance Levels',
        content: `Our validator assigns compliance scores based on adherence to IAB specifications:`,
        list: [
          'FULLY_COMPLIANT (90-100%) - Meets all requirements',
          'MOSTLY_COMPLIANT (70-89%) - Minor issues or missing optional fields',
          'BASIC_COMPLIANT (50-69%) - Has required fields but lacks recommended ones',
          'NON_COMPLIANT (<50%) - Missing critical required fields'
        ]
      }
    ]
  },
  {
    id: 'common-errors',
    title: 'Common Errors',
    icon: AlertTriangle,
    content: [
      {
        title: 'Missing Required Fields',
        content: `The most common validation errors involve missing required fields:`,
        list: [
          'MISSING_ID - Request must have a unique identifier',
          'MISSING_IMP - At least one impression is required',
          'MISSING_AT - Auction type must be specified',
          'INVALID_IMP_ID - Impression IDs must be unique'
        ]
      },
      {
        title: 'Format Violations',
        content: `Common format issues include:`,
        list: [
          'Invalid banner dimensions (width/height must be positive)',
          'Malformed URLs in page or domain fields',
          'Invalid currency codes (must be 3-letter ISO codes)',
          'Incorrect data types (strings vs numbers)'
        ]
      }
    ]
  }
]

const examples = {
  'basic-display': {
    title: 'Basic Display Request',
    code: `{
  "id": "request-123",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250
    },
    "bidfloor": 0.5,
    "bidfloorcur": "USD"
  }],
  "site": {
    "id": "site-456",
    "domain": "example.com"
  },
  "at": 1
}`
  },
  'video-request': {
    title: 'Video Request',
    code: `{
  "id": "video-request-789",
  "imp": [{
    "id": "1",
    "video": {
      "mimes": ["video/mp4"],
      "minduration": 5,
      "maxduration": 30,
      "protocols": [2, 3],
      "w": 640,
      "h": 480
    }
  }],
  "app": {
    "id": "app-123",
    "bundle": "com.example.app"
  },
  "at": 1
}`
  }
}

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [activeExample, setActiveExample] = useState('basic-display')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Documentation
        </h1>
        <p className="text-lg text-gray-600">
          Complete guide to OpenRTB 2.6 validation and best practices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-8">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors",
                      activeSection === section.id
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                )
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                External Resources
              </h3>
              <div className="space-y-2">
                <a
                  href="https://www.iab.com/guidelines/openrtb/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>IAB OpenRTB Spec</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://github.com/InteractiveAdvertisingBureau/openrtb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Section Content */}
          <div className="card p-8">
            {sections.map((section) => {
              if (section.id !== activeSection) return null
              
              const Icon = section.icon
              return (
                <div key={section.id}>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {section.content.map((item, index) => (
                      <div key={index}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {item.content}
                        </p>
                        {(item as any).list && (
                          <ul className="space-y-2">
                            {(item as any).list.map((listItem: string, listIndex: number) => (
                              <li key={listIndex} className="flex items-start space-x-2">
                                <ChevronRight className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{listItem}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Code Examples */}
          <div className="card p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Code Examples
              </h2>
            </div>

            {/* Example Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              {Object.entries(examples).map(([key, example]) => (
                <button
                  key={key}
                  onClick={() => setActiveExample(key)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    activeExample === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {example.title}
                </button>
              ))}
            </div>

            {/* Example Code */}
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-gray-100">
                <code>{examples[activeExample as keyof typeof examples].code}</code>
              </pre>
            </div>
          </div>

          {/* Best Practices */}
          <div className="card p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-warning-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Best Practices
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Structure
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Always include required fields</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Use unique impression IDs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Specify appropriate bid floors</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Data Quality
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Validate JSON structure</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Use proper data types</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Include relevant optional fields</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}