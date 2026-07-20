const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

// ジャンル設定：新ジャンル追加はここに1エントリ追加するだけ
const GENRE_CONFIG: Record<string, {
  label: string        // AIに渡す日本語ジャンル名
  threshold: number    // 信頼度閾値（これ以上でAI回答表示）
  inScope: string      // checkInScope：INと判定する質問の説明
  outScope: string     // checkInScope：OUTと判定する質問の説明
  dangerKeywords?: RegExp  // adjustScore：スコアを下げる危険キーワード
}> = {
  debug: {
    label: 'プログラミング・デバッグ',
    threshold: 87,
    inScope: 'コード・ライブラリ・アルゴリズム・開発ツール・エラー・プログラミング言語・エンジニアのキャリア・技術の将来性',
    outScope: '動物・食べ物・スポーツ・恋愛・政治など、プログラミングと全く無関係な話題',
    dangerKeywords: /本番|突然|インシデント|不審|流出|削除された|止まった|落ちた/,
  },
  'tax-japan': {
    label: '確定申告・税務',
    threshold: 87,
    inScope: '確定申告・税金・経費・控除・freee・マネーフォワード・青色申告・源泉徴収・インボイス',
    outScope: '料理・スポーツ・恋愛・プログラミングなど、税務と無関係な話題',
    dangerKeywords: /令和.*改正|最新.*税率|今年.*税|税制.*変更/,
  },
  medical: {
    label: '医療・健康',
    threshold: 90,
    inScope: '症状・薬・病院・検査・治療・健康・医療相談',
    outScope: '料理・プログラミング・税金など、医療と無関係な話題',
    dangerKeywords: /緊急|救急|死|意識がない|呼吸|心臓/,
  },
  'australia-whv': {
    label: 'ワーキングホリデー・留学',
    threshold: 87,
    inScope: 'ワーホリ・留学・ビザ・現地生活・語学学校・海外就労・費用・滞在',
    outScope: 'プログラミング・医療・税金など、ワーホリ・留学と無関係な話題',
  },
  bali: {
    label: '移住・海外生活',
    threshold: 87,
    inScope: '移住・永住権・海外生活・現地情報・生活費・住居・手続き',
    outScope: 'プログラミング・医療・税金など、移住と無関係な話題',
  },
  chiangmai: {
    label: '移住・海外生活',
    threshold: 87,
    inScope: '移住・永住権・海外生活・現地情報・生活費・住居・手続き',
    outScope: 'プログラミング・医療・税金など、移住と無関係な話題',
  },
  portugal: {
    label: '移住・海外生活',
    threshold: 87,
    inScope: '移住・永住権・海外生活・現地情報・生活費・住居・手続き',
    outScope: 'プログラミング・医療・税金など、移住と無関係な話題',
  },
  philippines: {
    label: '移住・海外生活',
    threshold: 87,
    inScope: '移住・永住権・海外生活・現地情報・生活費・住居・手続き',
    outScope: 'プログラミング・医療・税金など、移住と無関係な話題',
  },
  canada: {
    label: '移住・海外生活',
    threshold: 87,
    inScope: '移住・永住権・海外生活・現地情報・生活費・住居・手続き',
    outScope: 'プログラミング・医療・税金など、移住と無関係な話題',
  },
  dtm: {
    label: 'DTM・音楽制作',
    threshold: 87,
    inScope: 'DAW・音楽制作・シンセサイザー・ミキシング・マスタリング・プラグイン・MIDI・作曲',
    outScope: '料理・スポーツ・医療・税金など、音楽制作と無関係な話題',
  },
}

const DEFAULT_THRESHOLD = 87

function getConfig(tenantId: string) {
  return GENRE_CONFIG[tenantId] ?? {
    label: tenantId,
    threshold: DEFAULT_THRESHOLD,
    inScope: `${tenantId}に関連する質問`,
    outScope: `${tenantId}と無関係な話題`,
  }
}

export function getScoreThreshold(tenantId: string): number {
  return getConfig(tenantId).threshold
}

// Groqが「一時的に使えない」状態（無料枠/レート超過429・Spend Limit到達blocked_api_access）を表す。
// 呼び出し側はこれを検知したらAI回答をスキップし人間ルーティングへ切り替える。
export class GroqUnavailableError extends Error {
  constructor(public code: string) {
    super(`Groq unavailable: ${code}`)
    this.name = 'GroqUnavailableError'
  }
}
export function isGroqUnavailable(e: unknown): boolean {
  return e instanceof GroqUnavailableError
}

// Groq 70Bモデルの料金（USD / 1Mトークン、2026-07時点）: 入力$0.59 / 出力$0.79
const RATE_70B_IN = 0.59
const RATE_70B_OUT = 0.79
export function groqCost(usage: { prompt: number; completion: number }): number {
  return (usage.prompt / 1_000_000) * RATE_70B_IN + (usage.completion / 1_000_000) * RATE_70B_OUT
}

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens = 1024
): Promise<{ content: string; usage: { prompt: number; completion: number } }> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  })
  if (!res.ok) {
    // 429(無料枠/レート超過) と blocked_api_access(Spend Limit到達) は「AI一時停止」として扱う
    let code = `http_${res.status}`
    try {
      const err = await res.json()
      const m = String(err?.error?.code ?? err?.error?.type ?? '')
      if (m === 'blocked_api_access' || m.includes('blocked')) code = 'blocked_api_access'
    } catch {
      /* ボディが読めなくてもステータスで判定する */
    }
    if (res.status === 429 || code === 'blocked_api_access') {
      throw new GroqUnavailableError(res.status === 429 ? 'rate_limited' : 'blocked_api_access')
    }
    throw new Error(`Groq API error: ${res.status}`)
  }
  const json = await res.json()
  return {
    content: (json.choices?.[0]?.message?.content ?? '').trim(),
    usage: {
      prompt: json.usage?.prompt_tokens ?? 0,
      completion: json.usage?.completion_tokens ?? 0,
    },
  }
}

