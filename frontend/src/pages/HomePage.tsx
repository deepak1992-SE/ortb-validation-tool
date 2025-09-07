import { Link } from 'react-router-dom'
import { 
  CheckCircle, 
  FileText, 
  BarChart3, 
  BookOpen,
  ArrowRight,
  Shield,
  Zap,
  Download,
  Users
} from 'lucide-react'
import { StatusMonitor } from '@/components/StatusMonitor'

const features = [
  {
    icon: CheckCircle,
    title: 'Real-time Validation',
    description: 'Instantly validate your OpenRTB 2.6 bid requests against IAB specifications with detailed error reporting.',
    href: '/validator'
  },
  {
    icon: FileText,
    title: 'Sample Generation',
    description: 'Generate compliant ORTB samples for display, video, native, and audio ad formats with customizable fields.',
    href: '/samples'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track validation metrics, success rates, and identify common issues across your requests.',
    href: '/analytics'
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Comprehensive guides, field references, and best practices for OpenRTB implementation.',
    href: '/docs'
  }
]

const stats = [
  { label: 'Validation Accuracy', value: '99.9%' },
  { label: 'Supported Ad Types', value: '4' },
  { label: 'Export Formats', value: '3' },
  { label: 'Processing Speed', value: '<100ms' }
]

const benefits = [
  {
    icon: Shield,
    title: 'IAB Compliant',
    description: 'Fully compliant with OpenRTB 2.6 specifications and IAB guidelines.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Validate requests in under 100ms with our optimized validation engine.'
  },
  {
    icon: Download,
    title: 'Export Ready',
    description: 'Export validation results and samples in JSON, CSV, and XML formats.'
  },
  {
    icon: Users,
    title: 'Developer Friendly',
    description: 'Built by developers, for developers with comprehensive API documentation.'
  }
]

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              OpenRTB 2.6
              <span className="block text-primary-600">Validation Tool</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Ensure your programmatic advertising bid requests comply with IAB OpenRTB 2.6 
              specifications. Validate, generate samples, and export results with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/validator"
                className="btn-primary btn-lg inline-flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Start Validating</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/samples"
                className="btn-secondary btn-lg inline-flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Generate Samples</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Status Section - For Operations Teams */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              System Status & Operations
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Real-time monitoring dashboard for operations teams. Track system health, 
              performance metrics, and service availability.
            </p>
          </div>
          <StatusMonitor />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for ORTB validation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to validate, generate, and analyze OpenRTB requests 
              with industry-leading accuracy and performance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link
                  key={index}
                  to={feature.href}
                  className="card p-8 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                        <span>Learn more</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why choose our validation tool?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with industry best practices and optimized for performance, 
              reliability, and ease of use.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to validate your ORTB requests?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and ad tech professionals who trust our 
            validation tool for their OpenRTB compliance needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/validator"
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg inline-flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Start Validating Now</span>
            </Link>
            <Link
              to="/docs"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg inline-flex items-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>View Documentation</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}