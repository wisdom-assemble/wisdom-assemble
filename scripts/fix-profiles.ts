import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  'https://scnkpmxvtwtsxzbhfdnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmtwbXh2dHd0c3h6YmhmZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM5Njk0MSwiZXhwIjoyMDk3OTcyOTQxfQ.NhV3RuD_St9YhNapBjs9tYi42zO0TS3PwkcdScSPUQY',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const PERSONAS = [
  { email: 'takeshi@test.com', display_name: 'Takeshi', skill_tags: ['Linux', 'セキュリティ'] },
  { email: 'yuki@test.com',    display_name: 'Yuki',    skill_tags: ['React', 'CSS', 'TypeScript'] },
  { email: 'ryo@test.com',     display_name: 'Ryo',     skill_tags: ['SQL', 'PostgreSQL'] },
  { email: 'mia@test.com',     display_name: 'Mia',     skill_tags: ['AWS', 'Docker'] },
  { email: 'shin@test.com',    display_name: 'Shin',    skill_tags: ['Python'] },
  { email: 'hana@test.com',    display_name: 'Hana',    skill_tags: ['セキュリティ', 'Supabase'] },
  { email: 'ken@test.com',     display_name: 'Ken',     skill_tags: ['React', 'JavaScript'] },
  { email: 'aoi@test.com',     display_name: 'Aoi',     skill_tags: ['Python', 'AWS'] },
  { email: 'taro@test.com',    display_name: 'Taro',    skill_tags: ['JavaScript', 'React', 'Python', 'SQL'] },
  { email: 'noa@test.com',     display_name: 'Noa',     skill_tags: ['JavaScript'] },
  { email: 'john@test.com',    display_name: 'John',    skill_tags: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'SQL'] },
  { email: 'anthony@test.com', display_name: 'Anthony', skill_tags: ['React', 'TypeScript', 'Node.js'] },
]

async function main() {
  const { data: { users } } = await admin.auth.admin.listUsers()

  for (const p of PERSONAS) {
    const user = users.find(u => u.email === p.email)
    if (!user) { console.log(`⚠️ ${p.email} not found`); continue }

    // profilesに既存レコードがあるか確認
    const { data: existing } = await admin.from('profiles').select('id').eq('id', user.id).maybeSingle()

    if (existing) {
      // 更新
      await admin.from('profiles').update({
        display_name: p.display_name,
        skill_tags: p.skill_tags,
        is_available: true,
      }).eq('id', user.id)
      console.log(`✅ ${p.display_name} プロフィール更新`)
    } else {
      // 新規作成
      const { error } = await admin.from('profiles').insert({
        id: user.id,
        username: p.email.split('@')[0],
        display_name: p.display_name,
        skill_tags: p.skill_tags,
        is_available: true,
      })
      if (error) console.log(`❌ ${p.display_name}: ${error.message}`)
      else console.log(`✅ ${p.display_name} プロフィール作成`)
    }
  }
}

main()
