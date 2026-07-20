'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/components/TenantProvider'

type OverlayPhase = 'ai' | 'matched' | null

function Overlay({ phase, aiLabel, matchingLabel }: { phase: OverlayPhase; aiLabel: string; matchingLabel: string }) {
  if (!phase) return null
  const label = phase === 'ai' ? aiLabel : matchingLabel
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

// AI利用上限モーダル。resetAtがあれば「あとHH:MM:SS」をライブ表示（時刻計算のみ＝AIコストゼロ）。
// resetAtが無い(Groq自身の429/ブロック等)場合は曖昧文言にフォールバック。
function AiCapModal({
  resetAt,
  onClose,
  t,
}: {
  resetAt: string | null
  onClose: () => void
  t: (key: string, values?: Record<string, string>) => string
}) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!resetAt) return
    const target = new Date(resetAt).getTime()
    const tick = () => {
      const ms = target - Date.now()
      if (ms <= 0) {
        setRemaining('00:00:00')
        return
      }
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1000)
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [resetAt])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-7 shadow-2xl text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('aiCapTitle')}</h2>
        {resetAt ? (
          <p className="text-sm text-gray-600 leading-relaxed mb-1">
            {t('aiCapWithTime')}
            <span className="block mt-1 text-2xl font-bold tabular-nums text-gray-800">{remaining || '—:—:—'}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed mb-1">{t('aiCapVague')}</p>
        )}
        <p className="text-sm text-gray-600 leading-relaxed mt-3 mb-6">{t('aiCapRouted')}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {t('aiCapClose')}
        </button>
      </div>
    </div>
  )
}

export default function QuestionForm() {
  const t = useTranslations('questionForm')
  const locale = useLocale()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [overlay, setOverlay] = useState<OverlayPhase>(null)
  const [capModal, setCapModal] = useState<{ slug: string; result: string; resetAt: string | null } | null>(null)
  const [error, setError] = useState('')
  const [similar, setSimilar] = useState<SimilarQuestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // middlewareが解決した内部テナントID（例: bug.→'debug'）。
  // 以前はhostname先頭を直接使っており公開サブドメイン('bug')と内部ID('debug')が
  // ズレて類似質問が常に0件だった。
  const tenantId = useTenantId()

  // タイトル入力時に類似質問を検索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (title.trim().length < 5) { setSimilar([]); return }

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      // PostgRESTの.or()構文を壊す/注入し得る記号を除去してからキーワード化
      const keywords = title.trim()
        .split(/[\s　、。？！,.!?()（）*%\\]+/)
        .filter(w => w.length >= 2)
        .slice(0, 4)
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
  }, [title, tenantId])

  // No.26 下書き保存: 入力をlocalStorageに退避し、リロードや誤って離脱しても消えないように（テナント別）
  const draftKey = `wa_draft_${tenantId}`
  // マウント時に下書きを復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const d = JSON.parse(saved)
        if (typeof d.title === 'string') setTitle(d.title)
        if (typeof d.body === 'string') setBody(d.body)
      }
    } catch { /* 破損データは無視 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])
  // 入力変更を保存（両方空なら削除）
  useEffect(() => {
    try {
      if (title.trim() || body.trim()) {
        localStorage.setItem(draftKey, JSON.stringify({ title, body }))
      } else {
        localStorage.removeItem(draftKey)
      }
    } catch { /* 容量超過等は無視 */ }
  }, [title, body, draftKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    if (title.trim().length < 5) { setError(t('titleTooShort')); return }
    if (body.trim().length < 30) { setError(t('bodyTooShort')); return }

    setSubmitting(true)
    setError('')
    setOverlay('ai')

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, locale }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('submitFailed'))
      }

      const { slug, result, aiCapped, aiResetAt } = await res.json()
      // 投稿成功したので下書きを消去
      try { localStorage.removeItem(draftKey) } catch { /* noop */ }

      // AI上限で人間へ回された場合はモーダルで案内（閉じたら質問ページへ）
      if (aiCapped) {
        setOverlay(null)
        setCapModal({ slug, result: result ?? 'pending', resetAt: aiResetAt ?? null })
        return
      }

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
      <Overlay phase={overlay} aiLabel={t('aiThinking')} matchingLabel={t('matching')} />
      {capModal && (
        <AiCapModal
          resetAt={capModal.resetAt}
          t={t}
          onClose={() => router.push(`/questions/${capModal.slug}?result=${capModal.result}`)}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('titleLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            maxLength={200}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>

          {/* 類似質問サジェスト */}
          {similar.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 mb-1.5">{t('similarQuestionsFound')}</p>
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
                      {q.status === 'solved' ? t('statusSolved') : t('statusInProgress')}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-2">{t('similarStillOpen')}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('bodyLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('bodyPlaceholder')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[200px] resize-y font-mono"
            required
          />
          <p className="text-xs text-gray-400 mt-1">{t('bodyCharCount', { count: body.length })}</p>
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
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </>
  )
}
