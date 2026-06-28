import Link from 'next/link'
import Header from '@/components/Header'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/SearchForm'

const PAGE_SIZE = 20

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const tenantId = await getTenantId()
  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select('id, title, slug, status, matched_b_id, created_at, view_count, profiles!questions_user_id_fkey(username, display_name)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,body.ilike.%${q.trim()}%`)
  }

  const [{ data: questions, count }, { data: tenant }] = await Promise.all([
    query,
    supabase.from('tenants').select('name, description').eq('id', tenantId).single(),
  ])

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{tenant?.name ?? 'Wisdom Assemble'}</h1>
          <p className="text-gray-500 text-sm">{tenant?.description}</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Link
            href="/questions/new"
            className="shrink-0 px-4 py-2 rounded font-medium text-white text-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + 質問する
          </Link>
          <SearchForm defaultValue={q} />
        </div>

        {q && (
          <p className="text-sm text-gray-500 mb-4">
            「{q}」の検索結果 — {count ?? 0}件
            <Link href="/" className="ml-2 underline text-gray-400 hover:text-gray-600 text-xs">
              クリア
            </Link>
          </p>
        )}

        {questions && questions.length > 0 ? (
          <>
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
                      <StatusBadge status={q.status} matchedBId={(q as any).matched_b_id} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} q={q} />
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            {q ? (
              <p>「{q}」に一致する質問が見つかりませんでした</p>
            ) : (
              <>
                <p>まだ質問がありません</p>
                <p className="text-sm mt-1">最初の質問を投稿してみましょう</p>
              </>
            )}
          </div>
        )}
      </main>
    </>
  )
}

function StatusBadge({ status, matchedBId }: { status: string; matchedBId?: string | null }) {
  const map: Record<string, { label: string; className: string }> = {
    open:        { label: '受付中',          className: 'bg-blue-50 text-blue-700' },
    open_matched: { label: 'メンバー対応中', className: 'bg-yellow-50 text-yellow-700' },
    ai_answered: { label: 'AI回答済',        className: 'bg-purple-50 text-purple-700' },
    matched:     { label: 'メンバー対応中',   className: 'bg-yellow-50 text-yellow-700' },
    matched_c:   { label: '別メンバー対応中', className: 'bg-orange-50 text-orange-700' },
    solved:      { label: '解決済み',         className: 'bg-green-50 text-green-700' },
    hard:        { label: '🔥みんなで解決',   className: 'bg-red-50 text-red-700' },
  }
  const key = status === 'open' && matchedBId ? 'open_matched' : status
  const { label, className } = map[key] ?? map.open
  return (
    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}

function Pagination({ currentPage, totalPages, q }: { currentPage: number; totalPages: number; q: string }) {
  const params = (page: number) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (page > 1) p.set('page', String(page))
    return p.toString() ? `/?${p.toString()}` : '/'
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={params(currentPage - 1)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          ← 前へ
        </Link>
      )}
      <span className="text-sm text-gray-500">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link
          href={params(currentPage + 1)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          次へ →
        </Link>
      )}
    </div>
  )
}
