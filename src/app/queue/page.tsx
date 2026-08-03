'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getQueueStats, getDlq, retryDlqTask, retryAllDlq, QueueStats, DlqTask } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { RefreshCw } from 'lucide-react'

export default function QueuePage() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [dlq, setDlq] = useState<DlqTask[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [retryAllConfirm, setRetryAllConfirm] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([getQueueStats(), getDlq()])
      setStats(s)
      setDlq(d.items)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRetry = async (taskId: string) => {
    setProcessing(taskId)
    try {
      await retryDlqTask(taskId)
      showToast('已重试')
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '操作失败')
    } finally {
      setProcessing(null)
    }
  }

  const handleRetryAll = async () => {
    setProcessing('all')
    try {
      await retryAllDlq()
      showToast('已全部重试')
      setRetryAllConfirm(false)
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '操作失败')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">归档队列</h2>
            <button onClick={fetchData} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">队列积压</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.pending ?? '-'}</p>
              <p className="text-xs text-gray-400 mt-1">待处理任务数</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-500">DLQ 大小</p>
              <p className={`text-3xl font-bold mt-1 ${(stats?.dlq_size ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats?.dlq_size ?? '-'}
              </p>
              <p className="text-xs text-gray-400 mt-1">死信队列任务数</p>
            </div>
          </div>

          {/* DLQ List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">死信队列（DLQ）</h3>
              {dlq.length > 0 && (
                <button onClick={() => setRetryAllConfirm(true)}
                  className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                  全部重试
                </button>
              )}
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : dlq.length === 0 ? (
              <div className="p-8 text-center text-gray-400">DLQ 为空 ✅</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Task ID', 'Message ID', '最后错误', '重试次数', '时间', '操作'].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dlq.map(task => (
                    <tr key={task.task_id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs">{task.task_id.slice(0, 12)}...</td>
                      <td className="px-6 py-3 font-mono text-xs">{task.message_id.slice(0, 12)}...</td>
                      <td className="px-6 py-3 text-red-600 max-w-xs truncate">{task.last_error}</td>
                      <td className="px-6 py-3">{task.retry_count}</td>
                      <td className="px-6 py-3">{formatDate(task.created_at)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleRetry(task.task_id)}
                          disabled={processing === task.task_id}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-50"
                        >
                          {processing === task.task_id ? '重试中...' : '重试'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Retry All Confirm */}
          {retryAllConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-base font-semibold mb-2">确认全部重试？</h3>
                <p className="text-sm text-gray-600 mb-4">将对 DLQ 中 {dlq.length} 个任务全部重试，请确认操作。</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setRetryAllConfirm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                  <button onClick={handleRetryAll} disabled={processing === 'all'}
                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                    {processing === 'all' ? '重试中...' : '确认全部重试'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
