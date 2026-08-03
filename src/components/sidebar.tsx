'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '../lib/utils'
import { logout } from '../lib/api'
import {
  LayoutDashboard,
  Settings,
  Users,
  Gift,
  Archive,
  Monitor,
  ScrollText,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '仪表板', icon: LayoutDashboard },
  { href: '/config', label: '系统配置', icon: Settings },
  { href: '/users', label: '用户管理', icon: Users },
  { href: '/free-plan', label: '免费版', icon: Gift },
  { href: '/queue', label: '归档队列', icon: Archive },
  { href: '/monitor', label: '系统监控', icon: Monitor },
  { href: '/audit', label: '操作日志', icon: ScrollText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">MemCore Admin</h1>
        <p className="text-xs text-gray-400 mt-0.5">运营管理后台</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
