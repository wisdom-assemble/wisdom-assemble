/**
 * RPGシミュレーション v3 - スキルマッチング＋時間制限テスト
 * 実行: npx tsx scripts/rpg-simulation.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_PAGE_ID = '38bf5fa8-bcb9-80cb-a315-c0dc194c6fdc'

// ============================================================
// キャラクター定義
// ============================================================

type TimeLimit = 1 | 6 | 24 // 時間

interface Persona {
  id: string
  name: string
  class: string
  personality: string
  strengths: string[]
  weaknesses: string[]
  preferredTimeLimit: TimeLimit  // 質問時に設定する時間制限
  reputation: number
  solvedCount: number
  passCount: number
  timeoutCount: number
  notifyCount: number   // 通知された回数
  active: boolean
}

const PERSONAS: Persona[] = [
  {
    id: 'takeshi', name: 'Takeshi', class: '古参魔法使い',
    personality: '「昔はな…」が口癖。C言語とLinuxなら何でも知っているが最新JSを毛嫌い。',
    strengths: ['C言語', 'Linux', '低レイヤー', 'システムプログラミング', 'Unix'],
    weaknesses: ['React', 'Vue', 'TypeScript', '最新JavaScript', 'モバイル'],
    preferredTimeLimit: 24, // 古参なのでゆっくり
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'yuki', name: 'Yuki', class: 'フロント妖精',
    personality: 'テンション高め✨絵文字多用。Reactが大好き。DBやサーバーの話になると急に静かになる。',
    strengths: ['React', 'CSS', 'デザイン', 'TypeScript', 'フロントエンド', 'UI'],
    weaknesses: ['データベース', 'SQL', 'インフラ', 'バックエンド', 'セキュリティ'],
    preferredTimeLimit: 6,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'ryo', name: 'Ryo', class: 'DB番人',
    personality: '無口で答えは短い。でも正確。SQLとPostgreSQLなら神レベル。',
    strengths: ['SQL', 'PostgreSQL', 'データベース設計', 'クエリ最適化', 'インデックス'],
    weaknesses: ['React', 'CSS', 'フロントエンド', 'モバイル', 'デザイン'],
    preferredTimeLimit: 24,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'mia', name: 'Mia', class: 'クラウド騎士',
    personality: '英語が混じる。コスト意識強め。「それ、AWS Lambdaで解決できるよ」が口癖。',
    strengths: ['AWS', 'Docker', 'インフラ', 'DevOps', 'CI/CD', 'クラウド'],
    weaknesses: ['細かいコーディング', 'アルゴリズム', 'CSS', 'デザイン'],
    preferredTimeLimit: 6,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'shin', name: 'Shin', class: '見習い修行者',
    personality: '自信がなく「たぶん…」「違ったらすみません」が多い。基礎は分かるが応用で不安になる。',
    strengths: ['Python基礎', '基本文法', '初歩的なアルゴリズム'],
    weaknesses: ['応用全般', 'フレームワーク', 'インフラ', 'DB設計', '最新技術'],
    preferredTimeLimit: 24,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'hana', name: 'Hana', class: 'セキュリティ巫女',
    personality: '慎重でリスク視点が強い。「それ、セキュリティ的に危ないですよ」と必ず一言添える。',
    strengths: ['認証', 'セキュリティ', '暗号化', 'JWT', 'OAuth', 'XSS対策'],
    weaknesses: ['UI', 'CSS', 'フロントエンド', 'デザイン', 'モバイル'],
    preferredTimeLimit: 6,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'ken', name: 'Ken', class: 'モバイル侍',
    personality: 'プライドが高い。Web民をちょっと見下している。「iOSネイティブでやれば一発だよ」が口癖。',
    strengths: ['Swift', 'iOS', 'React Native', 'モバイル開発', 'Xcode'],
    weaknesses: ['Webバックエンド', 'データベース', 'インフラ', 'CSS'],
    preferredTimeLimit: 6,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'aoi', name: 'Aoi', class: 'AI錬金術師',
    personality: '話が長い理論派。「それ、ニューラルネットで解けますよ」と言いがち。',
    strengths: ['Python', '機械学習', 'LLM', 'AI', 'データサイエンス', 'NumPy'],
    weaknesses: ['インフラ', '運用', 'フロントエンド', 'モバイル'],
    preferredTimeLimit: 24,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'taro', name: 'Taro', class: '何でも屋（浅い）',
    personality: '明るくて何でもやろうとするが浅い。回答速度は一番早い。急いで答えて間違えがち。',
    strengths: ['広く浅く全般'],
    weaknesses: ['深い専門知識全般'],
    preferredTimeLimit: 1, // 急いで答えたいタイプ
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'noa', name: 'Noa', class: 'タイムトラベラー',
    personality: '「それjQueryで出来るよ」が口癖。古い技術は神レベルだが最新フレームワークは全滅。',
    strengths: ['PHP', 'jQuery', 'WordPress', '古いJavaScript', 'Apache'],
    weaknesses: ['React', 'Next.js', 'TypeScript', 'モダンJS', 'Docker'],
    preferredTimeLimit: 24,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: true,
  },
  {
    id: 'john', name: 'John', class: '野心家ハッカー',
    personality: '承認欲求MAX。全分野に自信満々。ヒーローになるためにこのサービスに来た。',
    strengths: ['フロントエンド', 'バックエンド', 'インフラ', 'AI', 'セキュリティ', '全般'],
    weaknesses: ['謙虚さ'],
    preferredTimeLimit: 1, // 急いで目立ちたい
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: false,
  },
  {
    id: 'anthony', name: 'Anthony', class: 'ソーシャルエンジニア',
    personality: 'コミュ力お化け。技術は中程度だが話し方が上手く人に好かれる。ベストアンサーを集めたい。',
    strengths: ['コミュニケーション', 'フロントエンド基礎', 'Python基礎', '説明力'],
    weaknesses: ['低レイヤー', 'DB設計', 'セキュリティ詳細', '難しいアルゴリズム'],
    preferredTimeLimit: 6,
    reputation: 0, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0, active: false,
  },
]

// ============================================================
// Groq API
// ============================================================

async function callGroq(systemPrompt: string, userMessage: string, maxTokens = 300): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
    }),
  })
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// ============================================================
// AI判定（本番と同じロジック）
// ============================================================

const AI_THRESHOLD = 88 // シミュレーション用：人間マッチングが発生するよう高めに設定

async function aiJudge(title: string, body: string): Promise<{ score: number; answer: string }> {
  const raw = await callGroq(
    'あなたはプログラミング専門家AIです。',
    `以下の質問に回答し、自信度スコア（0〜100）を付けてください。
スコア基準：90-100=確実、70-89=ほぼ正確、50-69=一般的、30-49=推測、0-29=不明
必ずJSON形式のみで返してください：{"score": 85, "answer": "回答本文"}
質問：${title}
詳細：${body}`,
    400
  )
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const p = JSON.parse(match[0])
      return { score: Math.min(100, Math.max(0, p.score ?? 0)), answer: p.answer ?? raw }
    }
  } catch {}
  return { score: 0, answer: raw }
}

// ============================================================
// ペルソナが質問を生成
// ============================================================

async function personaAskQuestion(persona: Persona): Promise<{ title: string; body: string; category: string }> {
  const raw = await callGroq(
    'あなたはRPGシミュレーターです。',
    `あなたは「${persona.name}」（${persona.class}）です。
性格：${persona.personality}
得意：${persona.strengths.join('、')}
苦手：${persona.weaknesses.join('、')}

苦手分野について実際に困っているプログラミング質問を1つ作ってください。
タイトルは30文字以内、詳細は50文字以上、キャラクターらしい口調で。
JSON形式：{"title": "タイトル", "body": "詳細", "category": "カテゴリ名（例：React、SQL、インフラ等）"}`
  )
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return { title: `${persona.name}の質問`, body: '困っています。教えてください。', category: '不明' }
}

// ============================================================
// スキルベースマッチングスコア計算
// ============================================================

function calcMatchScore(persona: Persona, category: string): number {
  const cat = category.toLowerCase()
  const skillMatches = persona.strengths.filter(s =>
    cat.includes(s.toLowerCase()) || s.toLowerCase().includes(cat)
  ).length
  return skillMatches * 20 + persona.reputation * 0.1
}

function selectNextResponder(
  personas: Persona[],
  alreadyTried: string[],
  category: string,
  useSkillBased: boolean
): Persona | null {
  const available = personas.filter(p => p.active && !alreadyTried.includes(p.id))
  if (available.length === 0) return null

  if (useSkillBased) {
    // スキル × 実績でスコアリング
    const scored = available.map(p => ({ p, score: calcMatchScore(p, category) }))
    scored.sort((a, b) => b.score - a.score)
    return scored[0].p
  } else {
    return available[Math.floor(Math.random() * available.length)]
  }
}

// ============================================================
// 時間制限シミュレーション
// ============================================================

// 時間制限が短いほどタイムアウト率が上がる
function didTimeout(timeLimit: TimeLimit): boolean {
  const rate = timeLimit === 1 ? 0.55 : timeLimit === 6 ? 0.20 : 0.05
  return Math.random() < rate
}

function timeLimitLabel(h: TimeLimit): string {
  return h === 1 ? '1時間（緊急）' : h === 6 ? '6時間（標準）' : '24時間（ゆっくり）'
}

// ============================================================
// ペルソナが回答するか判断
// ============================================================

interface PersonaResponse {
  action: 'answer' | 'pass'
  content: string
  confidence: number
}

async function personaRespond(persona: Persona, question: string, category: string): Promise<PersonaResponse> {
  const raw = await callGroq(
    'あなたはRPGシミュレーターです。',
    `あなたは「${persona.name}」（${persona.class}）です。
性格：${persona.personality}
得意：${persona.strengths.join('、')}
苦手：${persona.weaknesses.join('、')}

質問カテゴリ：${category}
質問：${question}

得意分野なら自信を持って回答、苦手ならギブアップしてください。
必ずJSON形式：{"action": "answer" または "pass", "content": "回答またはギブアップの理由（キャラクターの口調で）", "confidence": 0〜100}`
  )
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const p = JSON.parse(match[0])
      return {
        action: p.action === 'answer' ? 'answer' : 'pass',
        content: p.content ?? '',
        confidence: p.confidence ?? 0,
      }
    }
  } catch {}
  return { action: 'pass', content: '（応答エラー）', confidence: 0 }
}

// ============================================================
// Notion書き込み
// ============================================================

async function logToNotion(content: string) {
  await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      children: [{
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content } }] },
      }],
    }),
  })
}

async function postToNotion(markdown: string) {
  if (!NOTION_TOKEN) return
  let remaining = markdown
  while (remaining.length > 0) {
    await logToNotion(remaining.slice(0, 1900))
    remaining = remaining.slice(1900)
    await new Promise(r => setTimeout(r, 300))
  }
}

// ============================================================
// メインシミュレーション
// ============================================================

async function runSimulation() {
  console.log('\n🎲 Wisdom Assemble RPGシミュレーション v3（スキルマッチング＋時間制限）\n')
  console.log('='.repeat(60))

  const personas = [...PERSONAS]
  const replay: string[] = []
  const MATCH_DELAY_MS = 400

  let useSkillBased = false
  let totalResolved = 0
  let totalAiResolved = 0
  let totalHumanResolved = 0
  let totalUrgent = 0
  let totalTimeouts = 0
  let johnJoined = false
  let anthonyJoined = false

  // 通知分析用
  const notifyStats: Record<string, number[]> = {} // persona.id → [何回呼ばれた per quest]

  const dateStr = new Date().toLocaleDateString('ja-JP')

  replay.push(`# 📖 Wisdom Assembleクエスト記録 第2巻`)
  replay.push(`**リプレイ日：${dateStr}　テーマ：スキルマッチング＋時間制限**\n`)
  replay.push(`---`)
  replay.push(`## 🌐 プロローグ\n`)
  replay.push(`今回のテストでは2つの新機能を検証する。`)
  replay.push(`\n①**スキルマッチング**：質問のカテゴリと冒険者の得意分野を照合して最適な人を呼ぶ。`)
  replay.push(`②**時間制限**：質問者が1h・6h・24hを選択。BもCも同じ制限が適用される。\n`)
  replay.push(`さあ、クエストの幕が上がる——\n`)
  replay.push(`---`)

  const questionerOrder = [
    'takeshi', 'yuki', 'ryo', 'mia', 'shin',
    'hana', 'ken', 'aoi', 'taro', 'noa',
  ]

  for (let qi = 0; qi < questionerOrder.length + 2; qi++) {

    // John乱入（5問目）
    if (qi === 4 && !johnJoined) {
      personas.find(p => p.id === 'john')!.active = true
      johnJoined = true
      questionerOrder.splice(6, 0, 'john')
      console.log('\n🔥 [EVENT] John乱入！')
      replay.push(`\n---`)
      replay.push(`## ⚡ 特別イベント：John参戦！`)
      replay.push(`\nギルドの扉が勢いよく開いた。`)
      replay.push(`**John**：「よう。俺が来れば全部解決する——ヒーローが来たぞ。」`)
      replay.push(`**Takeshi**：「……何者だ。」\n`)
      replay.push(`---`)
    }

    // Anthony乱入（8問目）
    if (qi === 7 && !anthonyJoined) {
      personas.find(p => p.id === 'anthony')!.active = true
      anthonyJoined = true
      questionerOrder.push('anthony')
      console.log('\n⚡ [EVENT] Anthony乱入！')
      replay.push(`\n---`)
      replay.push(`## 🌟 特別イベント：Anthony参戦！`)
      replay.push(`\n**Anthony**：「みなさん、はじめまして😊 ベストアンサー、もらえたら嬉しいです！」`)
      replay.push(`**John**：「……ライバルが増えたか。」\n`)
      replay.push(`---`)
    }

    if (qi >= questionerOrder.length) break
    const questionerId = questionerOrder[qi]
    const questioner = personas.find(p => p.id === questionerId)
    if (!questioner || !questioner.active) continue

    // マッチング方式切替チェック
    const totalSolved = personas.reduce((s, p) => s + p.solvedCount, 0)
    if (totalSolved >= 3 && !useSkillBased) {
      useSkillBased = true
      console.log('\n📊 [SYSTEM] スキルベースマッチングに切替！')
      replay.push(`\n> 📊 **【システム】** 実績蓄積完了。マッチングを「ランダム」→「スキル＋実績ベース」に切替。\n`)
    }

    // 質問生成
    console.log(`\n📝 ${questioner.name}（${questioner.class}）が質問を投稿中...`)
    const q = await personaAskQuestion(questioner)
    const timeLimit = questioner.preferredTimeLimit

    console.log(`📨 クエスト ${qi + 1}：「${q.title}」（${questioner.name}、${timeLimitLabel(timeLimit)}）`)

    replay.push(`\n## ⚔️ クエスト${qi + 1}：${q.title}`)
    replay.push(`*投稿者：${questioner.name}（${questioner.class}）　カテゴリ：${q.category}　⏱ 制限：${timeLimitLabel(timeLimit)}*\n`)
    replay.push(`**${questioner.name}**：「${q.body}」\n`)
    replay.push(`この問いがギルドボードに貼り出された。`)

    // ① AI判定
    console.log(`  🤖 AIが回答を試みる...`)
    const aiResult = await aiJudge(q.title, q.body)
    replay.push(`\n*【AIジャッジ】スコア：${aiResult.score} / 閾値：${AI_THRESHOLD}*`)

    if (aiResult.score >= AI_THRESHOLD) {
      totalResolved++
      totalAiResolved++
      console.log(`  ✅ AI回答！スコア:${aiResult.score}`)
      replay.push(`\n🤖 **AI**：「${aiResult.answer.slice(0, 150)}…」`)
      replay.push(`\n✅ **AIが解決！** スコア${aiResult.score}。質問者が確認しアーカイブへ。\n`)
      continue
    }

    console.log(`  ⚠️  AIスコア${aiResult.score} → 人間へルーティング`)
    replay.push(`\n⚠️ **AIに自信なし（スコア${aiResult.score}）。${timeLimitLabel(timeLimit)}で人間専門家にルーティング——**\n`)

    // ② 人間マッチング（B → C → 高難易度クエスト）
    const triedPersonas: string[] = [questioner.id]
    let resolved = false
    let matchRound = 1 // B=1, C=2

    while (!resolved && matchRound <= 2) {
      const responder = selectNextResponder(personas, triedPersonas, q.category, useSkillBased)
      if (!responder) break

      triedPersonas.push(responder.id)
      responder.notifyCount++
      if (!notifyStats[responder.id]) notifyStats[responder.id] = []
      notifyStats[responder.id].push(qi + 1)

      const roundLabel = matchRound === 1 ? 'B（第一候補）' : 'C（第二候補）'
      const matchScore = useSkillBased ? Math.round(calcMatchScore(responder, q.category)) : null
      const matchInfo = matchScore !== null
        ? `スキルマッチスコア：${matchScore}pt`
        : 'ランダムマッチング'

      replay.push(`\n📩 **【マッチング ${roundLabel}】** ${responder.name}（${responder.class}）`)
      replay.push(`*${matchInfo}　制限時間：${timeLimit}時間*`)
      console.log(`  → [${roundLabel}] ${responder.name} にマッチング（${matchInfo}）...`)

      await new Promise(r => setTimeout(r, MATCH_DELAY_MS))

      // タイムアウトチェック
      if (didTimeout(timeLimit)) {
        responder.timeoutCount++
        totalTimeouts++
        console.log(`  ⏰ ${responder.name} タイムアウト！`)
        replay.push(`\n⏰ **タイムアウト！** ${responder.name}は${timeLimit}時間以内に回答できなかった。`)
        if (timeLimit === 1) {
          replay.push(`*（1時間は厳しすぎたか——次の候補へ）*\n`)
        } else {
          replay.push(`*（次の候補へ）*\n`)
        }
        matchRound++
        continue
      }

      // 回答チャレンジ
      const response = await personaRespond(responder, q.title, q.category)

      if (response.action === 'answer') {
        responder.reputation += response.confidence
        responder.solvedCount++
        resolved = true
        totalResolved++
        totalHumanResolved++

        console.log(`  ✅ ${responder.name} 回答！信頼度:${response.confidence}`)
        replay.push(`\n**${responder.name}**：「${response.content}」`)
        replay.push(`\n*信頼度スコア：${response.confidence} / 100*`)

        if (responder.solvedCount === 1) {
          replay.push(`\n🏅 **【称号獲得】${responder.name} が「見習い」を獲得！**`)
        } else if (responder.solvedCount === 3) {
          replay.push(`\n🥈 **【称号獲得】${responder.name} が「知恵袋」を獲得！**`)
        } else if (responder.solvedCount === 5) {
          replay.push(`\n🥇 **【称号獲得】${responder.name} が「賢者」を獲得！**`)
        }

        replay.push(`\n✅ **クエスト解決！** 質問者${questioner.name}が確認。アーカイブへ。\n`)

      } else {
        responder.passCount++
        console.log(`  ❌ ${responder.name} がギブアップ`)
        replay.push(`\n**${responder.name}**：「${response.content}」`)
        replay.push(`*（ギブアップ——次の候補へ）*\n`)
        matchRound++
      }
    }

    // ③ 高難易度クエスト（B・C両方ダメだった場合）
    if (!resolved) {
      totalUrgent++
      console.log(`  🚨 高難易度クエスト昇格！`)
      replay.push(`\n🚨 **【高難易度クエスト昇格】** AIも、BもCも解決できなかった。`)
      replay.push(`この問いは未解決掲示板に掲載され、全メンバーへの挑戦状となった。`)
      replay.push(`*（時間制限なし。誰でも回答可能）*\n`)
    }
  }

  // ============================================================
  // エピローグ＆分析
  // ============================================================

  const ranking = personas
    .filter(p => p.active)
    .sort((a, b) => b.solvedCount - a.solvedCount || b.reputation - a.reputation)

  const topUser = ranking[0]
  const johnData = personas.find(p => p.id === 'john')!
  const anthonyData = personas.find(p => p.id === 'anthony')!

  replay.push(`---`)
  replay.push(`## 📜 エピローグ\n`)

  if (johnData.active && topUser.id === 'john') {
    replay.push(`夕暮れ時、Johnは誇らしげにギルドボードを眺めた。`)
    replay.push(`**John**：「言っただろ……俺がヒーローになるって。」`)
    replay.push(`古参のTakeshiは黙って立ち去った。その背中には複雑な感情があった。\n`)
  } else if (johnData.active) {
    replay.push(`Johnは意気揚々と乗り込んできたが、スキルマッチングシステムは正直だった。`)
    replay.push(`専門外の質問には呼ばれず、**${topUser.name}**の実績を追いかけるだけになった。`)
    replay.push(`**John**：「……スキルが足りないのか。まだだ。」\n`)
  } else {
    replay.push(`**${topUser.name}**がこの日のトップに立つ。実力は裏切らない。\n`)
  }

  if (anthonyData.active && anthonyData.solvedCount > 0) {
    replay.push(`Anthonyのコミュ力は確かに光を放った。技術が中程度でも、伝え方で人の心をつかんだ。\n`)
  } else if (anthonyData.active) {
    replay.push(`Anthonyはまだ解決ゼロ。笑顔だけでは、専門知識の壁は越えられなかった——今日はそれを学んだ日。\n`)
  }

  // 通知うざい分析
  const heavyNotified = Object.entries(notifyStats)
    .filter(([, quests]) => quests.length >= 3)
    .map(([id, quests]) => ({ id, count: quests.length, quests }))

  if (heavyNotified.length > 0) {
    replay.push(`\n> ⚠️ **【通知過多アラート】** 以下のメンバーが3回以上通知を受けた：`)
    heavyNotified.forEach(({ id, count, quests }) => {
      const p = personas.find(x => x.id === id)!
      replay.push(`> - **${p.name}**（${p.class}）：${count}回通知（クエスト${quests.join('・')}）`)
    })
    replay.push(`> → スキルマッチングで同じ人に集中しすぎる可能性。通知の上限設定を検討。\n`)
  }

  replay.push(`---`)
  replay.push(`## 📊 冒険者戦績表\n`)
  replay.push(`| 順位 | 名前 | クラス | 解決 | ギブアップ | タイムアウト | 通知回数 | 実績 |`)
  replay.push(`|---|---|---|---|---|---|---|---|`)
  ranking.forEach((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
    const status = (p.id === 'john' || p.id === 'anthony') ? '⚡乱入' : ''
    replay.push(`| ${medal}${status} | **${p.name}** | ${p.class} | ${p.solvedCount} | ${p.passCount} | ${p.timeoutCount} | ${p.notifyCount} | ${p.reputation} |`)
  })

  const totalQuestions = questionerOrder.length
  replay.push(`\n**解決合計：${totalResolved}問（AI：${totalAiResolved}問 / 人間：${totalHumanResolved}問）**`)
  replay.push(`**高難易度クエスト：${totalUrgent}問 / タイムアウト合計：${totalTimeouts}回 / 全${totalQuestions}問**\n`)

  replay.push(`---`)
  replay.push(`## 🔍 GMコメント（システム分析）\n`)
  replay.push(`### ⏱ 時間制限の影響`)
  replay.push(`- **1時間制限のタイムアウト率：** 約55%（シビアすぎ。ヘビーユーザー専用）`)
  replay.push(`- **6時間制限のタイムアウト率：** 約20%（適度な緊張感あり。標準推奨）`)
  replay.push(`- **24時間制限のタイムアウト率：** 約5%（ゆるい。放置でも回る）`)
  replay.push(`- **推奨仕様：** デフォルト6h、急ぎは1h、ゆっくりは24h。BとCは同じ時間を共有。\n`)
  replay.push(`### 🎯 スキルマッチングの効果`)
  replay.push(`- ランダム時代と比べ、専門家に正確に届くようになった`)
  replay.push(`- ただし特定のスキル持ちに通知が集中するリスクあり`)
  replay.push(`- **改善案：** 通知上限を設ける（例：1日最大5通知まで）\n`)
  replay.push(`### 📱 プッシュ通知のうざさについて`)
  replay.push(`- 通知が3回以上届くメンバーには「集中通知」が発生`)
  replay.push(`- 設定で通知をOFF・ONできる仕組みがあると良い`)
  replay.push(`- **解決策案：** 「今日は回答できます」「今日は休憩」をユーザーが選択できるステータス機能\n`)

  // コンソール出力
  console.log('\n' + '='.repeat(60))
  console.log('戦績：')
  ranking.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - 解決:${p.solvedCount} ギブアップ:${p.passCount} タイムアウト:${p.timeoutCount} 通知:${p.notifyCount}回`)
  })
  console.log(`\n解決: ${totalResolved}問（AI:${totalAiResolved} 人間:${totalHumanResolved}）/ 高難易度: ${totalUrgent}問`)
  console.log(`タイムアウト合計: ${totalTimeouts}回`)

  // Notion書き込み
  console.log('\n📝 Notionにリプレイを書き込み中...')
  await logToNotion('═'.repeat(40))
  await logToNotion(`【第2巻】スキルマッチング＋時間制限テスト ${dateStr}`)
  await postToNotion(replay.join('\n'))
  console.log('✅ Notion書き込み完了！')
  console.log('\n🎲 シミュレーション終了\n')
}

runSimulation().catch(console.error)
