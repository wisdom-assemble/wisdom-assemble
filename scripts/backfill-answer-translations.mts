/**
 * 翻訳が欠けている回答を埋め直す（2026-08-17 追加）
 *
 * 用途: translate.ts の不具合で body_i18n が空/不完全なまま保存された回答を、
 *       修正後のコードで翻訳し直してDBへ書き戻す。
 *
 * 使い方:
 *   npx tsx scripts/backfill-answer-translations.mts          # 対象を表示するだけ（dry run）
 *   npx tsx scripts/backfill-answer-translations.mts --apply  # 実際に書き込む
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

const APPLY = process.argv.includes('--apply')
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const TARGET_LOCALES = ['en', 'zh', 'id', 'vi', 'ko', 'es', 'pt']

const { translateToLocales } = await import('../src/lib/translate')

const res = await fetch(
  `${URL_}/rest/v1/answers?select=id,tenant_id,body,source_locale,body_i18n,is_ai&order=created_at.asc`,
  { headers: h }
)
const rows = (await res.json()) as Array<{
  id: string; tenant_id: string; body: string; source_locale: string | null
  body_i18n: Record<string, string> | null; is_ai: boolean
}>

const src = (r: (typeof rows)[number]) => r.source_locale ?? 'ja'
const missing = (r: (typeof rows)[number]) =>
  TARGET_LOCALES.filter((l) => l !== src(r) && !(r.body_i18n ?? {})[l])

const targets = rows.filter((r) => missing(r).length > 0)
console.log(`回答 ${rows.length}件中、翻訳が欠けているもの ${targets.length}件`)
if (!APPLY) console.log('（dry run。実際に書き込むには --apply を付けてください）')
console.log()

for (const r of targets) {
  const miss = missing(r)
  console.log(`[${r.tenant_id}] ${r.id.slice(0, 8)}  ${r.body.length}字  欠落 ${miss.length}/7 (${miss.join(',')})`)
  if (!APPLY) continue

  const t0 = Date.now()
  const out = await translateToLocales(r.body, src(r))
  const merged = { ...(r.body_i18n ?? {}), ...out }
  const got = TARGET_LOCALES.filter((l) => l !== src(r) && merged[l])

  if (got.length === 0) {
    console.log(`   ❌ 翻訳できず（${Date.now() - t0}ms）。スキップします`)
    continue
  }

  const up = await fetch(`${URL_}/rest/v1/answers?id=eq.${r.id}`, {
    method: 'PATCH',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ body_i18n: merged }),
  })
  console.log(
    `   ${up.ok ? '✅' : '❌ HTTP ' + up.status} ${got.length}/7 保存（${Date.now() - t0}ms）` +
      `  ${TARGET_LOCALES.filter((l) => l !== src(r)).map((l) => `${l}:${(merged[l] || '').length}`).join(' ')}`
  )
  await new Promise((r) => setTimeout(r, 4500)) // GeminiのRPM15対策
}
