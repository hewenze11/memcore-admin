'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '../../components/auth-guard'
import Sidebar from '../../components/sidebar'
import { getUsers, User } from '../../lib/api'
import { formatBytes, formatDate } from '../../lib/utils'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'

const columnHelper = createColumnHelper<User>()

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [emailFilter, setEmailFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [bannedFilter, setBannedFilter] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Parameters<typeof getUsers>[0] = { page, pageSize }
      if (emailFilter) params.email = emailFilter
      if (planFilter) params.plan = planFilter
      if (bannedFilter !== '') params.is_banned = bannedFilter === 'true'
      const res = await getUsers(params)
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, emailFilter, planFilter, bannedFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const columns = [
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('plan', {
      header: '套餐',
      cell: info => (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('is_banned', {
      header: '状态',
      cell: info => info.getValue()
        ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">已封禁</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">正常</span>,
    }),
    columnHelper.accessor('used_storage', {
      header: '存储用量',
      cell: info => formatBytes(info.getValue()),
    }),
    columnHelper.accessor('created_at', {
      header: '注册时间',
      cell: info => formatDate(info.getValue()),
    }),
    columnHelper.accessor('id', {
      header: '操作',
      cell: info => (
        <button
          onClick={() => router.push(`/users/${info.getValue()}`)}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          详情
        </button>
      ),
    }),
  ]

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">用户管理</h2>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
            <input
              value={emailFilter}
              onChange={e => { setEmailFilter(e.target.value); setPage(1) }}
              placeholder="搜索 Email"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部套餐</option>
              <option value="free">free</option>
              <option value="basic">basic</option>
              <option value="pro">pro</option>
            </select>
            <select value={bannedFilter} onChange={e => { setBannedFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部状态</option>
              <option value="false">正常</option>
              <option value="true">已封禁</option>
            </select>
            <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              搜索
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id} className="text-left px-6 py-3 font-medium text-gray-500">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-3 text-gray-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>共 {total} 条</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">上一页</button>
              <span className="px-3 py-1">{page} / {totalPages || 1}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">下一页</button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
