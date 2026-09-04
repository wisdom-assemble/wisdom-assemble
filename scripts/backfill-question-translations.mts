// 質問（タイトル・本文）の翻訳バックフィル
// ------------------------------------------------------------
// backfill-answer-translations.mts の質問版。2026-09-05に作成。
// 投稿時に translateQuestionToLocales が失敗すると title_i18n / body_i18n が
// 空のまま残る（実際に9/5未明の6問で発生）。回答用しか無かったので追加した。
//
//   npx tsx scripts/backfill-question-translations.mts          # dry run
//   npx tsx scripts/backfill-question-translations.mts --apply  # 実際に書き込む
//
// ⚠️1回では通らないことがある。失敗時はきっかり18秒（TRANSLATE_BUDGET_MS）
//   かかるので、18秒かかったら失敗と判断して叩き直す。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnvLocal() {
  // npx tsx で直接動かすスクリプトは .env.local を自動で読まないので手で読む
  const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnvLocal()

const APPLY = process.argv.includes('--apply')

const { createClient } = await import('@supabase/supabase-js')
// ⚠️静的importは巻き上げられて先に評価されるため動的importが必須
// （translate.ts はモジュール読込時に process.env を見て USE_GEMINI を決める）
const { translateQuestionToLocales } = await import('../src/lib/translate')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data: questions, error } = await admin
  .from('questions')
  .select('id, tenant_id, title, body, source_locale, title_i18n, body_i18n')
  .order('created_at', { ascending: false })

if (error) { console.error(error); process.exit(1) }

const need = (questions ?? []).filter((q) => {
  const t = Object.keys(q.title_i18n ?? {}).length
  const b = Object.keys(q.body_i18n ?? {}).length
  return t < 7 || b < 7
})

console.log(`質問 ${questions?.length ?? 0}件中、翻訳が欠けているもの ${need.length}件`)
if (!APPLY) console.log('（dry run。実際に書き込むには --apply を付けてください）\n')

for (const q of need) {
  const t = Object.keys(q.title_i18n ?? {}).length
  const b = Object.keys(q.body_i18n ?? {}).length
  console.log(`[${q.tenant_id}] ${q.id.slice(0, 8)}  タイトル ${t}/7・本文 ${b}/7  ${q.title.slice(0, 34)}`)
  if (!APPLY) continue

  const started = Date.now()
  try {
    const r = await translateQuestionToLocales(q.title, q.body, q.source_locale ?? 'ja')
    const nt = Object.keys(r.title_i18n ?? {}).length
    const nb = Object.keys(r.body_i18n ?? {}).length
    if (nt === 0 && nb === 0) {
      console.log(`   ❌ 翻訳できず（${Date.now() - started}ms）。スキップします`)
      continue
    }
    const { error: upErr } = await admin
      .from('questions')
      .update({ title_i18n: r.title_i18n, body_i18n: r.body_i18n })
      .eq('id', q.id)
    if (upErr) { console.log(`   ❌ 保存に失敗: ${upErr.message}`); continue }
    console.log(`   ✅ タイトル ${nt}/7・本文 ${nb}/7 に更新（${Date.now() - started}ms）`)
  } catch (e) {
    console.log(`   ❌ 翻訳できず（${Date.now() - started}ms）: ${e}`)
  }
}
