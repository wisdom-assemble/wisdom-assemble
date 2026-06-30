'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type OverlayPhase = 'ai' | 'matched' | null

function Overlay({ phase }: { phase: OverlayPhase }) {
  if (!phase) return null
  const label = phase === 'ai' ? 'AIが考え中...' : '他のメンバーにマッチング中...'
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <p className="text-white text-lg font-medium animate-pulse">{label}</p>
      </div>
    </div>
  )
}

type SimilarQuestion = { id: string; title: string; slug: string; status: string }

export default function QuestionForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [overlay, setOverlay] = useState<OverlayPhase>(null)
  const [error, setError] = useState('')
  const [similar, setSimilar] = useState<SimilarQuestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // タイトル入力時に類似質問を検索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (title.trim().length < 5) { setSimilar([]); return }

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const tenantId = window.location.hostname.split('.')[0] === 'localhost' ? 'debug' : window.location.hostname.split('.')[0]
      const keywords = title.trim().split(/[\s　、。？！,.!?]+/).filter(w => w.length >= 2).slice(0, 4)
      if (!keywords.length) return
      const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(',')
      const { data } = await supabase
        .from('questions')
        .select('id, title, slug, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'solved')
        .or(orFilter)
        .limit(4)
      setSimilar(data ?? [])
    }, 500)
  }, [title])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    if (title.trim().length < 5) { setError('タイトルは5文字以上入力してください'); return }
    if (body.trim().length < 30) { setError('詳細は30文字以上入力してください'); return }

    setSubmitting(true)
    setError('')
    setOverlay('ai')

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '投稿に失敗しました')
      }

      const { slug, result } = await res.json()

      if (result === 'matched') {
        setOverlay('matched')
        await new Promise(r => setTimeout(r, 1200))
        router.push(`/questions/${slug}?result=matched`)
      } else if (result === 'ai') {
        await new Promise(r => setTimeout(r, 800))
        router.push(`/questions/${slug}?result=ai`)
      } else {
        await new Promise(r => setTimeout(r, 800))
        router.push(`/questions/${slug}?result=pending`)
      }
    } catch (err: any) {
      setOverlay(null)
      if (err.message === 'ログインが必要です') {
        router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Overlay phase={overlay} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：Next.jsでSSRするとhydrationエラーが出る"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            maxLength={200}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>

          {/* 類似質問サジェスト */}
          {similar.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 mb-1.5">💡 似た質問が既にあります — 解決済みのものも確認してみてください</p>
              <ul className="space-y-1">
                {similar.map(q => (
                  <li key={q.id} className="flex items-center gap-2">
                    <a
                      href={`/questions/${q.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex-1 truncate"
                    >
                      {q.title}
                    </a>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      q.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {q.status === 'solved' ? '解決済み' : '対応中'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-2">それでも解決しない場合は、このまま投稿できます。</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            詳細 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="問題の詳細、試したこと、エラーメッセージなどを書いてください（Markdownが使えます）"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[200px] resize-y font-mono"
            required
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}文字 · Markdown対応</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !title.trim() || !body.trim()}
          className="w-full py-2.5 rounded font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {submitting ? '送信中...' : '質問を投稿する'}
        </button>
      </form>
    </>
  )
}
