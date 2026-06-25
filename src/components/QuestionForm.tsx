'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuestionForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setSubmitting(true)
    setError('')

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

      const { slug } = await res.json()
      router.push(`/questions/${slug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          詳細 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="問題の詳細、試したこと、エラーメッセージなどを書いてください"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[200px] resize-y"
          required
        />
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
  )
}
