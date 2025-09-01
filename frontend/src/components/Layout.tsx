import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  CheckCircle, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Home,
  Github,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Validator', href: '/validator', icon: CheckCircle },
  { name: 'Sample Generator', href: '/samples', icon: FileText },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ORTB Validator</h1>
                  <p className="text-xs text-gray-500">OpenRTB 2.6 Compliance Tool</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/your-repo/ortb-validation-tool"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.iab.com/wp-content/uploads/2016/03/OpenRTB-API-Specification-Version-2-5-FINAL.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>OpenRTB Spec</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-sm text-gray-600">
                ORTB Validation Tool helps ensure your OpenRTB 2.6 bid requests 
                comply with IAB specifications for programmatic advertising.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Features</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Real-time validation</li>
                <li>• Sample generation</li>
                <li>• Detailed error reporting</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <a href="/docs" className="hover:text-gray-900 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.iab.com/guidelines/openrtb/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <span>OpenRTB Specification</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              © 2024 ORTB Validation Tool. Built for the programmatic advertising community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}