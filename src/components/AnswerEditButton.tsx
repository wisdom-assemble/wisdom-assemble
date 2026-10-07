'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

// 【2026-10-07】自分の回答を編集する（本人の人間の回答にだけ出す）。保存すると翻訳もやり直される。
export default function AnswerEditButton({ answerId, initialBody }: { answerId: string; initialBody: string }) {
  const t = useTranslations('answerForm')
  const locale = useLocale()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (body.trim().length < 30) { setError(t('tooShort')); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/answers/${answerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, locale }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? t('submitFailed'))
      }
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => { setBody(initialBody); setEditing(true) }} className="mt-2 text-xs text-gray-400 underline hover:text-gray-600">
        {t('edit')}
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        aria-label={t('edit')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[120px] resize-y"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 rounded text-xs font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {saving ? t('saving') : t('saveEdit')}
        </button>
        <button type="button" onClick={() => setEditing(false)} disabled={saving} className="text-xs text-gray-500 underline">
          {t('cancelEdit')}
        </button>
      </div>
    </div>
  )
}
