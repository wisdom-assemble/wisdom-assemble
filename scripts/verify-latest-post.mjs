/**
 * 投稿1問ごとの検証スクリプト（2026-07-30 追加）
 *
 * 用途: 実サイトへ質問を投稿した直後に、重い処理（AI回答生成＋7言語翻訳）が
 *       完全に走ったかをDBで確認する。7/26に翻訳が無音で欠落した前例があるため、
 *       投稿キャンペーンでは「1問投稿 → このスクリプトで確認 → 次の1問」の順で進める。
 *
 * 使い方:
 *   node scripts/verify-latest-post.mjs            # 直近1件（全テナント横断）
 *   node scripts/verify-latest-post.mjs dtm        # テナント指定
 *   node scripts/verify-latest-post.mjs dtm 3      # 直近3件
 *
 * 環境変数は .env.local から自動で読む（npx/node で直接動かすと Next.js が
 * 読み込んでくれないため。calibrate-threshold.mts で踏んだ落とし穴と同じ）。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const EXPECTED_LOCALES = ['en', 'zh', 'id', 'vi', 'ko', 'es', 'pt'] // ja以外の7言語

function loadEnvLocal() {
  const here = dirname(fileURLToPath(import.meta.url))
  const raw = readFileSync(join(here, '..', '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const jst = (iso) =>
  new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19)

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が .env.local にありません')
    process.exit(1)
  }

  const tenant = process.argv[2]
  const limit = Number(process.argv[3] ?? 1)
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  const qs = new URLSearchParams({
    select:
      'id,slug,title,status,created_at,source_locale,title_i18n,body_i18n,tenant_id,tags,matched_b_id',
    order: 'created_at.desc',
    limit: String(limit),
  })
  if (tenant) qs.set('tenant_id', `eq.${tenant}`)

  const questions = await fetch(`${url}/rest/v1/questions?${qs}`, { headers }).then((r) => r.json())
  if (!Array.isArray(questions) || questions.length === 0) {
    console.error('質問が取得できませんでした:', questions)
    process.exit(1)
  }

  let allOk = true

  for (const q of questions) {
    const answers = await fetch(
      `${url}/rest/v1/answers?select=id,is_ai,is_accepted,created_at,body,source_locale,body_i18n&question_id=eq.${q.id}&order=created_at.asc`,
      { headers }
    ).then((r) => r.json())

    const ti = Object.keys(q.title_i18n ?? {})
    const bi = Object.keys(q.body_i18n ?? {})
    const missTitle = EXPECTED_LOCALES.filter((l) => !ti.includes(l))
    const missBody = EXPECTED_LOCALES.filter((l) => !bi.includes(l))
    const ai = answers.find?.((a) => a.is_ai)
    const aiI18n = ai ? Object.keys(ai.body_i18n ?? {}) : []
    const missAi = ai ? EXPECTED_LOCALES.filter((l) => !aiI18n.includes(l)) : []

    // 人間の回答も翻訳を確認する。2026-08-17に、回答の body_i18n が7言語すべて
    // 空のまま保存されていたのに、このスクリプトが「✅ すべてOK」と出す事故があった
    // （AI回答しか見ていなかった）。回答の翻訳失敗はAPI側でも握り潰される＝画面にも
    // 出ないため、ここで見ないと誰も気づけない。
    const humans = (answers ?? []).filter?.((a) => !a.is_ai) ?? []
    const humanChecks = humans.map((a) => {
      const src = a.source_locale ?? 'ja'
      const want = EXPECTED_LOCALES.filter((l) => l !== src)
      const i18n = a.body_i18n ?? {}
      const miss = want.filter((l) => !i18n[l])
      // 出力トークンが尽きると数文字だけ入った状態で返ることがある（実測: 2文字）。
      // 原文の1/4未満は欠損とみなす。
      const tooShort = want.filter((l) => i18n[l] && i18n[l].length < (a.body?.length ?? 0) * 0.25)
      return { want: want.length, got: want.length - miss.length, miss, tooShort }
    })
    const humanNg = humanChecks.filter((c) => c.miss.length || c.tooShort.length)

    // AI回答が無い場合は「人間ルーティング」が正常に走っているかを見る
    const routed = !!q.matched_b_id
    const ok =
      missTitle.length === 0 &&
      missBody.length === 0 &&
      humanNg.length === 0 &&
      (ai ? missAi.length === 0 : routed)

    if (!ok) allOk = false

    console.log(`\n${'='.repeat(64)}`)
    console.log(`[${q.tenant_id}] ${q.title}`)
    console.log(`  投稿時刻(JST) : ${jst(q.created_at)}`)
    console.log(`  status        : ${q.status}   元言語: ${q.source_locale}   タグ: ${(q.tags ?? []).join(', ') || '(なし)'}`)
    console.log(`  タイトル翻訳  : ${ti.length}/7 ${missTitle.length ? `❌ 欠落: ${missTitle.join(',')}` : '✅'}`)
    console.log(`  本文翻訳      : ${bi.length}/7 ${missBody.length ? `❌ 欠落: ${missBody.join(',')}` : '✅'}`)
    if (ai) {
      console.log(`  AI回答        : ✅ あり（${ai.body_i18n ? aiI18n.length : 0}/7 言語 ${missAi.length ? `❌ 欠落: ${missAi.join(',')}` : '✅'}）`)
    } else {
      console.log(`  AI回答        : なし → 人間ルーティング ${routed ? '✅ 割当済み' : '❌ 未割当（宙ぶらりん）'}`)
    }
    console.log(`  回答総数      : ${answers.length ?? 0}`)
    humanChecks.forEach((c, i) => {
      const ng = [
        c.miss.length ? `❌ 欠落: ${c.miss.join(',')}` : '',
        c.tooShort.length ? `❌ 短すぎ: ${c.tooShort.join(',')}` : '',
      ].filter(Boolean).join(' ')
      console.log(`  人間回答${i + 1}翻訳 : ${c.got}/${c.want} ${ng || '✅'}`)
    })
    console.log(`  判定          : ${ok ? '✅ OK — 次の質問へ進んでよい' : '❌ NG — 投稿を止めて原因を確認'}`)
  }

  console.log(`\n${allOk ? '✅ すべてOK' : '❌ 問題あり（上記の❌を確認）'}`)
  process.exit(allOk ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
