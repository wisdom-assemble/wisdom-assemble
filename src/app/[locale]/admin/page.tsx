import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { QuestionList, UserList } from './AdminActions'
import AdminSummary, { DashboardStats } from './AdminSummary'
import AdminVisitors from './AdminVisitors'
import { getVisitorStats } from '@/lib/cloudflareAnalytics'

const ADMIN_EMAIL = 'wisdomassemble@gmail.com'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // 認証はcookieベースのユーザークライアントで確認する
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const { tab = 'summary' } = await searchParams

  // 訪問者データ（Cloudflare Web Analytics）はそのタブを開いたときだけ取得する
  const visitorStats = tab === 'visitors' ? await getVisitorStats(30) : null

  // データ読み取りは service_role（RLSを迂回して全テナントを串刺しで取得する）。
  // 通常のユーザークライアントだと questions_read 等のRLSで「現在のサブドメイン
  // 1テナント分」に絞られてしまうため、必ず admin クライアントを使うこと。
  const admin = createAdminClient()

  const [
    { data: statsRaw },
    { data: tenants },
    { data: questions },
    { data: profiles },
  ] = await Promise.all([
    admin.rpc('admin_dashboard_stats'),
    admin.from('tenants').select('id, name, color_theme'),
    admin
      .from('questions')
      .select('id, slug, title, status, tenant_id, created_at, user_id, matched_b_id')
      .order('created_at', { ascending: false })
      .limit(200),
    admin
      .from('profiles')
      .select('id, username, is_banned, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  // RPCが旧シェイプ(migration未適用)を返してもクラッシュしないよう既定値でマージ補完する
  const raw = (statsRaw ?? {}) as Partial<DashboardStats>
  const stats: DashboardStats = {
    totals: {
      questions: 0, users: 0, answers: 0, ai_answers: 0, human_answers: 0,
      solved: 0, unsolved: 0, hard: 0, views: 0, tenant_count: 0, tenant_registered: 0, routed: 0,
      ...(raw.totals ?? {}),
    },
    per_tenant: raw.per_tenant ?? [],
    dau: raw.dau ?? [],
    mau: raw.mau ?? [],
    tags: raw.tags ?? [],
    ai_today: { calls: 0, cost_usd: 0, cap: 60, cap_enabled: false, ...(raw.ai_today ?? {}) },
    revenue: raw.revenue ?? { total_jpy: 0, by_source: {} },
  }

  const colorMap: Record<string, string> = {}
  for (const t of tenants ?? []) colorMap[t.id] = t.color_theme

  // 表示名・回答数はテナント別（tenant_profiles）に移行済みなので、
  // 旧 profiles の凍結カラムではなく tenant_profiles から解決する。
  const questionRows = questions ?? []
  const profileRows = profiles ?? []
  const userIds = Array.from(
    new Set([
      ...questionRows.map((q) => q.user_id),
      ...profileRows.map((p) => p.id),
    ].filter(Boolean) as string[])
  )

  const nameMap = new Map<string, string>()       // `${tenant_id}:${user_id}` -> 表示名
  const answerCountMap = new Map<string, number>() // user_id -> 全テナント合計回答数
  const anyNameMap = new Map<string, string>()     // user_id -> いずれかの表示名（ユーザー一覧用）

  if (userIds.length > 0) {
    const { data: tps } = await admin
      .from('tenant_profiles')
      .select('tenant_id, user_id, display_name, username, answer_count')
      .in('user_id', userIds)
    for (const tp of tps ?? []) {
      const label = tp.display_name || tp.username || `user_${String(tp.user_id).slice(0, 6)}`
      nameMap.set(`${tp.tenant_id}:${tp.user_id}`, label)
      if (!anyNameMap.has(tp.user_id)) anyNameMap.set(tp.user_id, label)
      answerCountMap.set(tp.user_id, (answerCountMap.get(tp.user_id) ?? 0) + (tp.answer_count ?? 0))
    }
  }

  const questionsForList = questionRows.map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    status: q.status,
    tenant_id: q.tenant_id,
    created_at: q.created_at,
    matched_b_id: q.matched_b_id,
    posterName: nameMap.get(`${q.tenant_id}:${q.user_id}`) ?? `user_${String(q.user_id).slice(0, 6)}`,
  }))

  const usersForList = profileRows.map((p) => ({
    id: p.id,
    username: p.username,
    display_name: anyNameMap.get(p.id) ?? null,
    answer_count: answerCountMap.get(p.id) ?? 0,
    is_banned: p.is_banned,
    created_at: p.created_at,
  }))

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">admin only · 全テナント</span>
        </div>

        <div className="flex gap-4 border-b mb-6">
          <TabLink href="/admin?tab=summary" active={tab === 'summary'} label="サマリー" />
          <TabLink href="/admin?tab=visitors" active={tab === 'visitors'} label="訪問者" />
          <TabLink href="/admin?tab=questions" active={tab === 'questions'} label="質問一覧" />
          <TabLink href="/admin?tab=users" active={tab === 'users'} label="ユーザー一覧" />
        </div>

        {tab === 'summary' && <AdminSummary stats={stats} colorMap={colorMap} />}
        {tab === 'visitors' && visitorStats && <AdminVisitors stats={visitorStats} />}
        {tab === 'questions' && <QuestionList questions={questionsForList} adminUserId={user.id} />}
        {tab === 'users' && <UserList profiles={usersForList} adminUserId={user.id} />}
      </main>
    </>
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
