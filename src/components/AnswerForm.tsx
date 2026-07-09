'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

type Props = {
  questionId: string
}

export default function AnswerForm({ questionId }: Props) {
  const t = useTranslations('answerForm')
  const locale = useLocale()
  const router = useRouter()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (body.trim().length < 30) {
      setError(t('tooShort'))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': window.location.hostname.split('.')[0] === 'localhost' ? 'debug' : window.location.hostname.split('.')[0],
        },
        body: JSON.stringify({ questionId, body, locale }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('submitFailed'))
      }

      setBody('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{t('heading')}</h3>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('bodyPlaceholder')}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[120px] resize-y"
      />
      <p className="text-xs text-gray-400">{t('bodyCharCount', { count: body.length })}</p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || body.trim().length < 30}
        className="px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
