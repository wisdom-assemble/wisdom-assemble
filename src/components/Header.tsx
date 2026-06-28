'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from './TenantProvider'

const ADMIN_EMAIL = 'wisdomassemble@gmail.com'

export default function Header() {
  const tenant = useTenant()
  const [user, setUser] = useState<any>(null)
  const [taskCount, setTaskCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { count: bCount } = await supabase.from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('matched_b_id', data.user.id).eq('status', 'open')
        const { count: cCount } = await supabase.from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('matched_c_id', data.user.id).eq('status', 'matched_c')
        setTaskCount((bCount ?? 0) + (cCount ?? 0))
      }
    })

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
          <Link href="/how-it-works" className="text-gray-500 hover:text-gray-800 text-sm hidden sm:inline">
            使い方
          </Link>
          <Link href="/hard" className="text-gray-500 hover:text-gray-800 text-sm">
            🔥 高難度
          </Link>
          {user ? (
            <>
              {user.email === ADMIN_EMAIL && (
                <Link href="/admin" className="text-gray-500 hover:text-gray-800 text-sm">
                  管理
                </Link>
              )}
              <Link href="/profile" className="relative text-gray-500 hover:text-gray-800 text-sm">
                マイページ
                {taskCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {taskCount}
                  </span>
                )}
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
