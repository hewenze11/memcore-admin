'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getAudit, AuditLog } from '../../lib/api'
import { formatDate } from '../../lib/utils'

const ACTION_OPTIONS = [
  'config.update',
  'user.plan_change',
  'user.ban',
  'user.unban',
  'free_plan.update',
  'queue.retry',
  'queue.retry_all',
  'auth.login',
  'auth.logout',
]

export default function AuditPage() {
  const [items, setItems] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(20)
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAudit({ limit, offset, action: actionFilter || undefined })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [limit, offset, actionFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">操作日志</h2>

          {/* Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3">
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setOffset(0) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52">
              <option value="">全部操作类型</option>
              {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无记录</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['时间', '操作员', 'Action', 'Target', '原因', 'IP', '详情'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(log => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDate(log.created_at)}</td>
                        <td className="px-4 py-3 text-gray-700">{log.operator}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono">{log.action}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.target}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.reason}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip}</td>
                        <td className="px-4 py-3 text-blue-600 text-xs">
                          {expandedId === log.id ? '收起' : '展开'}
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr key={`${log.id}-detail`} className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-medium text-gray-500 mb-1">Before</p>
                                <pre className="bg-white border border-gray-200 rounded p-2 text-gray-700 overflow-auto max-h-32">
                                  {JSON.stringify(log.before, null, 2) || '-'}
                                </pre>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 mb-1">After</p>
                                <pre className="bg-white border border-gray-200 rounded p-2 text-gray-700 overflow-auto max-h-32">
                                  {JSON.stringify(log.after, null, 2) || '-'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>共 {total} 条</span>
            <div className="flex gap-2">
              <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">上一页</button>
              <span className="px-3 py-1">{currentPage} / {totalPages || 1}</span>
              <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">下一页</button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
