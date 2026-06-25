'use client'

import Link from 'next/link'
import { useTenant } from './TenantProvider'

export default function Header() {
  const tenant = useTenant()

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: 'var(--color-primary)' }}>
          {tenant?.name ?? 'Wisdom Assemble'}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/questions" className="text-gray-600 hover:text-gray-900">質問一覧</Link>
          <Link
            href="/questions/new"
            className="px-3 py-1.5 rounded text-white text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            質問する
          </Link>
        </nav>
      </div>
    </header>
  )
}
