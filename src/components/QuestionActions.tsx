'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ベストアンサー選択ボタン（質問者のみ表示）
export function AcceptButton({ questionId, answerId }: { questionId: string; answerId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function accept() {
    setLoading(true)
    await fetch('/api/answers/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answerId }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={accept}
      disabled={loading}
      className="mt-2 text-xs px-3 py-1 rounded border border-green-400 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
    >
      {loading ? '処理中...' : '✓ ベストアンサーに選ぶ'}
    </button>
  )
}

// ギブアップボタン（マッチングされた回答者のみ表示）
export function GiveUpButton({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function giveUp() {
    if (!confirm('ギブアップしますか？次の人にバトンタッチされます。')) return
    setLoading(true)
    await fetch(`/api/questions/${questionId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    setDone(true)
    router.refresh()
  }

  if (done) return <p className="text-xs text-gray-400 mt-2">バトンタッチしました</p>

  return (
    <button
      onClick={giveUp}
      disabled={loading}
      className="mt-2 text-xs px-3 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading ? '処理中...' : 'ギブアップ（次の人へ）'}
    </button>
  )
}