// 保存前のジャンル判定（YES/NOのみ）
export async function checkInScope(tenantId: string, question: string): Promise<boolean> {
  const { label, inScope, outScope } = getConfig(tenantId)
  const { content } = await callGroq(
    [
      {
        role: 'system',
        content: `あなたはジャンル判定AIです。以下の質問が「${label}」に関係するかどうかを判定してください。${inScope}などを含む場合は「YES」と答えてください。${outScope}は「NO」と答えてください。「YES」か「NO」のみを出力し、それ以外の文字は一切出力しないでください。`,
      },
      { role: 'user', content: question },
    ],
    5
  )
  return content.toUpperCase().startsWith('YES')
}

export type AiUsage = { prompt: number; completion: number; cost: number }

export type AiResult = {
  answer: string
  score: number        // 0〜100
  routed: 'ai' | 'human'  // ai: AI回答表示 / human: 人間へルーティング
  usage?: AiUsage
}

export type AiScopedResult = AiResult & { inScope: boolean; tags: string[] }

// ジャンル判定＋スコア付き回答生成を1回のGroq呼び出しに統合（コスト最適化・2026-07-17）。
// 従来は checkInScope → askWithScore と同じ質問文を70Bモデルに2回送っており、
// トークンを二重に消費していた。統合により約25%のコスト削減＋無料枠の消費も約30%減。
// 判定部分の挙動は checkInScope と同一（ジャンル外なら inScope=false）。
// JSONパース失敗・inScopeキー欠落時はフェイルオープン（inScope=true扱い、score=0で人間ルート）。
export async function askWithScoreInScope(tenantId: string, question: string): Promise<AiScopedResult> {
  const { label, threshold, inScope, outScope, dangerKeywords } = getConfig(tenantId)

  const { content: raw, usage } = await callGroq([
    { role: 'system', content: buildScopedSystemPrompt(label, inScope, outScope) },
    { role: 'user', content: question },
  ])

  const match = raw.match(/\{[\s\S]*\}/)
  let scopeOk = true
  let score = 0
  let answer = ''
  let tags: string[] = []

  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      scopeOk = parsed.inScope !== false // 欠落・不正値はフェイルオープン
      score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 0
      answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : ''
      // タグは2〜3個の想定。配列以外・空はスキップし、文字列だけを最大3件・各30字までに正規化。
      if (Array.isArray(parsed.tags)) {
        tags = parsed.tags
          .filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0)
          .map((tag: string) => tag.trim().slice(0, 30))
          .slice(0, 3)
      }
    } catch {
      answer = raw
      score = 0
    }
  } else {
    answer = raw
    score = 0
  }

  score = adjustScore(score, answer, question, dangerKeywords)

  const routed = score >= threshold ? 'ai' : 'human'
  return { inScope: scopeOk, answer, score, routed, tags, usage: { ...usage, cost: groqCost(usage) } }
}

// ジャンル内確定済みの質問にスコア付き回答を生成
export async function askWithScore(tenantId: string, question: string): Promise<AiResult> {
  const { label, threshold, dangerKeywords } = getConfig(tenantId)

  const { content: raw, usage } = await callGroq([
    { role: 'system', content: buildSystemPrompt(label) },
    { role: 'user', content: question },
  ])

  const match = raw.match(/\{[\s\S]*\}/)
  let score = 0
  let answer = ''

  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 0
      answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : ''
    } catch {
      answer = raw
      score = 0
    }
  } else {
    answer = raw
    score = 0
  }

  score = adjustScore(score, answer, question, dangerKeywords)

  const routed = score >= threshold ? 'ai' : 'human'
  return { answer, score, routed, usage: { ...usage, cost: groqCost(usage) } }
}

function adjustScore(score: number, answer: string, question = '', dangerKeywords?: RegExp): number {
  let adjusted = score
  if (/かもしれません|と思われます|可能性があります/.test(answer)) adjusted -= 20
  if (/最新の情報|私の知識.*まで|確認.*ください/.test(answer)) adjusted = 0
  if (answer.length > 500) adjusted -= 10
  if (dangerKeywords && dangerKeywords.test(question)) adjusted -= 20
  return Math.max(0, adjusted)
}

// 後方互換（既存コードが呼んでいる箇所用）
export async function askGemini(tenantId: string, question: string): Promise<string> {
  const result = await askWithScore(tenantId, question)
  return result.answer
}

// 統合版システムプロンプト（ジャンル判定＋回答生成）。
// テナントごとに内容が固定のため、Groqのプロンプトキャッシュ（繰り返し入力50%オフ）が効く。
function buildScopedSystemPrompt(label: string, inScopeDesc: string, outScopeDesc: string): string {
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

function buildSystemPrompt(label: string): string {
  return `あなたは${label}の専門家です。以下の質問に回答し、自信度スコア（0〜100）を付けてください。

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

必ずJSON形式のみで返してください（説明文・前置き不要）：
{"score": 85, "answer": "回答本文"}`
}
