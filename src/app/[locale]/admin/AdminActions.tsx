'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/questions/${questionId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('削除に失敗しました')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1 shrink-0">
        <button onClick={handleDelete} disabled={loading} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
          {loading ? '...' : '確認'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50">
          戻る
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="shrink-0 text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50">
      削除
    </button>
  )
}

export function BanUserButton({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleBan() {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ban: !isBanned }),
    })
    if (res.ok) {
      setConfirming(false)
      setLoading(false)
      router.refresh()
    } else {
      alert('操作に失敗しました')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1 shrink-0">
        <button onClick={handleBan} disabled={loading} className={`text-xs px-2 py-1 rounded text-white disabled:opacity-50 ${isBanned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {loading ? '...' : '確認'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50">
          戻る
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className={`shrink-0 text-xs px-2 py-1 rounded border ${isBanned ? 'text-green-700 border-green-300 hover:bg-green-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}>
      {isBanned ? 'BAN解除' : 'BAN'}
    </button>
  )
}

type Question = {
  id: string
  slug: string
  title: string
  status: string
  tenant_id: string
  created_at: string
  matched_b_id?: string | null
  posterName: string
}

type Profile = {
  id: string
  username: string
  display_name: string | null
  answer_count: number
  is_banned: boolean | null
  created_at: string
}

export function QuestionList({ questions, adminUserId }: { questions: Question[]; adminUserId: string }) {
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const filtered = questions.filter(item =>
    item.title.toLowerCase().includes(applied.toLowerCase()) ||
    item.posterName.toLowerCase().includes(applied.toLowerCase())
  )

  return (
    <div>
      <div className="sticky top-[73px] z-[9] bg-white py-2 flex gap-2 mb-4 border-b border-gray-200">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setApplied(q)}
          placeholder="質問タイトルで検索..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={() => setApplied(q)}
          className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 shrink-0"
        >
          検索
        </button>
      </div>
      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <Link href={`/questions/${encodeURIComponent(item.slug ?? item.id)}`} className="text-sm font-medium text-gray-900 hover:underline truncate block">
                {item.title}
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.posterName} · {item.tenant_id} · {new Date(item.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <StatusBadge status={item.status} matchedBId={item.matched_b_id} />
            <DeleteQuestionButton questionId={item.id} />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">該当なし</p>}
      </div>
    </div>
  )
}

export function UserList({ profiles, adminUserId }: { profiles: Profile[]; adminUserId: string }) {
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const filtered = profiles.filter(p =>
    (p.display_name ?? p.username).toLowerCase().includes(applied.toLowerCase()) ||
    p.username.toLowerCase().includes(applied.toLowerCase())
  )

  return (
    <div>
      <div className="sticky top-[73px] z-[9] bg-white py-2 flex gap-2 mb-4 border-b border-gray-200">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setApplied(q)}
          placeholder="ユーザー名で検索..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={() => setApplied(q)}
          className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 shrink-0"
        >
          検索
        </button>
      </div>
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className={`flex items-center gap-3 p-3 border rounded-lg ${p.is_banned ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:bg-gray-50'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {p.display_name ?? p.username}
                {p.is_banned && <span className="ml-2 text-xs text-red-600 font-normal">BAN済み</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                @{p.username} · 回答数 {p.answer_count} · {new Date(p.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            {p.id !== adminUserId && (
              <BanUserButton key={`${p.id}-${p.is_banned}`} userId={p.id} isBanned={!!p.is_banned} />
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">該当なし</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status, matchedBId }: { status: string; matchedBId?: string | null }) {
  const map: Record<string, { label: string; className: string }> = {
    open:         { label: '受付中',          className: 'bg-blue-50 text-blue-700' },
    open_matched: { label: '専門家①が対応中',   className: 'bg-yellow-50 text-yellow-700' },
    ai_answered:  { label: 'AI回答済',        className: 'bg-purple-50 text-purple-700' },
    matched:      { label: '専門家①が対応中',   className: 'bg-yellow-50 text-yellow-700' },
    matched_c:    { label: '専門家②が対応中',  className: 'bg-orange-50 text-orange-700' },
    solved:       { label: '解決済み',        className: 'bg-green-50 text-green-700' },
    hard:         { label: '高難度',          className: 'bg-red-50 text-red-700' },
  }
  const key = status === 'open' && matchedBId ? 'open_matched' : status
  const { label, className } = map[key] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>{label}</span>
}
