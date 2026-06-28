'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function MatchingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <p className="text-white text-lg font-medium animate-pulse">別のメンバーにマッチング中...</p>
      </div>
    </div>
  )
}

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

// 別のメンバーに依頼ボタン（質問者が1人目の回答に満足しなかった場合）
export function RematchButton({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function rematch() {
    if (!confirm('別のメンバーに依頼しますか？現在の回答者はそのまま残ります。')) return
    setLoading(true)
    setShowOverlay(true)
    await fetch(`/api/questions/${questionId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    await new Promise(r => setTimeout(r, 1200))
    setShowOverlay(false)
    setDone(true)
    router.refresh()
  }

  if (done) return <p className="text-xs text-gray-400 mt-2 text-center">別のメンバーに依頼しました</p>

  return (
    <>
      {showOverlay && <MatchingOverlay />}
      <button
        onClick={rematch}
        disabled={loading}
        className="w-full mt-3 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : '👤 別のメンバーに依頼する'}
      </button>
    </>
  )
}

// 高難度へ移行ボタン（質問者がいつでも押せる）
export function EscalateHardButton({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function escalate() {
    if (!confirm('🔥 高難度クエストに移行しますか？全メンバーに公開されます。')) return
    setLoading(true)
    await fetch(`/api/questions/${questionId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceHard: true }),
    })
    setDone(true)
    router.refresh()
  }

  if (done) return <p className="text-xs text-red-500 mt-2 text-center">高難度クエストに移行しました</p>

  return (
    <button
      onClick={escalate}
      disabled={loading}
      className="w-full mt-2 py-2 text-sm rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {loading ? '処理中...' : '🔥 高難度クエストに移行する'}
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
