/**
 * テナント閾値キャリブレーションツール（2026-07-22 本番コード共有版）
 * ─────────────────────────────────────────────────────────
 * 目的: 新テナント作成時に、そのジャンルの代表質問をAIに通し、
 *       「AIが自信を持って答える(score)」と「実際に正しいか(人間/Claudeのレビュー)」を
 *       突き合わせて最適な信頼度しきい値(threshold)を導く。
 *
 * ⚠️ 旧 calibrate-threshold.mjs はプロンプト・adjustScore・モデルを自前コピーしており、
 *    本番(src/lib/gemini.ts)を修正するたびに必ずズレた（実例: 長文減点500字 vs 1200字、
 *    ゼロ化ルールの「確認ください」有無で、同じ回答なのに較正結果が9件/13件と食い違った）。
 *    → このツールは本番の askWithScoreInScopeCfg() をそのまま呼ぶ。単一ソースなのでズレない。
 *
 * ⚠️ AIの自己申告スコアは「正しさ」を保証しない（2026-07-22実測）。機材・ビンテージ系は
 *    自信満々に事実誤りを返す。スコアだけで閾値を決めず、必ず回答の正誤レビューを併用する。
 *
 * 使い方:
 *   1) 設定ファイルを用意（scripts/calibration.sample.json 参照）
 *   2) npx tsx scripts/calibrate-threshold.mts <config.json>
 *   3) 出力された各回答の正誤を Claude(+初期はユーザー) がレビューし、
 *      config の各質問に "correct": true/false を記入
 *   4) 再実行すると、間違いのすぐ上に推奨threshold＋AIカバー率＋現閾値の安全性を算出
 *
 * 使用モデル・料金・補正ルールはすべて本番 gemini.ts 側の設定に従う
 * （GEMINI_API_KEY があればGemini、無ければGroqへフォールバック）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { askWithScoreInScopeCfg, type GenreConfig } from '../src/lib/gemini'

const CONFIG_PATH = process.argv[2]
if (!CONFIG_PATH) {
  console.error('usage: npx tsx scripts/calibrate-threshold.mts <config.json>')
  process.exit(1)
}

type Q = { id?: string; text: string; correct?: boolean | null }
const cfgRaw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as {
  label: string
  inScope: string
  outScope: string
  threshold?: number
  dangerKeywords?: string
  questions?: Q[]
}
const threshold = cfgRaw.threshold ?? 91
const questions = cfgRaw.questions ?? []
const genre: GenreConfig = {
  label: cfgRaw.label,
  threshold,
  inScope: cfgRaw.inScope,
  outScope: cfgRaw.outScope,
  dangerKeywords: cfgRaw.dangerKeywords ? new RegExp(cfgRaw.dangerKeywords) : undefined,
}

type Row = {
  id: string
  text: string
  score?: number
  inScope?: boolean
  correct?: boolean | null
  answer?: string
  model?: string
  error?: string
}
const results: Row[] = []

// Geminiの無料枠は RPM15。連続実行すると429が多発し設問がスキップされるため、
// 1問ごとに間隔を空ける（本番は1リクエスト/投稿なので影響なし。較正ツール専用の配慮）。
const PACE_MS = 4500
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

for (const [i, q] of questions.entries()) {
  if (i > 0) await sleep(PACE_MS)
  const id = q.id ?? q.text.slice(0, 24)
  try {
    // ここが本番と同一の処理（プロンプト・補正・モデル・料金すべて共有）
    const r = await askWithScoreInScopeCfg(genre, q.text)
    results.push({
      id,
      text: q.text,
      score: r.score, // 補正適用後のスコア（本番の判定に使われる値そのもの）
      inScope: r.inScope,
      correct: q.correct ?? null,
      answer: r.answer,
      model: r.usage?.model,
    })
    console.log('\n============================================================')
    console.log(
      `【${id}】 score=${r.score} inScope=${r.inScope} 判定(th=${threshold})=${r.score >= threshold ? '🤖AI' : '👤人間'}` +
        (q.correct != null ? ` 正誤=${q.correct ? '○正' : '×誤'}` : ' 正誤=未判定')
    )
    console.log('------------------------------------------------------------')
    console.log(r.answer)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({ id, text: q.text, error: msg })
    console.log(`\n【${id}】 ERROR: ${msg}`)
  }
}

// --- 正誤ラベルがある場合、推奨thresholdを算出 ---
const ok = results.filter((r) => r.score != null)
const labeled = ok.filter((r) => r.correct != null)
console.log('\n\n================= SUMMARY =================')
console.log(`model = ${ok[0]?.model ?? '(不明)'} / threshold = ${threshold}`)
if (labeled.length) {
  const wrong = labeled.filter((r) => !r.correct).map((r) => r.score!)
  const correct = labeled.filter((r) => r.correct).map((r) => r.score!)
  const maxWrong = wrong.length ? Math.max(...wrong) : -1
  const recommended = Math.min(100, maxWrong + 1)
  const aiCount = ok.filter((r) => r.score! >= recommended).length
  const wrongAboveCurrent = labeled.filter((r) => !r.correct && r.score! >= threshold)
  console.log(`ラベル済み: ${labeled.length}問（正:${correct.length} 誤:${wrong.length}）`)
  console.log(`間違い回答の最高スコア: ${maxWrong < 0 ? 'なし' : maxWrong}`)
  console.log(`▶ 推奨threshold = ${recommended}（間違いのすぐ上）`)
  console.log(`  そのときAI回答になる割合 = ${Math.round((aiCount / ok.length) * 100)}%（${aiCount}/${ok.length}）`)
  if (correct.length && Math.max(...correct) < recommended) {
    console.log('  ⚠ 正しい回答も推奨threshold未満ばかり＝スコアで正誤を分離できない → 閾値を高く(ほぼ人間)にするのが安全')
  }
  console.log(
    `\n現在のthreshold(${threshold})での安全性: AI回答に混じる「間違い」= ${wrongAboveCurrent.length}件` +
      (wrongAboveCurrent.length ? ` ⚠(${wrongAboveCurrent.map((r) => r.id).join(', ')})` : ' ✅なし')
  )
} else {
  console.log('正誤ラベル未記入。各回答をレビューし、configの各質問に "correct": true/false を付けて再実行してください。')
}

// スコアの分布（バンドが粗いとthresholdの微調整が効かないので確認用）
const bands = new Map<number, number>()
for (const r of ok) bands.set(r.score!, (bands.get(r.score!) ?? 0) + 1)
console.log('\nスコア分布:')
for (const k of [...bands.keys()].sort((a, b) => b - a)) console.log(`  ${k}点: ${'█'.repeat(bands.get(k)!)} (${bands.get(k)})`)

const outPath = CONFIG_PATH.replace(/\.json$/, '') + '.results.json'
let history: unknown[] = []
if (existsSync(outPath)) {
  try {
    history = JSON.parse(readFileSync(outPath, 'utf8'))
  } catch {
    /* 壊れていれば作り直す */
  }
}
history.push({ label: genre.label, model: ok[0]?.model, threshold, results })
writeFileSync(outPath, JSON.stringify(history, null, 2))
console.log(`\n結果を ${outPath} に保存（学習用に蓄積）`)
