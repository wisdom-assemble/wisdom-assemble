import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_USERS = [
  { email: 'takeshi@test.com', password: 'test1234', display_name: 'Takeshi', skill_tags: ['Linux', 'セキュリティ'] },
  { email: 'ryo@test.com',     password: 'test1234', display_name: 'Ryo',     skill_tags: ['SQL', 'PostgreSQL'] },
  { email: 'mia@test.com',     password: 'test1234', display_name: 'Mia',     skill_tags: ['AWS', 'Docker'] },
  { email: 'shin@test.com',    password: 'test1234', display_name: 'Shin',    skill_tags: ['Python'] },
  { email: 'hana@test.com',    password: 'test1234', display_name: 'Hana',    skill_tags: ['セキュリティ', 'Supabase'] },
  { email: 'ken@test.com',     password: 'test1234', display_name: 'Ken',     skill_tags: ['React', 'JavaScript'] },
  { email: 'aoi@test.com',     password: 'test1234', display_name: 'Aoi',     skill_tags: ['Python', 'AWS'] },
  { email: 'taro@test.com',    password: 'test1234', display_name: 'Taro',    skill_tags: ['JavaScript', 'React', 'Python', 'SQL'] },
  { email: 'noa@test.com',     password: 'test1234', display_name: 'Noa',     skill_tags: ['JavaScript'] },
  { email: 'john@test.com',    password: 'test1234', display_name: 'John',    skill_tags: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'SQL'] },
  { email: 'anthony@test.com', password: 'test1234', display_name: 'Anthony', skill_tags: ['React', 'TypeScript', 'Node.js'] },
  { email: 'yuki@test.com',    password: 'test1234', display_name: 'Yuki',    skill_tags: ['React', 'CSS', 'TypeScript'] },
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
