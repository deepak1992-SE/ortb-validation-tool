import { useQuery } from '@tanstack/react-query'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'

export function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: apiClient.getAnalytics,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Validations',
      value: analytics?.totalValidations?.toLocaleString() || '0',
      icon: Activity,
      color: 'text-primary-600 bg-primary-100'
    },
    {
      label: 'Success Rate',
      value: `${analytics?.successRate?.toFixed(1) || '0'}%`,
      icon: CheckCircle,
      color: 'text-success-600 bg-success-100'
    },
    {
      label: 'Common Errors',
      value: analytics?.commonErrors?.length || '0',
      icon: AlertTriangle,
      color: 'text-warning-600 bg-warning-100'
    },
    {
      label: 'Recent Activity',
      value: analytics?.recentActivity?.length || '0',
      icon: Clock,
      color: 'text-gray-600 bg-gray-100'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Track validation metrics and identify common issues
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.color)}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Common Errors */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Common Errors
            </h2>
          </div>

          {analytics?.commonErrors && analytics.commonErrors.length > 0 ? (
            <div className="space-y-4">
              {analytics.commonErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {error.code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {error.count} occurrences ({error.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-error-500 h-2 rounded-full"
                      style={{ width: `${error.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
              <p className="text-gray-600">No common errors detected</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>

          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activity.result === 'success' ? 'bg-success-500' : 'bg-error-500'
                  )} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.type} validation
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    activity.result === 'success' 
                      ? 'bg-success-100 text-success-800'
                      : 'bg-error-100 text-error-800'
                  )}>
                    {activity.result}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Rate Trend */}
      <div className="card p-6 mt-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Validation Success Rate
          </h2>
        </div>

        <div className="text-center py-12">
          <div className="text-6xl font-bold text-success-600 mb-4">
            {analytics?.successRate?.toFixed(1) || '0'}%
          </div>
          <p className="text-gray-600 mb-8">
            Overall validation success rate across all requests
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-success-500 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${analytics?.successRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-6 mt-8 bg-primary-50 border-primary-200">
        <div className="flex items-start space-x-3">
          <BarChart3 className="w-6 h-6 text-primary-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Analytics Information
            </h3>
            <p className="text-primary-800 mb-4">
              This dashboard shows real-time analytics for ORTB validation requests. 
              Data is updated every 30 seconds to provide current insights into validation patterns and common issues.
            </p>
            <div className="text-sm text-primary-700">
              <p>• Success rate is calculated from the last 1000 validations</p>
              <p>• Common errors are ranked by frequency over the last 24 hours</p>
              <p>• Recent activity shows the latest 10 validation attempts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}