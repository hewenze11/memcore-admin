'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getFreePlanStats, patchFreePlan, FreePlanStats } from '../../lib/api'

export default function FreePlanPage() {
  const [stats, setStats] = useState<FreePlanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit max slots dialog
  const [slotsDialog, setSlotsDialog] = useState(false)
  const [newMaxSlots, setNewMaxSlots] = useState(0)
  const [slotsReason, setSlotsReason] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await getFreePlanStats()
      setStats(data)
      setNewMaxSlots(data.max_slots)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const handleToggleOpen = async () => {
    if (!stats) return
    if (!confirm(`确认${stats.open ? '关闭' : '开放'}免费版注册？`)) return
    setSaving(true)
    try {
      await patchFreePlan({ open: !stats.open, reason: '管理员手动切换' })
      showToast('已更新')
      await fetchStats()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSlots = async () => {
    setSaving(true)
    try {
      await patchFreePlan({ max_slots: newMaxSlots, reason: slotsReason })
      showToast('已更新')
      setSlotsDialog(false)
      await fetchStats()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const percent = stats ? Math.round((stats.used_slots / stats.max_slots) * 100) : 0

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}

          <h2 className="text-2xl font-bold text-gray-900 mb-6">免费版管理</h2>

          {loading ? (
            <div className="text-gray-400">加载中...</div>
          ) : stats && (
            <div className="space-y-6">
              {/* Slot usage */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">槽位使用情况</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">已使用 / 总量</span>
                  <span className="text-sm font-bold text-gray-900">{stats.used_slots} / {stats.max_slots}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{percent}% 使用率</p>

                <button
                  onClick={() => { setNewMaxSlots(stats.max_slots); setSlotsReason(''); setSlotsDialog(true) }}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  修改上限
                </button>
              </div>

              {/* Open registration toggle */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-2">注册开关</h3>
                <p className="text-sm text-gray-500 mb-4">控制是否允许新用户注册免费版账号</p>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stats.open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {stats.open ? '✅ 开放注册' : '🚫 关闭注册'}
                  </span>
                  <button
                    onClick={handleToggleOpen}
                    disabled={saving}
                    className={`px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 ${stats.open ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {saving ? '操作中...' : stats.open ? '关闭注册' : '开放注册'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slots Dialog */}
          {slotsDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-base font-semibold mb-4">修改槽位上限</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">新上限</label>
                    <input type="number" value={newMaxSlots} onChange={e => setNewMaxSlots(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">原因</label>
                    <input value={slotsReason} onChange={e => setSlotsReason(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请填写原因" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setSlotsDialog(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                  <button onClick={handleSaveSlots} disabled={saving || !slotsReason}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? '保存中...' : '保存'}
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
