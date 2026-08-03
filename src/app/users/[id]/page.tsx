'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '../../../components/auth-guard'
import Sidebar from '../../../components/sidebar'
import { getUser, patchUserPlan, banUser, unbanUser, getUserPlanHistory, User, PlanHistory } from '../../../lib/api'
import { formatBytes, formatDate } from '../../../lib/utils'
import { ArrowLeft } from 'lucide-react'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [history, setHistory] = useState<PlanHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Plan dialog
  const [planDialog, setPlanDialog] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [planReason, setPlanReason] = useState('')

  // Ban dialog
  const [banDialog, setBanDialog] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [u, h] = await Promise.all([getUser(id), getUserPlanHistory(id)])
      setUser(u)
      setHistory(h.items)
      setNewPlan(u.plan)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handlePlanSave = async () => {
    setSaving(true)
    try {
      await patchUserPlan(id, newPlan, expiresAt || null, planReason)
      showToast('套餐已更新')
      setPlanDialog(false)
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleBan = async () => {
    setSaving(true)
    try {
      if (user?.is_banned) {
        await unbanUser(id, banReason)
        showToast('已解封')
      } else {
        await banUser(id, banReason)
        showToast('已封禁')
      }
      setBanDialog(false)
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50"><Sidebar />
        <main className="flex-1 p-8 text-gray-400">加载中...</main>
      </div>
    </AuthGuard>
  )

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}

          <button onClick={() => router.push('/users')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>

          {user && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
                    <p className="text-sm text-gray-500 mt-1">ID: {user.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPlanDialog(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      修改套餐
                    </button>
                    <button onClick={() => { setBanReason(''); setBanDialog(true) }}
                      className={`px-4 py-2 text-sm rounded-lg ${user.is_banned ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                      {user.is_banned ? '解封' : '封禁'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  {[
                    ['套餐', user.plan],
                    ['状态', user.is_banned ? '已封禁' : '正常'],
                    ['存储用量', formatBytes(user.used_storage)],
                    ['注册时间', formatDate(user.created_at)],
                    ['套餐到期', user.plan_expires_at ? formatDate(user.plan_expires_at) : '永久'],
                    ['封禁原因', user.ban_reason || '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan History */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">套餐变更历史</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['时间', '旧套餐', '新套餐', '操作员', '原因'].map(h => (
                        <th key={h} className="text-left px-6 py-3 font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-400">暂无记录</td></tr>
                    ) : history.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{formatDate(row.created_at)}</td>
                        <td className="px-6 py-3">{row.old_plan}</td>
                        <td className="px-6 py-3">{row.new_plan}</td>
                        <td className="px-6 py-3">{row.operator}</td>
                        <td className="px-6 py-3">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Plan Dialog */}
          {planDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-base font-semibold mb-4">修改套餐</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">套餐</label>
                    <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="free">free</option>
                      <option value="basic">basic</option>
                      <option value="pro">pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">到期时间（留空为永久）</label>
                    <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">原因</label>
                    <input value={planReason} onChange={e => setPlanReason(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请填写原因" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setPlanDialog(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                  <button onClick={handlePlanSave} disabled={saving || !planReason}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ban Dialog */}
          {banDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-base font-semibold text-red-700 mb-2">
                  ⚠️ 确认{user?.is_banned ? '解封' : '封禁'}用户
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  此操作将{user?.is_banned ? '解封' : '封禁'}用户 <strong>{user?.email}</strong>
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-700">原因（必填）</label>
                  <input value={banReason} onChange={e => setBanReason(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="请填写原因" />
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setBanDialog(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                  <button onClick={handleBan} disabled={saving || !banReason}
                    className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${user?.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {saving ? '操作中...' : '确认'}
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
