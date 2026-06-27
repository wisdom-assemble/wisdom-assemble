'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  questionId: string
}

export default function AnswerForm({ questionId }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (body.trim().length < 30) {
      setError('回答は30文字以上入力してください')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, body }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '投稿に失敗しました')
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
      <h3 className="text-sm font-semibold text-gray-700">回答を投稿する</h3>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="あなたの経験・知識をシェアしてください（30文字以上）"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[120px] resize-y"
      />
      <p className="text-xs text-gray-400">{body.length}文字</p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || body.trim().length < 30}
        className="px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {submitting ? '送信中...' : '回答を投稿する'}
      </button>
    </form>
  )
}
