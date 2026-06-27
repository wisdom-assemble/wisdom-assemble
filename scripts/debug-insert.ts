import { createClient } from '@supabase/supabase-js'
const admin = createClient('https://scnkpmxvtwtsxzbhfdnf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmtwbXh2dHd0c3h6YmhmZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM5Njk0MSwiZXhwIjoyMDk3OTcyOTQxfQ.NhV3RuD_St9YhNapBjs9tYi42zO0TS3PwkcdScSPUQY', {auth:{autoRefreshToken:false,persistSession:false}})

async function main() {
  const {data, error} = await admin.from('questions').insert({
    tenant_id: 'debug',
    user_id: 'c6630e47-c0fa-4c6d-9c2f-481791b42e07',
    title: 'テストタイトルです',
    body: 'テスト本文です。30文字以上必要です。テストテストテスト。',
    slug: 'test-slug-debug-x99',
    status: 'open',
  }).select('id').single()
  console.log('data:', data)
  console.log('error:', JSON.stringify(error, null, 2))
}
main()
