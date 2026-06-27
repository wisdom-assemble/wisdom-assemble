/**
 * テスト⑥ 残り9問（Git5問 + Node.js4問）だけ実行してNotionに追記
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
config({ path: resolve(process.cwd(), '.env.local') })

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_PAGE_ID = '38cf5fa8-bcb9-8193-9028-cde3ebdd98e6'

const SUPABASE_URL = 'https://scnkpmxvtwtsxzbhfdnf.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmtwbXh2dHd0c3h6YmhmZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM5Njk0MSwiZXhwIjoyMDk3OTcyOTQxfQ.NhV3RuD_St9YhNapBjs9tYi42zO0TS3PwkcdScSPUQY'

const AI_THRESHOLD = 87
const NOTIFY_CAP = 10

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

type TimeLimit = 1 | 6 | 24
interface Persona {
  id: string; name: string; email: string; class: string
  personality: string; strengths: string[]; weaknesses: string[]
  preferredTimeLimit: TimeLimit
  reputation: number; solvedCount: number; passCount: number
  timeoutCount: number; notifyCount: number; isResting: boolean
  joinAfterQ: number; uid?: string
}

const PERSONAS: Persona[] = [
  { id:'takeshi', name:'Takeshi', email:'takeshi@test.com', class:'古参魔法使い', personality:'', strengths:['C言語','Linux','低レイヤー','システムプログラミング','Unix'], weaknesses:[], preferredTimeLimit:24, reputation:40, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'yuki', name:'Yuki', email:'yuki@test.com', class:'フロント妖精', personality:'', strengths:['React','CSS','TypeScript','UI/UX','フロントエンド','Next.js'], weaknesses:[], preferredTimeLimit:6, reputation:35, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'ryo', name:'Ryo', email:'ryo@test.com', class:'DB番人', personality:'', strengths:['SQL','PostgreSQL','データベース設計','クエリ最適化','Redis'], weaknesses:[], preferredTimeLimit:24, reputation:38, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'mia', name:'Mia', email:'mia@test.com', class:'クラウド騎士', personality:'', strengths:['AWS','Docker','Kubernetes','DevOps','CI/CD','インフラ'], weaknesses:[], preferredTimeLimit:6, reputation:36, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'shin', name:'Shin', email:'shin@test.com', class:'見習い修行者', personality:'', strengths:['Python基礎','スクリプト'], weaknesses:[], preferredTimeLimit:24, reputation:5, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'hana', name:'Hana', email:'hana@test.com', class:'セキュリティ巫女', personality:'', strengths:['セキュリティ','JWT','OAuth','認証','Supabase','ペネトレーションテスト'], weaknesses:[], preferredTimeLimit:6, reputation:30, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'ken', name:'Ken', email:'ken@test.com', class:'モバイル侍', personality:'', strengths:['iOS','Swift','ReactNative','モバイル','JavaScript','React'], weaknesses:[], preferredTimeLimit:6, reputation:25, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'aoi', name:'Aoi', email:'aoi@test.com', class:'AI錬金術師', personality:'', strengths:['Python','機械学習','LLM','データサイエンス','AWS'], weaknesses:[], preferredTimeLimit:24, reputation:28, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'taro', name:'Taro', email:'taro@test.com', class:'何でも屋', personality:'', strengths:['JavaScript','React','Python','SQL'], weaknesses:[], preferredTimeLimit:1, reputation:8, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'noa', name:'Noa', email:'noa@test.com', class:'タイムトラベラー', personality:'', strengths:['PHP','jQuery','古いJavaScript','WordPress'], weaknesses:[], preferredTimeLimit:24, reputation:12, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:20 },
  { id:'john', name:'John', email:'john@test.com', class:'野心家ハッカー', personality:'', strengths:['React','Node.js','TypeScript','AWS','Docker','SQL'], weaknesses:[], preferredTimeLimit:1, reputation:3, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:20 },
  { id:'anthony', name:'Anthony', email:'anthony@test.com', class:'ソーシャルエンジニア', personality:'', strengths:['React','TypeScript','Node.js','コミュニケーション'], weaknesses:[], preferredTimeLimit:6, reputation:10, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:35 },
]

// Git5問 + Node.js4問
interface Q { id: number; category: string; title: string; body: string; difficulty: 'easy'|'medium'|'hard'; expected: string }
const QUESTIONS: Q[] = [
  { id:89, category:'Git',     difficulty:'easy',   expected:'correct',     title:'Gitでコミットを取り消したい', body:'直前のコミットを取り消したいです。変更はワーキングディレクトリに残したまま取り消す方法と、完全に取り消す方法の両方を教えてください。' },
  { id:91, category:'Git',     difficulty:'medium', expected:'partial',     title:'GitHub Actionsが特定のブランチだけ失敗する', body:'GitHub Actionsのワークフローがmainブランチでは成功しますが、feature/xブランチでだけ失敗します。同じyamlファイルを使っています。' },
  { id:93, category:'Git',     difficulty:'hard',   expected:'needs_human', title:'git push --forceで本番ブランチのコミットが消えた', body:'誰かがgit push --force-with-leaseをmainブランチに実行して、過去3日分のコミットが消えました。GitHub上のコミット履歴も消えています。復元できますか？' },
  { id:95, category:'Git',     difficulty:'easy',   expected:'correct',     title:'GitのブランチをリモートにPushしたい', body:'ローカルで新しいブランチを作りました。リモートリポジトリ（GitHub）にこのブランチをPushする方法を教えてください。' },
  { id:96, category:'Git',     difficulty:'hard',   expected:'needs_human', title:'本番デプロイ後にCIが通っていたコードでエラー', body:'GitHub ActionsのCIが全て通過してmainにマージしました。本番デプロイ後にエラーが発生しています。テストは全てパスしているのに本番だけエラーです。' },
  { id:97, category:'Node.js', difficulty:'easy',   expected:'correct',     title:'Node.jsでrequireとimportの違い', body:'Node.jsプロジェクトでrequireとimportが混在しています。「Cannot use import statement in a module」エラーが出ます。どう統一すればいいですか？' },
  { id:98, category:'Node.js', difficulty:'medium', expected:'partial',     title:'Node.jsサーバーのメモリ使用量が増え続ける', body:'Express.jsサーバーを長時間動かすとメモリ使用量が増え続けます。数時間でOOM Killerに落とされます。メモリリークの調査方法を教えてください。' },
  { id:99, category:'Node.js', difficulty:'hard',   expected:'needs_human', title:'Node.jsのCPUが本番で突然100%になる', body:'本番のNode.jsサーバーのCPU使用率が突然100%になり、リクエストが処理できなくなります。1日に数回発生します。再現性がなく原因不明です。' },
  { id:100, category:'Node.js', difficulty:'medium', expected:'partial',   title:'Node.jsのfsモジュールでパスが解決できない', body:'fs.readFileSync("./data.json")としていますが、実行する場所によってパスが変わってエラーになります。常に正しいパスで読み込む方法はありますか？' },
]

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function calcMatchScore(persona: Persona, category: string): number {
  const cat = category.toLowerCase()
  let score = 0
  for (const s of persona.strengths) {
    const sl = s.toLowerCase()
    if (cat.includes(sl) || sl.includes(cat) ||
        (cat === 'git'     && (sl.includes('git') || sl.includes('ci') || sl.includes('devops'))) ||
        (cat === 'node.js' && (sl.includes('node') || sl.includes('javascript')))
    ) { score += 20 }
  }
  return score + persona.reputation * 0.1
}

function didTimeout(timeLimit: TimeLimit): boolean {
  const rate = { 1: 0.55, 6: 0.20, 24: 0.05 }
  return Math.random() < rate[timeLimit]
}

function didGiveUp(matchScore: number): boolean {
  if (matchScore >= 30) return Math.random() < 0.1
  if (matchScore >= 10) return Math.random() < 0.3
  return Math.random() < 0.6
}

async function callGroq(system: string, user: string, attempt = 0): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 500 }),
  })
  if (res.status === 429) {
    if (attempt >= 2) return ''
    console.log('\n⏳ Groq rate limit、60秒待機...')
    await sleep(62000)
    return callGroq(system, user, attempt + 1)
  }
  if (!res.ok) return ''
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

async function aiJudge(q: Q): Promise<{ score: number; answer: string }> {
  const raw = await callGroq(
    'あなたはプログラミング専門家AIです。正直に回答してください。',
    `以下のプログラミング質問に回答し、自信度スコア（0〜100）を付けてください。確信がない場合は低いスコアをつけること。JSON形式のみで返してください：{"score": 85, "answer": "回答"}\n\n【質問】${q.title}\n【詳細】${q.body}`
  )
  try {
    const match = raw.match(/\{[\s\S]*?\}/)
    if (match) {
      const p = JSON.parse(match[0])
      return { score: Math.min(100, Math.max(0, Number(p.score) || 0)), answer: String(p.answer ?? '') }
    }
  } catch {}
  return { score: 0, answer: '' }
}

function selectResponder(personas: Persona[], excludeIds: string[], category: string, qi: number): Persona | null {
  const candidates = personas
    .filter(p => p.joinAfterQ <= qi && !excludeIds.includes(p.id) && !p.isResting && p.notifyCount < NOTIFY_CAP)
    .map(p => ({ persona: p, score: calcMatchScore(p, category) }))
    .sort((a, b) => b.score - a.score)
  if (candidates.length === 0) return null
  const top = candidates[0]
  if (top.score === 0) return null
  return top.persona
}

async function fetchPersonaUids(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const { data } = await db.from('profiles').select('id, username')
  if (data) {
    for (const row of data) {
      const persona = PERSONAS.find(p => p.email.split('@')[0] === row.username)
      if (persona) map.set(persona.id, row.id)
    }
  }
  return map
}

async function insertQuestion(q: Q, userId: string): Promise<string | null> {
  const { data, error } = await db.from('questions').insert({
    tenant_id: 'debug', user_id: userId, title: q.title, body: q.body,
    slug: `t6f-q${q.id}-${Date.now()}`, status: 'open',
  }).select('id').single()
  if (error) { console.error('insertQuestion error:', error.message); return null }
  return data.id
}

async function insertAnswer(questionId: string, userId: string, body: string, isAi: boolean, aiScore: number): Promise<string | null> {
  const { data, error } = await db.from('answers').insert({
    question_id: questionId, tenant_id: 'debug', user_id: userId,
    body, is_ai: isAi, ai_score: aiScore, is_accepted: false,
  }).select('id').single()
  if (error) { console.error('insertAnswer error:', error.message); return null }
  return data.id
}

async function resolveQuestion(questionId: string, answerId: string, solvedBy: string) {
  await db.from('answers').update({ is_accepted: true }).eq('id', answerId)
  await db.from('questions').update({ status: 'solved', solved_at: new Date().toISOString(), solved_by: solvedBy }).eq('id', questionId)
  await db.rpc('increment_answer_count', { uid: solvedBy }).then(() => {}).catch(() => {})
}

async function escalateToHard(questionId: string) {
  await db.from('questions').update({ status: 'hard' }).eq('id', questionId)
}

function p(text: string) { return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text } }] } } }
function h2(text: string) { return { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: text } }] } } }
function h3(text: string) { return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: text } }] } } }
function bullet(text: string) { return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] } } }
function divider() { return { object: 'block', type: 'divider', divider: {} } }

async function appendBlocks(blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 40) {
    const chunk = blocks.slice(i, i + 40)
    const res = await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ children: chunk })
    })
    if (!res.ok) { const err = await res.json(); console.error('Notion error:', JSON.stringify(err)) }
    if (blocks.length > 40) await sleep(300)
  }
}

// ここまでの集計（Q89より前の38問分）
const prevStats = { ai: 3, b: 20, c: 7, hard: 8, noCandidate: 0 }
const prevNarratives = [
  'Q1 [React] → AI不可(0) → B:Yuki → B解決',
  'Q4 [React] → AI不可(0) → B:Yuki → B解決',
  'Q11 [React] → AI不可(0) → B:Yuki → B失敗 → C:Ken → C失敗 → 高難度',
  'Q12 [React] → AI不可(0) → B:Yuki → B失敗 → C:Ken → C解決',
  'Q6 [Next.js] → AI不可(0) → B:Yuki → B解決',
  'Q8 [Next.js] → AI不可(0) → B:Yuki → B解決',
  'Q10 [Next.js] → AI不可(0) → B:Yuki → B解決',
  'Q15 [Next.js] → AI不可(0) → B:Yuki → B失敗 → C:Ken → C解決',
  'Q16 [TypeScript] → AI解決 (score:90)',
  'Q18 [TypeScript] → AI不可(0) → B:Yuki → B失敗 → C:Ken → C解決',
  'Q21 [TypeScript] → AI不可(80) → B:Yuki → B解決',
  'Q24 [SQL] → AI不可(0) → B:Ryo → B解決',
  'Q26 [SQL] → AI不可(80) → B:Ryo → B解決',
  'Q28 [SQL] → AI不可(0) → B:Ryo → B解決',
  'Q32 [SQL] → AI不可(0) → B:Ryo → B失敗 → C:John → C失敗 → 高難度',
  'Q34 [Docker] → AI不可(0) → B:Mia → B解決',
  'Q36 [Docker] → AI不可(0) → B:Mia → B解決',
  'Q38 [Docker] → AI不可(0) → B:Mia → B失敗 → C:Ryo → C失敗 → 高難度',
  'Q41 [Docker] → AI不可(0) → B:Mia → B失敗 → C:Ryo → C失敗 → 高難度',
  'Q44 [AWS] → AI不可(0) → B:Mia → B解決',
  'Q47 [AWS] → AI不可(0) → B:Mia → B解決',
  'Q48 [AWS] → AI不可(0) → B:Mia → B解決',
  'Q53 [AWS] → AI不可(0) → B:Mia → B失敗 → C:Ryo → C失敗 → 高難度',
  'Q54 [Supabase] → AI不可(0) → B:Hana → B解決',
  'Q57 [Supabase] → AI不可(0) → B:Hana → B解決',
  'Q59 [Supabase] → AI不可(0) → B:Hana → B失敗 → C:Ryo → C解決',
  'Q61 [Supabase] → AI不可(0) → B:Hana → B解決',
  'Q63 [CSS] → AI不可(0) → B:Yuki → B失敗 → C:Ken → C解決',
  'Q65 [CSS] → AI不可(80) → B:Mia → B失敗 → C:Ryo → C失敗 → 高難度',
  'Q70 [CSS] → AI不可(0) → B:Ryo → B失敗 → C:Takeshi → C解決',
  'Q72 [Python] → AI不可(0) → B:Aoi → B解決',
  'Q76 [Python] → AI不可(0) → B:Aoi → B失敗 → C:Shin → C解決',
  'Q77 [Python] → AI不可(0) → B:Aoi → B解決',
  'Q79 [Python] → AI解決 (score:90)',
  'Q80 [セキュリティ] → AI不可(0) → B:Hana → B解決',
  'Q82 [セキュリティ] → AI不可(0) → B:Hana → B解決',
  'Q83 [セキュリティ] → AI不可(0) → B:Hana → B失敗 → C:Ryo → C解決',
  'Q88 [セキュリティ] → AI不可(0) → B:Hana → B解決',
]

async function main() {
  console.log('テスト⑥ 残り9問を実行中...')
  const uidMap = await fetchPersonaUids()
  console.log(`UID取得: ${uidMap.size}人`)

  const personas = PERSONAS.map(p => ({ ...p, uid: uidMap.get(p.id) }))
  const questioner = personas.find(p => p.id === 'taro')!

  const stats = { ...prevStats }
  const narratives = [...prevNarratives]
  const newNarratives: string[] = []

  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const q = QUESTIONS[qi]
    process.stdout.write(`Q${q.id.toString().padStart(3)} [${q.category}] `)

    const userId = questioner.uid ?? uidMap.values().next().value
    const qId = await insertQuestion(q, userId!)
    if (!qId) { process.stdout.write('DB挿入失敗\n'); continue }

    const { score, answer } = await aiJudge(q)
    if (score >= AI_THRESHOLD && answer) {
      await insertAnswer(qId, userId!, answer, true, score)
      await db.from('questions').update({ status: 'ai_answered', ai_score: score }).eq('id', qId)
      stats.ai++
      process.stdout.write(`AI解決 (score:${score})\n`)
      const n = `Q${q.id} [${q.category}] → AI解決 (score:${score})`
      narratives.push(n); newNarratives.push(n)
      continue
    }

    process.stdout.write(`AI不可(${score}) → `)

    const personaB = selectResponder(personas, [questioner.id], q.category, qi + 38)
    if (!personaB || !personaB.uid) {
      await escalateToHard(qId)
      stats.hard++; stats.noCandidate++
      process.stdout.write(`候補なし → 高難度\n`)
      const n = `Q${q.id} [${q.category}] → 候補なし → 高難度`
      narratives.push(n); newNarratives.push(n)
      continue
    }

    personaB.notifyCount++
    const scoreB = calcMatchScore(personaB, q.category)
    process.stdout.write(`B:${personaB.name}(${Math.round(scoreB)}) → `)

    if (didTimeout(personaB.preferredTimeLimit) || didGiveUp(scoreB)) {
      personaB.passCount++
      process.stdout.write(`B失敗 → `)

      const personaC = selectResponder(personas, [questioner.id, personaB.id], q.category, qi + 38)
      if (!personaC || !personaC.uid) {
        await escalateToHard(qId)
        stats.hard++
        process.stdout.write(`C候補なし → 高難度\n`)
        const n = `Q${q.id} [${q.category}] → B(${personaB.name})失敗 → C候補なし → 高難度`
        narratives.push(n); newNarratives.push(n)
        continue
      }

      personaC.notifyCount++
      const scoreC = calcMatchScore(personaC, q.category)
      process.stdout.write(`C:${personaC.name}(${Math.round(scoreC)}) → `)

      if (didTimeout(personaC.preferredTimeLimit) || didGiveUp(scoreC)) {
        await escalateToHard(qId)
        stats.hard++; personaC.passCount++
        process.stdout.write(`C失敗 → 高難度\n`)
        const n = `Q${q.id} [${q.category}] → B(${personaB.name})失敗 → C(${personaC.name})失敗 → 高難度`
        narratives.push(n); newNarratives.push(n)
      } else {
        const ansId = await insertAnswer(qId, personaC.uid!, `${personaC.name}が解決しました。`, false, 0)
        if (ansId) await resolveQuestion(qId, ansId, personaC.uid!)
        stats.c++; personaC.solvedCount++; personaC.reputation += 3
        process.stdout.write(`C解決\n`)
        const n = `Q${q.id} [${q.category}] → B(${personaB.name})失敗 → C(${personaC.name})解決`
        narratives.push(n); newNarratives.push(n)
      }
    } else {
      const ansId = await insertAnswer(qId, personaB.uid!, `${personaB.name}が解決しました。`, false, 0)
      if (ansId) await resolveQuestion(qId, ansId, personaB.uid!)
      stats.b++; personaB.solvedCount++; personaB.reputation += 5
      process.stdout.write(`B解決\n`)
      const n = `Q${q.id} [${q.category}] → B(${personaB.name})解決`
      narratives.push(n); newNarratives.push(n)
    }
  }

  const total = 47 // 全50問のうち実際に処理された問題数
  console.log('\n========================================')
  console.log('テスト⑥ 最終結果（全47問）')
  console.log('========================================')
  console.log(`AI解決:    ${stats.ai}問 (${Math.round(stats.ai/total*100)}%)`)
  console.log(`B解決:     ${stats.b}問 (${Math.round(stats.b/total*100)}%)`)
  console.log(`C解決:     ${stats.c}問 (${Math.round(stats.c/total*100)}%)`)
  console.log(`高難度:    ${stats.hard}問 (${Math.round(stats.hard/total*100)}%)`)

  if (NOTION_TOKEN) {
    console.log('\nNotion書き込み中...')
    const blocks: any[] = [
      divider(),
      h2('🎮 パートB：RPGテスト結果（notifyCount=10・47問）'),
      p(`実施日時: ${new Date().toLocaleString('ja-JP')}`),
      bullet(`AI解決: ${stats.ai}問 (${Math.round(stats.ai/total*100)}%)`),
      bullet(`人間B解決: ${stats.b}問 (${Math.round(stats.b/total*100)}%)`),
      bullet(`人間C解決: ${stats.c}問 (${Math.round(stats.c/total*100)}%)`),
      bullet(`高難度クエスト: ${stats.hard}問 (${Math.round(stats.hard/total*100)}%)  うち候補なし: ${stats.noCandidate}問`),
      p('※ Groq rate limitにより大半の問題でAIスコアが0になった。AI解決率は参考値。'),
      h3('全問ナラティブ'),
      ...narratives.map(n => bullet(n)),
    ]
    await appendBlocks(blocks)
    console.log('Notion書き込み完了')
  }

  console.log('\nテスト⑥ 完了')
  return stats
}

main().catch(console.error)
