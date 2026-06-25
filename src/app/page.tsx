import Link from 'next/link'
import Header from '@/components/Header'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const [{ data: questions }, { data: tenant }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, title, slug, status, created_at, view_count, profiles(username, display_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('tenants')
      .select('name, description')
      .eq('id', tenantId)
      .single(),
  ])

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">{tenant?.name ?? 'Wisdom Assemble'}</h1>
          <p className="text-gray-500 text-sm">{tenant?.description}</p>
        </div>

        <div className="mb-6">
          <Link
            href="/questions/new"
            className="inline-block px-4 py-2 rounded font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + 質問する
          </Link>
        </div>

        {questions && questions.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="block py-4 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{q.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(q.profiles as any)?.display_name ?? (q.profiles as any)?.username} ·{' '}
                        {new Date(q.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>まだ質問がありません</p>
            <p className="text-sm mt-1">最初の質問を投稿してみましょう</p>
          </div>
        )}
      </main>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open:        { label: '受付中',      className: 'bg-blue-50 text-blue-700' },
    ai_answered: { label: 'AI回答済',    className: 'bg-purple-50 text-purple-700' },
    matched:     { label: 'マッチング中', className: 'bg-yellow-50 text-yellow-700' },
    solved:      { label: '解決済み',    className: 'bg-green-50 text-green-700' },
    hard:        { label: '高難易度',    className: 'bg-red-50 text-red-700' },
  }
  const { label, className } = map[status] ?? map.open
  return (
    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}
