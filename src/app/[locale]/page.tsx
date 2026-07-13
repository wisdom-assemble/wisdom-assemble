import { Suspense } from 'react'
import { getTranslations, getLocale, getMessages } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'
import Tutorial from '@/components/Tutorial'
import PortalHome from '@/components/PortalHome'
import QuestionListSkeleton from '@/components/QuestionListSkeleton'
import LocalDate from '@/components/LocalDate'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import SearchForm from '@/components/SearchForm'
import { getSuggestedKeywords } from '@/lib/skillTags'

const ROOT_TENANT_ID = 'root'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PAGE_SIZE = 25

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr) || 1)

  const tenantId = await getTenantId()
  if (tenantId === ROOT_TENANT_ID) {
    return <PortalHome />
  }

  const t = await getTranslations('home')
  const locale = await getLocale()
  const messages = await getMessages() as { skillTags?: Record<string, string> }
  const skillLabel = (skill: string) => messages.skillTags?.[skill] ?? skill

  const admin = getAdminClient()
  const { data: tenant } = await admin
    .from('tenants')
    .select('name, description, description_i18n')
    .eq('id', tenantId)
    .single()

  const tagline = tenant?.description_i18n?.[locale] ?? tenant?.description

  return (
    <>
      <Header />
      <Tutorial />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        {tagline && (
          <p className="text-gray-500 text-sm mb-6">{tagline}</p>
        )}

        <div className="sticky top-[73px] z-[9] bg-white py-2 flex flex-wrap gap-3 mb-3 border-b border-gray-200">
          <Link
            href="/questions/new"
            className="shrink-0 px-4 py-2 rounded font-medium text-white text-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('postQuestion')}
          </Link>
          <SearchForm key={q} defaultValue={q} />
        </div>

        {!q && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6 text-xs">
            <span className="text-gray-400 shrink-0">{t('suggestedKeywords')}</span>
            {getSuggestedKeywords(tenantId).map((keyword) => (
              <Link
                key={keyword}
                href={`/?q=${encodeURIComponent(keyword)}`}
                className="px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                {skillLabel(keyword)}
              </Link>
            ))}
          </div>
        )}

        <Suspense key={`${tenantId}-${q}-${page}`} fallback={<QuestionListSkeleton />}>
          <QuestionResults tenantId={tenantId} q={q} page={page} locale={locale} t={t} />
        </Suspense>
      </main>
    </>
  )
}

async function QuestionResults({
  tenantId,
  q,
  page,
  locale,
  t,
}: {
  tenantId: string
  q: string
  page: number
  locale: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('questions')
    .select('id, title, title_i18n, slug, status, matched_b_id, matched_c_id, created_at, view_count, profiles!questions_user_id_fkey(username, display_name)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,body.ilike.%${q.trim()}%`)
  }

  const { data: questions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      {q && (
        <p className="text-sm text-gray-500 mb-4">
          {t('searchResult', { query: q, count: count ?? 0 })}
          <Link href="/" className="ml-2 underline text-gray-400 hover:text-gray-600 text-xs">
            {t('clear')}
          </Link>
        </p>
      )}

      {questions && questions.length > 0 ? (
        <>
          <ul className="divide-y divide-gray-100">
            {questions.map((question) => (
              <li key={question.id}>
                <Link
                  href={`/questions/${question.slug}`}
                  className="block py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(question.title_i18n as Record<string, string> | null)?.[locale] ?? question.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(question.profiles as any)?.display_name ?? (question.profiles as any)?.username} ·{' '}
                        <LocalDate iso={question.created_at} locale={locale} />
                      </p>
                    </div>
                    <StatusBadge status={question.status} matchedBId={(question as any).matched_b_id} myId={user?.id} matchedCId={(question as any).matched_c_id} t={t} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} q={q} t={t} />
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          {q ? (
            <p>{t('noMatch', { query: q })}</p>
          ) : (
            <>
              <p>{t('noQuestions')}</p>
              <p className="text-sm mt-1">{t('postFirstQuestion')}</p>
            </>
          )}
        </div>
      )}
    </>
  )
}

function StatusBadge({ status, matchedBId, matchedCId, myId, t }: { status: string; matchedBId?: string | null; matchedCId?: string | null; myId?: string; t: Awaited<ReturnType<typeof getTranslations>> }) {
  // 自分宛の依頼かどうか
  const isMyTask =
    (status === 'open' && matchedBId && matchedBId === myId) ||
    (status === 'matched_c' && matchedCId && matchedCId === myId)

  if (isMyTask) {
    return (
      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
        {t('assignedToYou')}
      </span>
    )
  }

  const map: Record<string, { label: string; className: string }> = {
    open:         { label: t('statusOpen'),          className: 'bg-blue-50 text-blue-700' },
    open_matched: { label: t('statusOpenMatched'),    className: 'bg-yellow-50 text-yellow-700' },
    ai_answered:  { label: t('statusAiAnswered'),     className: 'bg-purple-50 text-purple-700' },
    matched:      { label: t('statusMatched'),        className: 'bg-yellow-50 text-yellow-700' },
    matched_c:    { label: t('statusMatchedC'),       className: 'bg-orange-50 text-orange-700' },
    solved:       { label: t('statusSolved'),         className: 'bg-green-50 text-green-700' },
    hard:         { label: t('statusHard'),           className: 'bg-red-50 text-red-700' },
  }
  const key = status === 'open' && matchedBId ? 'open_matched' : status
  const { label, className } = map[key] ?? map.open
  return (
    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}

function Pagination({ currentPage, totalPages, q, t }: { currentPage: number; totalPages: number; q: string; t: Awaited<ReturnType<typeof getTranslations>> }) {
  const params = (page: number) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (page > 1) p.set('page', String(page))
    return p.toString() ? `/?${p.toString()}` : '/'
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {currentPage > 1 && (
        <Link
          href={params(currentPage - 1)}
          className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          {t('prevPage')}
        </Link>
      )}
      <span className="text-xs text-gray-500">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link
          href={params(currentPage + 1)}
          className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          {t('nextPage')}
        </Link>
      )}
    </div>
  )
}
