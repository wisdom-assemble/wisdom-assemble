import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://scnkpmxvtwtsxzbhfdnf.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmtwbXh2dHd0c3h6YmhmZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM5Njk0MSwiZXhwIjoyMDk3OTcyOTQxfQ.NhV3RuD_St9YhNapBjs9tYi42zO0TS3PwkcdScSPUQY'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_USERS = [
  { email: 'ryo@test.com',  password: 'test1234', display_name: 'Ryo',  skill_tags: ['SQL', 'PostgreSQL'] },
  { email: 'yuki@test.com', password: 'test1234', display_name: 'Yuki', skill_tags: ['React', 'CSS', 'TypeScript'] },
  { email: 'mia@test.com',  password: 'test1234', display_name: 'Mia',  skill_tags: ['AWS', 'Docker'] },
]

async function main() {
  for (const u of TEST_USERS) {
    // ユーザー作成
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      console.log(`⚠️  ${u.email}: ${error.message}`)
      continue
    }

    const uid = data.user.id

    // profilesにスキルタグ・表示名を設定
    await supabase.from('profiles').update({
      display_name: u.display_name,
      skill_tags: u.skill_tags,
      is_available: true,
    }).eq('id', uid)

    console.log(`✅ ${u.display_name} (${u.email}) 作成完了`)
  }

  console.log('\n--- ログイン情報 ---')
  for (const u of TEST_USERS) {
    console.log(`${u.display_name}: ${u.email} / test1234`)
  }
}

main()
