'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getConfig, patchConfig, ConfigItem } from '../../lib/api'

const DANGEROUS_KEYS = ['free_plan_storage_limit_bytes', 'free_plan_open_registration']

export default function ConfigPage() {
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<ConfigItem | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editReason, setEditReason] = useState('')
  const [confirmItem, setConfirmItem] = useState<ConfigItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const data = await getConfig()
      setItems(data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  const handleEdit = (item: ConfigItem) => {
    setEditValue(item.value)
    setEditReason('')
    if (DANGEROUS_KEYS.includes(item.key)) {
      setConfirmItem(item)
    } else {
      setEditItem(item)
    }
  }

  const handleSave = async () => {
    if (!editItem && !confirmItem) return
    const item = editItem || confirmItem!
    setSaving(true)
    try {
      await patchConfig(item.key, editValue, editReason)
      setToast('保存成功')
      setEditItem(null)
      setConfirmItem(null)
      await fetchConfig()
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(''), 3000)
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">系统配置</h2>

          {toast && (
            <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Key</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Value</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">描述</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.key} className={DANGEROUS_KEYS.includes(item.key) ? 'bg-red-50' : ''}>
                      <td className="px-6 py-3 font-mono text-xs text-gray-700">{item.key}</td>
                      <td className="px-6 py-3 text-gray-900">{item.value}</td>
                      <td className="px-6 py-3 text-gray-500">{item.description}</td>
                      <td className="px-6 py-3">
                        {item.editable && (
                          <button
                            onClick={() => handleEdit(item)}
                            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                              DANGEROUS_KEYS.includes(item.key)
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Edit Dialog */}
          {editItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-base font-semibold mb-4">编辑配置：{editItem.key}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">新值</label>
                    <input value={editValue} onChange={e => setEditValue(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">修改原因</label>
                    <input value={editReason} onChange={e => setEditReason(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请填写修改原因" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setEditItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                  <button onClick={handleSave} disabled={saving || !editReason}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Dialog for dangerous keys */}
          {confirmItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-base font-semibold text-red-700 mb-2">⚠️ 危险操作确认</h3>
                <p className="text-sm text-gray-600 mb-4">你正在修改关键配置 <code className="bg-gray-100 px-1 rounded">{confirmItem.key}</code>，此操作可能影响所有用户，请谨慎操作。</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">新值</label>
                    <input value={editValue} onChange={e => setEditValue(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">修改原因（必填）</label>
                    <input value={editReason} onChange={e => setEditReason(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="请填写修改原因" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setConfirmItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                  <button onClick={handleSave} disabled={saving || !editReason}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                    {saving ? '保存中...' : '确认修改'}
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
