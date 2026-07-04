import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import { QuestionList, UserList } from './AdminActions'

const ADMIN_EMAIL = 'wisdomassemble@gmail.com'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const { tab = 'questions' } = await searchParams

  const [{ data: questions }, { data: profiles }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, slug, title, status, tenant_id, created_at, user_id, matched_b_id, profiles!questions_user_id_fkey(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('profiles')
      .select('id, username, display_name, answer_count, is_available, is_banned, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">admin only</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="総質問数" value={questions?.length ?? 0} />
          <StatCard label="総ユーザー数" value={profiles?.length ?? 0} />
          <StatCard label="未解決" value={questions?.filter(q => q.status === 'open' || q.status === 'hard').length ?? 0} />
        </div>

        <div className="flex gap-4 border-b mb-6">
          <TabLink href="/admin?tab=questions" active={tab === 'questions'} label="質問一覧" />
          <TabLink href="/admin?tab=users" active={tab === 'users'} label="ユーザー一覧" />
        </div>

        {tab === 'questions' && (
          <QuestionList questions={(questions ?? []) as any} adminUserId={user.id} />
        )}

        {tab === 'users' && (
          <UserList profiles={(profiles ?? []) as any} adminUserId={user.id} />
        )}
      </main>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border border-gray-100 rounded-lg text-center">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </Link>
  )
}
