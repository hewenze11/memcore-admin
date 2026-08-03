'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getQueueStats, getFreePlanStats, getHealth, QueueStats, FreePlanStats, HealthStatus } from '../../lib/api'
import { RefreshCw } from 'lucide-react'

function StatusDot({ status }: { status: string }) {
  const ok = status === 'ok' || status === 'healthy' || status === 'up'
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
  )
}

export default function DashboardPage() {
  const [queue, setQueue] = useState<QueueStats | null>(null)
  const [freePlan, setFreePlan] = useState<FreePlanStats | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [q, fp, h] = await Promise.all([
        getQueueStats(),
        getFreePlanStats(),
        getHealth(),
      ])
      setQueue(q)
      setFreePlan(fp)
      setHealth(h)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [fetchData])

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">仪表板</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>最后刷新: {lastRefresh.toLocaleTimeString('zh-CN')}</span>
              <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">队列积压</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{queue?.pending ?? '-'}</p>
              <p className="text-xs text-gray-400 mt-1">待处理任务</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">DLQ 大小</p>
              <p className={`text-3xl font-bold mt-2 ${(queue?.dlq_size ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {queue?.dlq_size ?? '-'}
              </p>
              <p className="text-xs text-gray-400 mt-1">死信队列任务</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">免费版槽位</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {freePlan ? `${freePlan.used_slots} / ${freePlan.max_slots}` : '-'}
              </p>
              <p className="text-xs text-gray-400 mt-1">已用 / 总量</p>
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">服务健康状态</h3>
            {health ? (
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(health.services).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <div className="flex items-center gap-2">
                      <StatusDot status={status} />
                      <span className={`text-xs font-medium ${status === 'ok' || status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">加载中...</p>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
