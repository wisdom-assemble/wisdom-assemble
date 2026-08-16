/**
 * 回答の翻訳が欠落した件の再現テスト（2026-08-17）
 *
 * 本番と同じ translateToLocales() を、実際に投稿された回答本文で実行し、
 * 成功するか・何秒かかるかを測る。TRANSLATE_BUDGET_MS(18秒)に収まるかの確認。
 *
 * 使い方: npx tsx scripts/repro-answer-translate.mts
 */
import { readFileSync } from 'node:fs'

function loadEnvLocal() {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}
loadEnvLocal()

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const h = { apikey: KEY, Authorization: `Bearer ${KEY}` }

// 実際に投稿された回答本文を取ってくる
const res = await fetch(`${URL_}/rest/v1/answers?select=body,source_locale&is_ai=eq.false&order=created_at.desc&limit=1`, { headers: h })
const [ans] = await res.json()
if (!ans) { console.error('回答が見つかりません'); process.exit(1) }

console.log(`本文: ${ans.body.length}字 / source_locale=${ans.source_locale}`)
console.log(`予算: 18秒（TRANSLATE_BUDGET_MS）\n`)

// gemini.ts と同様、env を入れてから動的 import する
const { translateToLocales } = await import('../src/lib/translate')

for (let i = 1; i <= 4; i++) {
  const usage = { prompt: 0, completion: 0 }
  const t0 = Date.now()
  try {
    const out = await translateToLocales(ans.body, ans.source_locale ?? 'ja', usage)
    const ms = Date.now() - t0
    const locales = ['en', 'zh', 'id', 'vi', 'ko', 'es', 'pt']
    const got = locales.filter((l) => (out as Record<string, string>)[l])
    console.log(`[${i}回目] ${ms}ms  翻訳 ${got.length}/7  ${got.length === 7 ? '✅' : '★欠落: ' + locales.filter((l) => !got.includes(l)).join(',')}`)
    console.log(`         tokens: prompt=${usage.prompt} completion=${usage.completion}`)
    const o = out as Record<string, string>
    console.log(`         原文 ${ans.body.length}字 → ` + locales.map((l) => `${l}:${(o[l] || '').length}`).join(' '))
    if (o.en) console.log(`         en全文: ${o.en}`)
  } catch (e) {
    console.log(`[${i}回目] ${Date.now() - t0}ms  ❌ 例外: ${e instanceof Error ? e.message : String(e)}`)
  }
}
