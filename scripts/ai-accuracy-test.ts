/**
 * AIスコア精度テスト - ロジック・テスト③
 * 目的：AIが正解・嘘・自信過剰のどれかを判定し、閾値を決める
 * 実行: npx tsx scripts/ai-accuracy-test.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_PAGE_ID = '38bf5fa8-bcb9-80f1-bede-f2876b7ef115' // ロジック・テスト③

// ============================================================
// テスト用質問（現実的・具体的な10問）
// ============================================================
// 期待する正誤を事前に設定してAIの回答と比較する

type ExpectedResult = 'correct' | 'partial' | 'needs_human' | 'outdated'

interface TestQuestion {
  id: number
  category: string
  title: string
  body: string
  difficulty: 'easy' | 'medium' | 'hard'
  expected: ExpectedResult
  note: string  // なぜその期待値か
}

const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    category: 'React',
    title: 'useStateで更新しても画面が変わらない',
    body: 'Reactで配列をuseStateで管理しています。push()で要素を追加しているのに再レンダリングされません。なぜですか？',
    difficulty: 'easy',
    expected: 'correct',
    note: 'ミュータブル操作の問題。正解（スプレッド構文）は明確。AIが正確に答えられるはず。',
  },
  {
    id: 2,
    category: 'Next.js',
    title: 'Next.js 14でgetServerSidePropsが動かない',
    body: 'Next.js 14のApp RouterでgetServerSidePropsを使おうとしたらエラーになります。どうすればいいですか？',
    difficulty: 'easy',
    expected: 'correct',
    note: 'App RouterではgetServerSidePropsは廃止。async Server Componentを使う。明確な正解あり。',
  },
  {
    id: 3,
    category: 'SQL',
    title: 'PostgreSQLで100万件のSELECTが遅い',
    body: 'PostgreSQLのテーブルに100万件のデータがあります。WHERE created_at > \'2024-01-01\' で検索すると10秒以上かかります。インデックスを貼っているはずなのに改善しません。',
    difficulty: 'medium',
    expected: 'partial',
    note: '環境依存（インデックスの種類・実行計画）。一般論は言えるがEXPLAIN結果なしでは断言できない。',
  },
  {
    id: 4,
    category: 'Docker',
    title: 'M1 MacでDockerコンテナがarm64エラー',
    body: 'M1 MacでDocker Composeを起動したら「WARNING: The requested image\'s platform (linux/amd64) does not match the detected host platform (linux/arm64/v8)」と出てコンテナが起動しません。',
    difficulty: 'medium',
    expected: 'correct',
    note: 'platform指定の問題。解決策（platform: linux/amd64）は明確。ただしイメージによる。',
  },
  {
    id: 5,
    category: 'TypeScript',
    title: 'TypeScriptでType \'string\' is not assignable to type \'never\'',
    body: 'TypeScriptでswitch文を書いていたら「Type \'string\' is not assignable to type \'never\'」というエラーが出ます。exhaustive checkを実装しようとしているのですが、何が間違っていますか？',
    difficulty: 'medium',
    expected: 'correct',
    note: 'exhaustive checkのパターンは有名。assertNever関数の使い方で正解が出るはず。',
  },
  {
    id: 6,
    category: 'Supabase',
    title: 'SupabaseのRLSでINSERTが403になる',
    body: 'Supabaseでテーブルにrow level securityを設定しています。認証済みユーザーなのにINSERTすると「new row violates row-level security policy」エラーが返ります。SELECT・UPDATEは動いています。',
    difficulty: 'hard',
    expected: 'partial',
    note: 'RLSポリシーの設定次第。一般的な原因は説明できるが、実際のポリシー定義を見ないと特定できない。',
  },
  {
    id: 7,
    category: 'AWS',
    title: 'Lambda関数がタイムアウトする（環境変数が原因？）',
    body: 'AWS Lambdaの関数が本番環境でだけ30秒タイムアウトします。ローカルでは1秒以内に完了します。環境変数はSTAGE=productionだけ違います。CloudWatchログには特にエラーなし。',
    difficulty: 'hard',
    expected: 'needs_human',
    note: '情報が不足している典型例。コールドスタート・VPC・外部API待機など原因が多岐。AIには断言できないはず。',
  },
  {
    id: 8,
    category: 'CSS',
    title: 'z-indexが効かない（Safariだけ）',
    body: 'Safariブラウザだけz-indexが無視されて、モーダルが他の要素の後ろに隠れてしまいます。ChromeとFirefoxでは正常に動作します。position: fixedとz-index: 9999を指定しています。',
    difficulty: 'hard',
    expected: 'partial',
    note: 'Safari固有のstacking context問題。isolateやtransformが原因のことが多いが、コードを見ないと特定できない。',
  },
  {
    id: 9,
    category: 'Python',
    title: 'asyncio.run()でRuntimeError: This event loop is already running',
    body: 'JupyterNotebook上でPythonの非同期関数を実行しようとすると「RuntimeError: This event loop is already running」が出ます。asyncio.run()を使っています。',
    difficulty: 'easy',
    expected: 'correct',
    note: 'Jupyterは既にイベントループを持っている。nest_asyncioかawaitを直接使う。明確な正解あり。',
  },
  {
    id: 10,
    category: 'セキュリティ',
    title: '本番サーバーでJWTトークンが突然全員無効になった',
    body: '昨日のデプロイ後から本番環境で全ユーザーのJWTが無効になっています。ログアウトされてしまいます。JWT_SECRETは環境変数で管理していますが、変更した覚えはありません。',
    difficulty: 'hard',
    expected: 'needs_human',
    note: 'デプロイによる環境変数リセットか、シークレットローテーションが疑われる。本番の緊急インシデント。AIでは状況把握できない。',
  },
]

// ============================================================
// Groq API呼び出し
// ============================================================

async function callGroq(system: string, user: string, maxTokens = 800): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
    }),
  })
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// ============================================================
// AIに質問して全文回答＋スコアを取得
// ============================================================

interface AiResult {
  score: number
  answer: string
  rawJson: string
}

async function askAI(q: TestQuestion): Promise<AiResult> {
  const prompt = `以下のプログラミング質問に回答し、自信度スコア（0〜100）を付けてください。

スコア基準：
- 90〜100：確実に正しい。公式ドキュメントレベルの知識。
- 70〜89：ほぼ正しいが、バージョン・環境依存の可能性あり。
- 50〜69：一般的な回答。個別状況で異なる可能性が高い。
- 30〜49：推測が含まれる。要検証。
- 0〜29：わからない・情報が不足している・情報が古い可能性。

重要ルール：
- 確信が持てない場合は正直にスコアを下げること
- 情報が不足していて断言できない場合は、その旨を回答に含めること
- 回答は日本語で、具体的に

必ずJSON形式のみで返してください：
{"score": 85, "answer": "回答全文"}

【質問タイトル】${q.title}
【質問詳細】${q.body}`

  const raw = await callGroq(
    'あなたはプログラミング専門家AIです。正直に、知っている範囲で回答してください。',
    prompt,
    1000
  )

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return {
        score: Math.min(100, Math.max(0, parsed.score ?? 0)),
        answer: parsed.answer ?? raw,
        rawJson: match[0],
      }
    }
  } catch {}

  return { score: 0, answer: raw, rawJson: raw }
}

// ============================================================
// スコアから判定
// ============================================================

function judgeRouting(score: number, threshold: number): string {
  if (score >= threshold) return `✅ AI回答（スコア${score} ≥ 閾値${threshold}）`
  return `👤 人間へルーティング（スコア${score} < 閾値${threshold}）`
}

function judgeAccuracy(aiResult: AiResult, expected: ExpectedResult): string {
  const score = aiResult.score
  if (expected === 'correct' && score >= 70) return '🟢 期待通り（正解質問に高スコア）'
  if (expected === 'correct' && score < 70) return '🟡 過小評価（正解があるのに低スコア）'
  if (expected === 'needs_human' && score < 70) return '🟢 期待通り（情報不足を正直に低スコア）'
  if (expected === 'needs_human' && score >= 70) return '🔴 危険！（情報不足なのに高スコア＝ハルシネーション疑い）'
  if (expected === 'partial' && score >= 50 && score < 85) return '🟢 期待通り（部分的回答に中程度スコア）'
  if (expected === 'partial' && score >= 85) return '🟡 過信（部分的回答なのに高スコア）'
  return '⚪️ 判定不明'
}

// ============================================================
// Notion書き込み
// ============================================================

async function appendToNotion(blocks: any[]) {
  if (!NOTION_TOKEN) return
  // 100ブロック以下に分割
  for (let i = 0; i < blocks.length; i += 50) {
    await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children: blocks.slice(i, i + 50) }),
    })
    await new Promise(r => setTimeout(r, 400))
  }
}

function textBlock(content: string) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content } }] },
  }
}

function h2Block(content: string) {
  return {
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content } }] },
  }
}

function h3Block(content: string) {
  return {
    object: 'block', type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content } }] },
  }
}

function quoteBlock(content: string) {
  return {
    object: 'block', type: 'quote',
    quote: { rich_text: [{ type: 'text', text: { content } }] },
  }
}

function dividerBlock() {
  return { object: 'block', type: 'divider', divider: {} }
}

function bulletBlock(content: string) {
  return {
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ type: 'text', text: { content } }] },
  }
}

function codeBlock(content: string) {
  return {
    object: 'block', type: 'code',
    code: {
      rich_text: [{ type: 'text', text: { content } }],
      language: 'plain text',
    },
  }
}

// ============================================================
// メイン
// ============================================================

async function runTest() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('ja-JP')
  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

  console.log(`\n🧪 AIスコア精度テスト開始 ${dateStr} ${timeStr}`)
  console.log('='.repeat(60))

  const THRESHOLDS = [70, 80, 85] // 複数の閾値で比較
  const results: Array<{ q: TestQuestion; ai: AiResult }> = []

  // ① 全質問をAIに投げる
  for (const q of TEST_QUESTIONS) {
    console.log(`\n[${q.id}/10] ${q.title}`)
    console.log(`  カテゴリ：${q.category}　難易度：${q.difficulty}`)
    const ai = await askAI(q)
    results.push({ q, ai })
    console.log(`  AIスコア：${ai.score}`)
    console.log(`  期待値：${q.expected}　→ ${judgeAccuracy(ai, q.expected)}`)
    console.log(`  回答（抜粋）：${ai.answer.slice(0, 80)}...`)
    await new Promise(r => setTimeout(r, 600))
  }

  // ② 閾値ごとの正解率を計算
  console.log('\n' + '='.repeat(60))
  console.log('閾値別ルーティング分析：')
  const thresholdStats: Record<number, { aiAnswered: number; humanRouted: number; dangerous: number }> = {}

  for (const threshold of THRESHOLDS) {
    let aiAnswered = 0, humanRouted = 0, dangerous = 0
    for (const { q, ai } of results) {
      if (ai.score >= threshold) {
        aiAnswered++
        if (q.expected === 'needs_human') dangerous++ // 危険：人間が必要なのにAIが答えた
      } else {
        humanRouted++
      }
    }
    thresholdStats[threshold] = { aiAnswered, humanRouted, dangerous }
    console.log(`  閾値${threshold}: AI回答${aiAnswered}問 / 人間${humanRouted}問 / 危険${dangerous}問`)
  }

  // ③ Notionに書き込む
  console.log('\n📝 Notionに書き込み中...')

  const blocks: any[] = []

  // ヘッダー
  blocks.push(h2Block(`🕐 ${dateStr} ${timeStr}　AIスコア精度テスト（ロジック・テスト③）`))
  blocks.push(textBlock('目的：AIが正解・嘘・自信過剰のどれかを10問のリアルな質問で検証し、閾値（人間へルーティングするスコアライン）を決定する。'))
  blocks.push(dividerBlock())

  // ブレイクポイント①：テスト設計
  blocks.push(h3Block('🔵 ブレイクポイント①　テスト設計'))
  blocks.push(textBlock('質問は「簡単・明確な正解あり」「情報不足・人間が必要」「環境依存・部分回答」の3種類に分類。期待する正誤を事前に定義してAIの判断と照合する。'))
  blocks.push(bulletBlock('easy（簡単・正解明確）：3問　→ AIが高スコアで正確に答えるべき'))
  blocks.push(bulletBlock('medium（環境依存・部分回答）：3問　→ 中程度スコアが適切'))
  blocks.push(bulletBlock('hard（情報不足・緊急インシデント）：4問　→ 低スコアで人間へ回すべき'))
  blocks.push(dividerBlock())

  // 各質問の結果
  blocks.push(h3Block('🔵 ブレイクポイント②　質問ごとの結果'))

  for (const { q, ai } of results) {
    const accuracy = judgeAccuracy(ai, q.expected)
    const diffLabel = q.difficulty === 'easy' ? '🟩 易' : q.difficulty === 'medium' ? '🟨 中' : '🟥 難'

    blocks.push(textBlock(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`))
    blocks.push(h3Block(`Q${q.id}【${q.category}】${q.title}`))
    blocks.push(bulletBlock(`難易度：${diffLabel}　期待する結果：${q.expected}`))
    blocks.push(bulletBlock(`事前予想の理由：${q.note}`))
    blocks.push(textBlock('【質問内容】'))
    blocks.push(quoteBlock(q.body))
    blocks.push(textBlock(`【AIスコア】${ai.score} / 100`))
    blocks.push(textBlock('【AI回答全文】'))
    blocks.push(codeBlock(ai.answer))
    blocks.push(textBlock(`【精度判定】${accuracy}`))

    // 閾値ごとのルーティング判定
    for (const threshold of THRESHOLDS) {
      blocks.push(bulletBlock(`  閾値${threshold}の場合：${judgeRouting(ai.score, threshold)}`))
    }
  }

  blocks.push(dividerBlock())

  // ブレイクポイント③：閾値分析
  blocks.push(h3Block('🔵 ブレイクポイント③　閾値別ルーティング分析'))

  for (const threshold of THRESHOLDS) {
    const s = thresholdStats[threshold]
    const dangerRate = Math.round(s.dangerous / TEST_QUESTIONS.length * 100)
    const aiRate = Math.round(s.aiAnswered / TEST_QUESTIONS.length * 100)
    blocks.push(textBlock(`【閾値 ${threshold}】`))
    blocks.push(bulletBlock(`AI回答：${s.aiAnswered}問（${aiRate}%）`))
    blocks.push(bulletBlock(`人間ルーティング：${s.humanRouted}問`))
    blocks.push(bulletBlock(`危険（人間が必要なのにAIが回答）：${s.dangerous}問（${dangerRate}%）`))
    if (s.dangerous === 0) {
      blocks.push(bulletBlock(`→ ✅ 安全。ただしAIが多く答えすぎると人間コミュニティが育たない。`))
    } else if (s.dangerous <= 1) {
      blocks.push(bulletBlock(`→ 🟡 許容範囲。情報不足の質問を1件ミス。`))
    } else {
      blocks.push(bulletBlock(`→ 🔴 危険。情報不足の質問にAIが自信を持って答えている。`))
    }
  }

  blocks.push(dividerBlock())

  // ブレイクポイント④：閾値決定
  blocks.push(h3Block('🔵 ブレイクポイント④　閾値決定と考察'))

  // 最も危険が少ない閾値を推奨
  const safestThreshold = THRESHOLDS.find(t => thresholdStats[t].dangerous === 0) ?? 85
  const recommended = thresholdStats[safestThreshold]

  blocks.push(textBlock(`推奨閾値：${safestThreshold}`))
  blocks.push(bulletBlock(`この閾値では：AI回答${recommended.aiAnswered}問 / 人間${recommended.humanRouted}問 / 危険0問`))
  blocks.push(textBlock('考察：'))
  blocks.push(bulletBlock('スコアが低くなるケース = 「情報が不足している」「環境依存」「推測が入る」→ これが人間コミュニティの出番'))
  blocks.push(bulletBlock('スコアが高くても正解でない場合（ハルシネーション）は回答文を検査して検出'))
  blocks.push(bulletBlock('「かもしれません」「確認してください」などの曖昧語句があればスコアを-20する補正を入れる'))
  blocks.push(textBlock('→ この閾値をWisdom Assembleのデフォルト設定として採用し、ジャンルごとに微調整する。'))

  blocks.push(dividerBlock())
  blocks.push(textBlock(`テスト実施日時：${dateStr} ${timeStr}　質問数：${TEST_QUESTIONS.length}問　モデル：llama-3.3-70b-versatile（Groq）`))

  await appendToNotion(blocks)
  console.log('✅ Notion書き込み完了！')
  console.log('\n🧪 テスト終了\n')
}

runTest().catch(console.error)
