import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import { DeleteQuestionButton, BanUserButton } from './AdminActions'

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
      .select('id, title, status, tenant_id, created_at, user_id, profiles!questions_user_id_fkey(username, display_name)')
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
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">admin only</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="総質問数" value={questions?.length ?? 0} />
          <StatCard label="総ユーザー数" value={profiles?.length ?? 0} />
          <StatCard
            label="未解決"
            value={questions?.filter(q => q.status === 'open' || q.status === 'hard').length ?? 0}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <TabLink href="/admin?tab=questions" active={tab === 'questions'} label="質問一覧" />
          <TabLink href="/admin?tab=users" active={tab === 'users'} label="ユーザー一覧" />
        </div>

        {tab === 'questions' && (
          <div className="space-y-2">
            {questions?.map(q => {
              const poster = q.profiles as any
              return (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/questions/${encodeURIComponent(q.id)}`}
                      className="text-sm font-medium text-gray-900 hover:underline truncate block"
                    >
                      {q.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {poster?.display_name ?? poster?.username} ·{' '}
                      {q.tenant_id} ·{' '}
                      {new Date(q.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <StatusBadge status={q.status} />
                  <DeleteQuestionButton questionId={q.id} />
                </div>
              )
            })}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-2">
            {profiles?.map(p => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  p.is_banned ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {p.display_name ?? p.username}
                    {p.is_banned && <span className="ml-2 text-xs text-red-600 font-normal">BAN済み</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    @{p.username} · 回答数 {p.answer_count} ·{' '}
                    {new Date(p.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <BanUserButton userId={p.id} isBanned={!!p.is_banned} />
              </div>
            ))}
          </div>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open:        { label: '受付中',      className: 'bg-blue-50 text-blue-700' },
    ai_answered: { label: 'AI回答済',    className: 'bg-purple-50 text-purple-700' },
    matched:     { label: 'マッチング中', className: 'bg-yellow-50 text-yellow-700' },
    matched_c:   { label: 'C対応中',     className: 'bg-orange-50 text-orange-700' },
    solved:      { label: '解決済み',    className: 'bg-green-50 text-green-700' },
    hard:        { label: '🔥高難度',    className: 'bg-red-50 text-red-700' },
  }
  const { label, className } = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}
