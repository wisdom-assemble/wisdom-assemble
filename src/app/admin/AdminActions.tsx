'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '...' : '確認'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
    >
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
        <button
          onClick={handleBan}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded text-white disabled:opacity-50 ${
            isBanned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading ? '...' : '確認'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`shrink-0 text-xs px-2 py-1 rounded border ${
        isBanned
          ? 'text-green-700 border-green-300 hover:bg-green-50'
          : 'text-red-600 border-red-200 hover:bg-red-50'
      }`}
    >
      {isBanned ? 'BAN解除' : 'BAN'}
    </button>
  )
}
