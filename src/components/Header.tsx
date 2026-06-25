'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from './TenantProvider'

export default function Header() {
  const tenant = useTenant()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: 'var(--color-primary)' }}>
          {tenant?.name ?? 'Wisdom Assemble'}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/questions/new"
                className="px-3 py-1.5 rounded text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                質問する
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 rounded text-white text-sm font-medium"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
