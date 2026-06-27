import { createClient } from '@supabase/supabase-js'
const db = createClient('https://scnkpmxvtwtsxzbhfdnf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmtwbXh2dHd0c3h6YmhmZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM5Njk0MSwiZXhwIjoyMDk3OTcyOTQxfQ.NhV3RuD_St9YhNapBjs9tYi42zO0TS3PwkcdScSPUQY', {auth:{autoRefreshToken:false,persistSession:false}})

async function main() {
  const {count: hard} = await db.from('questions').select('*', {count:'exact',head:true}).eq('status','hard')
  const {count: total} = await db.from('questions').select('*', {count:'exact',head:true})
  const {data: cats} = await db.from('questions').select('title').eq('status','hard').order('created_at', {ascending:false}).limit(30)
  console.log(`高難度クエスト（未解決）: ${hard} 件 / 総質問数: ${total} 件`)
  console.log('\n未解決の高難度クエスト一覧:')
  cats?.forEach((q, i) => console.log(`  ${i+1}. ${q.title}`))
}
main()
