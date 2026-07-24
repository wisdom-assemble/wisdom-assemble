/**
 * テナント閾値キャリブレーションツール（2026-07-22）
 * ─────────────────────────────────────────────
 * 目的: 新テナント作成時に、そのジャンルの代表質問をGroqに通し、
 *       「AIが自信を持って答える(score)」と「実際に正しいか(人間/Claudeの判定)」を突き合わせて
 *       最適な信頼度しきい値(threshold)を導く。
 *
 * ⚠️ 重要な前提（2026-07-22の実測で判明）:
 *   Groqの自己申告スコアは「正しさ」を保証しない。機材・ビンテージ系は
 *   自信満々に事実誤り（例: OD-1のオペアンプをμA741と誤答/score80、Les Paul比較/score90でも粗い）。
 *   → スコアだけで閾値を決めてはいけない。必ず回答の正誤レビューを併用する。
 *
 * 使い方:
 *   1) 設定ファイルを用意（下の calibration.sample.json 参照）
 *   2) node scripts/calibrate-threshold.mjs <config.json>
 *   3) 出力された各回答の正誤を Claude(+初期はユーザー) がレビューし、config の各質問に "correct": true/false を記入
 *   4) 再実行すると、間違いのすぐ上に推奨thresholdを算出＋AI回答カバー率を表示
 *
 * 学習運用: レビュー済み結果は <config>.results.json に追記蓄積。
 *   ジャンルごとにラベル付きデータが増えるほど、推奨thresholdの精度が上がる。
 *   初期はユーザーの専門判断を重視、慣れたらClaudeの正誤判定を主にして自動化を進める。
 *
 * gemini.ts と同一のモデル・プロンプト・補正ロジックを使用（本番と同じ挙動を再現）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const CONFIG_PATH = process.argv[2]
if (!CONFIG_PATH) { console.error('usage: node scripts/calibrate-threshold.mjs <config.json>'); process.exit(1) }

// --- GROQ_API_KEY を .env.local から読む（値は出力しない） ---
const envUrl = new URL('../.env.local', import.meta.url)
const env = readFileSync(envUrl, 'utf8')
const km = env.match(/^GROQ_API_KEY\s*=\s*(.+)$/m)
if (!km) { console.error('GROQ_API_KEY not found in .env.local'); process.exit(1) }
const GROQ_API_KEY = km[1].trim().replace(/^["']|["']$/g, '')

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile' // gemini.ts と一致させること

const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
const { label, inScope, outScope, threshold = 87, questions = [], dangerKeywords } = cfg
const dangerRe = dangerKeywords ? new RegExp(dangerKeywords) : undefined

function buildScopedSystemPrompt(label, inScopeDesc, outScopeDesc) {
  return `あなたは${label}の専門家です。

まず、質問が「${label}」に関係するかを判定してください。${inScopeDesc}などを含む場合は関係あり（inScope=true）です。${outScopeDesc}は関係なし（inScope=false）です。

関係なしの場合は {"inScope": false, "score": 0, "answer": ""} のみを返してください。

関係ありの場合は質問に回答し、自信度スコア（0〜100）を付けてください。

スコア基準：
- 90〜100：確実に正しい、公式ドキュメントレベルの知識
- 70〜89：ほぼ正しいが、バージョンや環境依存の可能性あり
- 50〜69：一般的な回答だが、個別状況で異なる可能性あり
- 30〜49：推測が含まれる、要検証
- 0〜29：わからない、情報が古い可能性が高い

重要なルール：
- 確信が持てない場合は正直にスコアを下げてください
- 曖昧な推測はしないでください
- 回答は簡潔・明確に。日本語で答えてください
- tags には質問の技術キーワード・カテゴリを2〜3個（各1〜2語の短い名詞）。関係なしの場合は空配列[]

必ずJSON形式のみで返してください（説明文・前置き不要）：
{"inScope": true, "score": 85, "answer": "回答本文", "tags": ["React", "認証"]}`
}
function adjustScore(score, answer, question = '') {
  let a = score
  if (/かもしれません|と思われます|可能性があります/.test(answer)) a -= 20
  if (/最新の情報|私の知識.*まで|確認.*ください/.test(answer)) a = 0
  if (answer.length > 500) a -= 10
  if (dangerRe && dangerRe.test(question)) a -= 20
  return Math.max(0, a)
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function callGroq(sys, user, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(GROQ_API_URL, { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ], max_tokens: 1024 }) })
    if (res.ok) return ((await res.json()).choices?.[0]?.message?.content ?? '').trim()
    // 429(レート/無料枠超過) や 5xx はバックオフして再試行（本番キー共用なので優しく）
    if ((res.status === 429 || res.status >= 500) && i < tries - 1) { await sleep(10000 * (i + 1)); continue }
    throw new Error(`HTTP ${res.status} ${(await res.text().catch(()=>'')).slice(0,160)}`)
  }
}
function parse(raw) {
  const mm = raw.match(/\{[\s\S]*\}/); if (!mm) return { score: 0, answer: raw, inScope: true }
  try { const p = JSON.parse(mm[0]); return { inScope: p.inScope !== false, score: typeof p.score==='number'?Math.min(100,Math.max(0,p.score)):0, answer: typeof p.answer==='string'?p.answer.trim():raw } }
  catch { return { score: 0, answer: raw, inScope: true } }
}

const sys = buildScopedSystemPrompt(label, inScope, outScope)
const results = []
for (const q of questions) {
  const id = q.id ?? q.text.slice(0, 24)
  try {
    const raw = await callGroq(sys, q.text)
    const { score, answer, inScope: scopeOk } = parse(raw)
    const adj = adjustScore(score, answer, q.text)
    results.push({ id, text: q.text, score, adj, inScope: scopeOk, correct: q.correct ?? null, answer })
    console.log('\n============================================================')
    console.log(`【${id}】 score=${score} 補正後=${adj} inScope=${scopeOk} 判定(th=${threshold})=${adj>=threshold?'🤖AI':'👤人間'}` + (q.correct!=null?` 正誤=${q.correct?'○正':'×誤'}`:' 正誤=未判定'))
    console.log('------------------------------------------------------------')
    console.log(answer)
  } catch (e) {
    results.push({ id, text: q.text, error: String(e.message) })
    console.log(`\n【${id}】 ERROR: ${e.message}`)
  }
}

// --- 正誤ラベルがある場合、推奨thresholdを算出 ---
const labeled = results.filter(r => r.correct != null && r.adj != null)
console.log('\n\n================= SUMMARY =================')
if (labeled.length) {
  const wrong = labeled.filter(r => !r.correct).map(r => r.adj)
  const correct = labeled.filter(r => r.correct).map(r => r.adj)
  const maxWrong = wrong.length ? Math.max(...wrong) : -1
  const recommended = Math.min(100, maxWrong + 1) // 間違いのすぐ上
  const aiCount = results.filter(r => r.adj != null && r.adj >= recommended).length
  const coverage = Math.round((aiCount / results.length) * 100)
  const wrongAboveCurrent = labeled.filter(r => !r.correct && r.adj >= threshold)
  console.log(`ラベル済み: ${labeled.length}問（正:${correct.length} 誤:${wrong.length}）`)
  console.log(`間違い回答の最高スコア: ${maxWrong < 0 ? 'なし' : maxWrong}`)
  console.log(`▶ 推奨threshold = ${recommended}（間違いのすぐ上）`)
  console.log(`  そのときAI回答になる割合 = ${coverage}%（${aiCount}/${results.length}）`)
  if (correct.length && Math.max(...correct) < recommended) {
    console.log(`  ⚠ 正しい回答も推奨threshold未満ばかり＝スコアで正誤を分離できない → このジャンルは閾値を高く(ほぼ人間)にするのが安全`)
  }
  console.log(`\n現在のthreshold(${threshold})での安全性: AI回答に混じる「間違い」= ${wrongAboveCurrent.length}件` + (wrongAboveCurrent.length?` ⚠(${wrongAboveCurrent.map(r=>r.id).join(', ')})`:' ✅なし'))
} else {
  console.log('正誤ラベル未記入。各回答をレビューし、configの各質問に "correct": true/false を付けて再実行してください。')
}

// 結果を蓄積保存（学習用）
const outPath = CONFIG_PATH.replace(/\.json$/, '') + '.results.json'
let history = []
if (existsSync(outPath)) { try { history = JSON.parse(readFileSync(outPath, 'utf8')) } catch {} }
history.push({ label, threshold, ranAt: 'see-git', results })
writeFileSync(outPath, JSON.stringify(history, null, 2))
console.log(`\n結果を ${outPath} に保存（学習用に蓄積）`)
