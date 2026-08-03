'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getHealth, getMetrics, HealthStatus, Metrics } from '../../lib/api'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function MonitorPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [h, m] = await Promise.all([getHealth(), getMetrics()])
      setHealth(h)
      setMetrics(m)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30000)
    return () => clearInterval(t)
  }, [fetchData])

  const serviceDisplayNames: Record<string, string> = {
    memcore_api: 'MemCore API',
    db: '数据库',
    redis: 'Redis',
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">系统监控</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>最后刷新: {lastRefresh.toLocaleTimeString('zh-CN')}</span>
              <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Health Cards */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">服务健康状态</h3>
            <div className="grid grid-cols-3 gap-4">
              {health ? Object.entries(health.services).map(([name, status]) => {
                const ok = status === 'ok' || status === 'up' || status === 'healthy'
                return (
                  <div key={name} className={`bg-white rounded-xl border p-5 flex items-center justify-between ${ok ? 'border-green-200' : 'border-red-200'}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{serviceDisplayNames[name] || name}</p>
                      <p className={`text-xs mt-0.5 font-medium ${ok ? 'text-green-600' : 'text-red-600'}`}>{status}</p>
                    </div>
                    {ok
                      ? <CheckCircle className="w-7 h-7 text-green-500" />
                      : <XCircle className="w-7 h-7 text-red-500" />
                    }
                  </div>
                )
              }) : (
                <div className="col-span-3 text-center text-gray-400 py-8">加载中...</div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-4">近 24h 指标</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-500">活跃用户</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {metrics?.active_users_24h ?? '-'}
                </p>
                <p className="text-xs text-gray-400 mt-1">过去 24 小时活跃</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-500">消息数</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {metrics?.messages_24h ?? '-'}
                </p>
                <p className="text-xs text-gray-400 mt-1">过去 24 小时消息</p>
              </div>
            </div>
          </div>

          {/* Overall status */}
          {health && (
            <div className={`mt-6 rounded-xl p-4 flex items-center gap-3 ${health.status === 'ok' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {health.status === 'ok'
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-red-600" />
              }
              <span className={`text-sm font-medium ${health.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                整体状态: {health.status}
              </span>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
