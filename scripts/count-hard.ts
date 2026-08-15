// ⚠️ service_roleキーはRLSを完全にバイパスするため、絶対にコードへ直書きしないこと。
// このファイルには実際に直書きされており、公開リポジトリに載っていた（2026-08-15に発見・鍵はローテート済み）。
// 環境変数から読む。実行する場合は: set -a; source .env.local; set +a; npx tsx <file>
import { createClient } from '@supabase/supabase-js'
const db = createClient('https://scnkpmxvtwtsxzbhfdnf.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{autoRefreshToken:false,persistSession:false}})

async function main() {
  const {count: hard} = await db.from('questions').select('*', {count:'exact',head:true}).eq('status','hard')
  const {count: total} = await db.from('questions').select('*', {count:'exact',head:true})
  const {data: cats} = await db.from('questions').select('title').eq('status','hard').order('created_at', {ascending:false}).limit(30)
  console.log(`高難度クエスト（未解決）: ${hard} 件 / 総質問数: ${total} 件`)
  console.log('\n未解決の高難度クエスト一覧:')
  cats?.forEach((q, i) => console.log(`  ${i+1}. ${q.title}`))
}
main()
