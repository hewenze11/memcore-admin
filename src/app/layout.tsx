import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MemCore Admin',
  description: 'MemCore 运营管理后台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
