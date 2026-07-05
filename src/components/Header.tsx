'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from './TenantProvider'
import SiteLogo from './SiteLogo'

const ADMIN_EMAIL = 'wisdomassemble@gmail.com'

export default function Header() {
  const tenant = useTenant()
  const [user, setUser] = useState<any>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hardCount, setHardCount] = useState(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: authData }) => {
      const uid = authData.user?.id ?? 'anonymous'
      const { data } = await supabase
        .from('questions')
        .select('id, created_at')
        .eq('status', 'hard')
        .order('created_at', { ascending: false })
      if (!data?.length) return
      const seen = localStorage.getItem(`hard_seen_at_${uid}`)
      const newCount = seen
        ? data.filter(q => new Date(q.created_at) > new Date(seen)).length
        : data.length  // 未訪問の場合は全件NEW
      setHardCount(newCount)
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: answered } = await supabase
          .from('answers')
          .select('question_id')
          .eq('user_id', data.user.id)
          .eq('is_ai', false)
        const answeredIds = (answered ?? []).map((a: any) => a.question_id)

        const [{ data: bTasks }, { data: cTasks }] = await Promise.all([
          supabase.from('questions').select('id, matched_b_deadline').eq('matched_b_id', data.user.id).eq('status', 'open'),
          supabase.from('questions').select('id, matched_c_deadline').eq('matched_c_id', data.user.id).eq('status', 'matched_c'),
        ])
        const now = new Date()
        const bPending = (bTasks ?? []).filter(q => !q.matched_b_deadline || new Date(q.matched_b_deadline) > now)
        const cPending = (cTasks ?? []).filter(q => !q.matched_c_deadline || new Date(q.matched_c_deadline) > now)
        const pending = [...bPending, ...cPending].filter(q => !answeredIds.includes(q.id))
        setTaskCount(pending.length)

        const { data: myQuestions } = await supabase
          .from('questions')
          .select('id, owner_reviewed_at, answers(id, created_at)')
          .eq('user_id', data.user.id)
          .not('status', 'in', '("solved","hard")')
        const unreviewed = (myQuestions ?? []).filter((q: any) => {
          if (!q.answers?.length) return false
          if (!q.owner_reviewed_at) return true
          return q.answers.some((a: any) => new Date(a.created_at) > new Date(q.owner_reviewed_at))
        })
        setReviewCount(unreviewed.length)
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

  const badge = taskCount + reviewCount

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <SiteLogo name={tenant?.name ?? 'Wisdom Assemble'} />
        </Link>

        {/* PC nav */}
        <nav style={{ display: isMobile ? 'none' : 'flex' }} className="items-center gap-4 text-sm">
          <Link href="/how-it-works" className="text-gray-500 hover:text-gray-800">使い方</Link>
          <Link href="/hard" className="relative text-gray-500 hover:text-gray-800">
            <span className="border border-gray-400 rounded px-2 py-0.5 text-sm font-medium">高難度</span>
            {hardCount > 0 && (
              <span className="absolute -top-1.5 -right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {hardCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              {user.email === ADMIN_EMAIL && (
                <Link href="/admin" className="text-gray-500 hover:text-gray-800">管理</Link>
              )}
              <Link href="/profile" className="relative text-gray-500 hover:text-gray-800">
                マイページ
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {badge}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-800">ログアウト</button>
            </>
          ) : (
            <Link href="/auth/login" className="px-3 py-1.5 rounded text-white text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)' }}>
              ログイン
            </Link>
          )}
        </nav>

        {/* モバイル ハンバーガーボタン */}
        <button
          style={{ display: isMobile ? 'flex' : 'none' }}
          className="relative p-2 text-gray-600"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="メニュー"
        >
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          {badge > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {badge}
            </span>
          )}
        </button>
      </div>

      {/* モバイルメニュー（オーバーレイ） */}
      {menuOpen && isMobile && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full w-56 bg-white border border-gray-200 rounded-bl-lg shadow-lg z-30 px-4 py-3 flex flex-col gap-4 text-sm">
            <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>使い方</Link>
            <Link href="/hard" className="flex items-center gap-1 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
              <span className="border border-gray-400 rounded px-2 py-0.5 text-sm font-medium">高難度</span>
              {hardCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {hardCount}
                </span>
              )}
            </Link>
            {user ? (
              <>
                {user.email === ADMIN_EMAIL && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>管理</Link>
                )}
                <Link href="/profile" className="text-gray-600 hover:text-gray-900 flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                  マイページ
                  {badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {badge}
                    </span>
                  )}
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-left text-gray-600 hover:text-gray-900">
                  ログアウト
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>ログイン</Link>
            )}
          </div>
        </>
      )}
    </header>
  )
}
