/**
 * モデル横断比較ツール（Groq vs Gemini各モデル）
 * ────────────────────────────────────────────
 * 目的: 「無料で何問回るか」と「ハルシネーションのなさ」をモデル間で比較する。
 *
 * ハルシネーション判定の考え方（重要）:
 *   正解データが無い質問が多いため、単独モデルの回答を私が「正しい」と決めつけない。
 *   代わりに同一質問を全モデルへ投げ、固有名詞・型番などの具体的事実が
 *   モデル間で食い違うかを突き合わせる。食い違い＝どれかが確実に嘘をついている証拠。
 *   最終的な正誤判定は、その領域の専門家（ユーザー）が行う前提。
 *
 * 使い方: node scripts/model-compare.mjs [質問ID...]
 *   例: node scripts/model-compare.mjs G02 M01 M14
 *   ID省略時は既定のファクト重視セットを使用。
 * 出力: scripts/model-compare.results.json（全モデルの回答全文）
 */
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const readKey = (n) => (env.match(new RegExp('^' + n + '\\s*=\\s*(.+)$', 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '')
const GROQ_KEY = readKey('GROQ_API_KEY')
const GEM_KEY = readKey('GEMINI_API_KEY')

// 無料枠で実際に200が返ったモデルのみ（Pro系は429＝無料枠なしのため除外）
const MODELS = [
  { name: 'Groq llama-3.3-70b',  provider: 'groq',   id: 'llama-3.3-70b-versatile' },
  { name: 'Gemini 3.6 Flash',    provider: 'gemini', id: 'gemini-3.6-flash' },
  { name: 'Gemini 3.5 Flash',    provider: 'gemini', id: 'gemini-3.5-flash' },
  { name: 'Gemini 3.5 Flash-Lite', provider: 'gemini', id: 'gemini-3.5-flash-lite' },
  { name: 'Gemini 3.1 Flash-Lite', provider: 'gemini', id: 'gemini-3.1-flash-lite' },
  { name: 'Gemini 3 Flash Prev', provider: 'gemini', id: 'gemini-3-flash-preview' },
]

// 既定のファクト重視セット（型番・固有名詞が出る＝ハルシネーションが検出しやすい質問）
const DEFAULT_IDS = ['G02', 'G03', 'G06', 'M01', 'M11', 'M14']

const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_IDS
const configs = ['scripts/calibration.music.json', 'scripts/calibration.guitar.json']
  .map(p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8')))

// 質問を集める（どちらのconfigに入っているかでlabel/scopeも引き継ぐ）
const targets = []
for (const cfg of configs) {
  for (const q of cfg.questions || []) {
    if (ids.includes(q.id)) targets.push({ ...q, cfg })
  }
}
console.log(`対象 ${targets.length}問 × ${MODELS.length}モデル = ${targets.length * MODELS.length}リクエスト\n`)

function sysPrompt(cfg) {
  return `あなたは${cfg.label}の専門家です。

まず、質問が「${cfg.label}」に関係するかを判定してください。${cfg.inScope}などを含む場合は関係あり（inScope=true）です。${cfg.outScope}は関係なし（inScope=false）です。

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

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function call(model, sys, user) {
  const url = model.provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  const key = model.provider === 'groq' ? GROQ_KEY : GEM_KEY
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
        // 新しいGeminiは内部thinkingがトークンを食うので余裕を持たせる
        max_tokens: 3000,
      }),
    })
    const ms = Date.now() - t0
    if (res.ok) {
      const j = await res.json()
      return { raw: (j.choices?.[0]?.message?.content ?? '').trim(), ms, usage: j.usage ?? null }
    }
    if ((res.status === 429 || res.status >= 500) && i < 2) { await sleep(8000 * (i + 1)); continue }
    return { error: `HTTP ${res.status}`, ms }
  }
}

function parse(raw) {
  if (!raw) return { score: 0, answer: '', empty: true }
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return { score: 0, answer: raw }
  try {
    const p = JSON.parse(m[0])
    return { score: typeof p.score === 'number' ? p.score : 0, answer: (p.answer || '').trim() }
  } catch { return { score: 0, answer: raw, jsonFail: true } }
}

const out = []
for (const q of targets) {
  const sys = sysPrompt(q.cfg)
  console.log('='.repeat(74))
  console.log(`【${q.id}】 ${q.text.slice(0, 90)}`)
  console.log('='.repeat(74))
  const row = { id: q.id, text: q.text, models: {} }
  for (const model of MODELS) {
    const r = await call(model, sys, q.text)
    if (r.error) {
      row.models[model.name] = { error: r.error }
      console.log(`\n▼ ${model.name}: ${r.error}`)
    } else {
      const p = parse(r.raw)
      row.models[model.name] = { score: p.score, answer: p.answer, ms: r.ms, empty: !!p.empty, jsonFail: !!p.jsonFail, usage: r.usage }
      console.log(`\n▼ ${model.name} (score=${p.score}, ${r.ms}ms)`)
      console.log(p.answer ? p.answer.slice(0, 500) : '[空応答]')
    }
    await sleep(1200) // レート制限に配慮
  }
  out.push(row)
  console.log()
}

writeFileSync(new URL('../scripts/model-compare.results.json', import.meta.url), JSON.stringify(out, null, 2))
console.log('\n結果を scripts/model-compare.results.json に保存')
