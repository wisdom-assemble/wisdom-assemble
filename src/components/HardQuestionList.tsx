'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Question = {
  id: string
  title: string
  slug: string
  created_at: string
  updated_at?: string
  view_count: number
  profiles: { username: string; display_name: string | null } | null
}

export default function HardQuestionList({
  questions,
  tab,
}: {
  questions: Question[]
  tab: 'unsolved' | 'solved'
}) {
  // undefined=未ロード, null=未訪問（全件NEW）, Date=訪問済み
  const [seenAt, setSeenAt] = useState<Date | null | undefined>(undefined)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? 'anonymous'
      const key = `hard_seen_at_${uid}`
      const stored = localStorage.getItem(key)
      // 以前の seen_at を state にセット（NEWバッジ表示用）
      setSeenAt(stored ? new Date(stored) : null)
      // 1秒後に訪問時刻を保存（StrictMode 2回目実行ではキャンセルされる）
      timer = setTimeout(() => {
        localStorage.setItem(key, new Date().toISOString())
      }, 1000)
    })

    return () => clearTimeout(timer)
  }, [])

  return (
    <ul className="divide-y divide-gray-100">
      {questions.map((q) => {
        const createdAt = new Date(q.created_at)
        const solvedAt = tab === 'solved' && q.updated_at ? new Date(q.updated_at) : null
        const hours = solvedAt
          ? Math.round((solvedAt.getTime() - createdAt.getTime()) / 1000 / 60 / 60)
          : null
        // undefined=ロード前は表示しない / null=未訪問で全件NEW / Date=訪問済み比較
        const isNew = tab === 'unsolved' && seenAt !== undefined && (seenAt === null || createdAt > seenAt)

        return (
          <li key={q.id}>
            <Link
              href={`/questions/${q.slug}`}
              className="block py-4 hover:bg-gray-50 -mx-2 px-2 rounded"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      tab === 'solved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {tab === 'solved' ? '解決済み' : '高難度'}
                    </span>
                    {isNew && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white shrink-0">
                        NEW
                      </span>
                    )}
                    <p className="font-medium text-gray-900 truncate">{q.title}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {q.profiles?.display_name ?? q.profiles?.username} ·{' '}
                    {createdAt.toLocaleDateString('ja-JP')} ·{' '}
                    {q.view_count} views
                    {hours !== null && (
                      <span className="ml-2 text-green-600">
                        · 解決まで {hours < 24 ? `${hours}時間` : `${Math.round(hours / 24)}日`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
