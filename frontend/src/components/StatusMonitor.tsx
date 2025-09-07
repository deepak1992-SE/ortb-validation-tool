import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server,
  AlertCircle,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SystemStatus {
  api: 'healthy' | 'degraded' | 'down'
  database: 'connected' | 'disconnected'
  responseTime: number
  uptime: string
  version: string
  requestsToday: number
  errorsToday: number
  successRate: number
}

export function StatusMonitor(): JSX.Element {
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  // Mock health check - replace with real API call
  const { data: status, isLoading, error } = useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      // Simulate API health check
      const response = await fetch('/api/health')
      if (!response.ok) throw new Error('Health check failed')
      const data: any = await response.json()
      
      // Mock additional status data for operations
      setLastChecked(new Date())
      return {
        api: response.ok ? 'healthy' : 'down',
        database: 'connected',
        responseTime: Math.floor(Math.random() * 100) + 20,
        uptime: data.uptime ? Math.floor(data.uptime / 3600) + 'h' : '24h',
        version: data.version || '1.0.0',
        requestsToday: 1247,
        errorsToday: 12,
        successRate: 99.1
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'down':
      case 'disconnected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="w-4 h-4" />
      case 'degraded':
        return <AlertCircle className="w-4 h-4" />
      case 'down':
      case 'disconnected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            <p className="text-sm text-gray-600">
              Last updated: {lastChecked.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {/* Overall Status Indicator */}
        <div className={cn(
          "flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium",
          status?.api === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        )}>
          {status?.api === 'healthy' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{status?.api === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}</span>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">API Status</span>
            <div className={cn("p-1 rounded-full", getStatusColor(status?.api || 'down'))}>
              {getStatusIcon(status?.api || 'down')}
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-900 capitalize">
            {status?.api || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">v{status?.version}</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Response Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {status?.responseTime || 0}ms
          </div>
          <div className="text-xs text-gray-500">Average</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Uptime</span>
            <Server className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {status?.uptime || '0h'}
          </div>
          <div className="text-xs text-gray-500">Current session</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Success Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {status?.successRate || 0}%
          </div>
          <div className="text-xs text-gray-500">Last 24h</div>
        </div>
      </div>

      {/* Usage Statistics */}
      {/* @ts-ignore */}
      {(<div className="bg-white rounded-lg p-4 border border-gray-100">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Today's Activity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{(status?.requestsToday ?? 0) as React.ReactNode}</div>
            <div className="text-sm text-gray-600">Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{(status?.errorsToday ?? 0) as React.ReactNode}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      </div>)}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Operations Dashboard</span>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/analytics"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              View Analytics
            </a>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Unable to fetch system status</span>
          </div>
        </div>
      )}
    </div>
  )
}