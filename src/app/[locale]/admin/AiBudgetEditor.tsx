'use client'

// AIの自主上限（層②）をダッシュボードから変更するUI。
// ・オフ＝無料プラン（制限なし・AIは自然にGroq無料枠で頭打ち）
// ・オン＝有料プラン（1日の上限件数を設定。超過したらAIを呼ばず人間ルーティング）
// admin専用API(/api/admin/ai-budget)経由でservice_role RPC(set_ai_budget)を叩く。
import { useState } from 'react'

export default function AiBudgetEditor({
  initialCap,
  initialEnabled,
}: {
  initialCap: number
  initialEnabled: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [cap, setCap] = useState(String(initialCap))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const capNum = Math.max(1, parseInt(cap, 10) || initialCap)
      const res = await fetch('/api/admin/ai-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cap: capNum, enabled }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `保存に失敗しました (${res.status})`)
      }
      const d = await res.json()
      setCap(String(d.cap ?? capNum))
      setEnabled(Boolean(d.enabled))
      setMsg({ ok: true, text: '保存しました' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : '保存に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">② アプリの自主上限（AI 1日あたり）</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {enabled
              ? '有料プラン：上限を超えたらAIを止めて人間へ回します'
              : '無料プラン：制限なし（Groqの無料枠で自然に頭打ち）'}
          </p>
        </div>
        {/* オン/オフトグル */}
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-gray-800' : 'bg-gray-300'}`}
          aria-pressed={enabled}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">1日の上限件数（オン時のみ有効）</label>
          <input
            type="number"
            min={1}
            value={cap}
            disabled={!enabled}
            onChange={(e) => setCap(e.target.value)}
            className="w-28 border border-gray-300 rounded px-2.5 py-1.5 text-sm tabular-nums disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 rounded text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        目安：無料枠は約70件/日。有料化したら上限を余裕を持たせて設定（反映に10〜15分ラグあり）。
      </p>
    </div>
  )
}
