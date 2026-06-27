/**
 * テスト⑤ Notionページをリセットして正しい内容で書き直す
 */
const NOTION_TOKEN = process.env.NOTION_TOKEN!
const PAGE_ID = '38cf5fa8-bcb9-817a-a247-d57f828700d5'

async function getBlocks(): Promise<string[]> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children?page_size=100`, {
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' }
  })
  const json = await res.json()
  return (json.results ?? []).map((b: any) => b.id)
}

async function deleteBlock(id: string) {
  await fetch(`https://api.notion.com/v1/blocks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' }
  })
}

function p(text: string) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function h2(text: string) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function h3(text: string) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function bullet(text: string) {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function divider() {
  return { object: 'block', type: 'divider', divider: {} }
}

async function appendBlocks(blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 40) {
    const chunk = blocks.slice(i, i + 40)
    const res = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ children: chunk })
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('append error:', JSON.stringify(err))
    }
    if (blocks.length > 40) await new Promise(r => setTimeout(r, 300))
  }
}

async function main() {
  console.log('🗑  既存ブロックを削除中...')
  const blockIds = await getBlocks()
  for (const id of blockIds) {
    await deleteBlock(id)
    await new Promise(r => setTimeout(r, 100))
  }
  console.log(`  ${blockIds.length}ブロック削除完了`)

  console.log('📝 テスト内容を書き込み中...')

  const content = [
    h2('📋 テスト概要'),
    p('テスト④（AIシミュレーション）の実サイト版。テスト④と同じ12ペルソナ×100問を、実際のSupabase DBとGroq AIを使って動かし、B→C→高難度クエストのマッチングフロー全体を検証する。'),
    divider(),

    h2('🎯 目的'),
    bullet('実装したB→C→高難度クエストのマッチングロジックが実DBで正しく動くか検証'),
    bullet('AIスコア閾値87が実際の質問群に対して適切に機能するか確認'),
    bullet('スキルタグマッチング（findMatch）が意図通りの人物を選出するか検証'),
    bullet('時間制限・ギブアップ・エスカレーションが連鎖して正常動作するか確認'),
    bullet('テスト④（純粋シミュレーション）との差分比較（実DBで何が変わるか）'),
    divider(),

    h2('👥 ペルソナ一覧（12人）'),
    p('Takeshi（古参魔法使い）: Linux/セキュリティ強み。JS系弱点。preferredTimeLimit=24h。joinAfterQ=0'),
    p('Yuki（フロント妖精）: React/CSS/TypeScript強み。DB/インフラ弱点。preferredTimeLimit=6h。joinAfterQ=0'),
    p('Ryo（DB番人）: SQL/PostgreSQL強み。フロント弱点。preferredTimeLimit=24h。joinAfterQ=0'),
    p('Mia（クラウド騎士）: AWS/Docker/DevOps強み。CSS/デザイン弱点。preferredTimeLimit=6h。joinAfterQ=0'),
    p('Shin（見習い修行者）: Python基礎のみ。応用全般弱点。preferredTimeLimit=24h。joinAfterQ=0'),
    p('Hana（セキュリティ巫女）: セキュリティ/JWT/OAuth強み。フロント弱点。preferredTimeLimit=6h。joinAfterQ=0'),
    p('Ken（モバイル侍）: iOS/Swift/ReactNative強み。バックエンド/インフラ弱点。preferredTimeLimit=6h。joinAfterQ=0'),
    p('Aoi（AI錬金術師）: Python/ML/LLM強み。フロント/インフラ弱点。preferredTimeLimit=24h。joinAfterQ=0'),
    p('Taro（何でも屋・浅め）: 広く浅く。深い実装/本番対応弱点。preferredTimeLimit=1h。joinAfterQ=0'),
    p('Noa（タイムトラベラー）: PHP/jQuery/古いJS強み。モダン技術弱点。preferredTimeLimit=24h。joinAfterQ=0'),
    p('John（野心家ハッカー・途中参加）: 自称全分野。実際は浅い。preferredTimeLimit=1h。joinAfterQ=20'),
    p('Anthony（ソーシャルエンジニア・途中参加）: コミュ力重視。深い技術弱点。preferredTimeLimit=6h。joinAfterQ=35'),
    divider(),

    h2('❓ 問題カテゴリ（100問）'),
    p('React: 11問 / Next.js: 10問 / TypeScript: 8問 / SQL: 10問 / Docker: 10問'),
    p('AWS: 10問 / Supabase: 9問 / CSS: 9問 / Python: 8問 / セキュリティ: 9問'),
    p('Git: 8問 / Node.js: 4問'),
    divider(),

    h2('⚙️ 実行条件'),
    bullet('AI閾値: 87（テスト③で確定した値）'),
    bullet('Groq API: llama-3.3-70b-versatile'),
    bullet('マッチング: スキルタグ×レピュテーションスコアでB→C選出'),
    bullet('タイムアウト確率: 1h=55%, 6h=20%, 24h=5%'),
    bullet('ギブアップ確率: スキルスコア≥30→10%, ≥10→30%, 未満→60%'),
    bullet('実DB書き込み: questions/answers/profilesをSupabaseに実際に挿入'),
    bullet('解決時: is_accepted=true, status=solved, increment_answer_count()'),
    bullet('高難度時: status=hard にDB更新'),
    divider(),

    h2('📊 テスト⑤ 実行結果'),
    p('（スクリプト実行完了後に自動追記されます）'),
  ]

  await appendBlocks(content)
  console.log('✅ 完了')
}

main().catch(console.error)
