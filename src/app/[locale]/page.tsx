import { Suspense } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, getLocale, getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
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

// ホームのhreflang/canonical。UIは全8言語対応のため全ロケールを相互リンクする。
// タイトル・説明文はレイアウトのgenerateMetadataが提供するのでここでは指定しない。
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') ?? 'bug.wisdomassemble.com'
  const locale = await getLocale()
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) languages[loc] = `https://${host}/${loc}`
  languages['x-default'] = `https://${host}/${routing.defaultLocale}`
  return {
    alternates: {
      canonical: `https://${host}/${locale}`,
      languages,
    },
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tag?: string }>
}) {
  const { q = '', page: pageStr = '1', tag = '' } = await searchParams
  const page = Math.max(1, parseInt(pageStr) || 1)

  const tenantId = await getTenantId()
  if (tenantId === ROOT_TENANT_ID) {
    return <PortalHome />
  }

  const t = await getTranslations('home')
  const tBrand = await getTranslations('brand')
  const locale = await getLocale()
  const messages = await getMessages() as {
    skillTags?: Record<string, string>
    searchKeywords?: Record<string, string>
  }
  // 検索チップは「表示ラベル」と「検索語」が同じ文字列である必要がある。
  // 以前は表示だけ翻訳して検索値は日本語のままだったため、英語UIで "Effects pedals" を
  // 押すと検索欄に「エフェクター」と出ていた（2026-08-15にユーザー指摘・全テナントで発生）。
  // searchKeywords は skillTags と別に持つ。skillTagsは「得意なこと」の名前として自然な
  // 語（例: Effects pedals）だが、検索は部分一致なので短い単語（例: Pedal）の方が当たる。
  // 未定義なら skillTags → 生のキーの順にフォールバックする。
  const keywordLabel = (kw: string) =>
    messages.searchKeywords?.[kw] ?? messages.skillTags?.[kw] ?? kw

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
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-8 w-full">
        {/* 【2026-08-22】キャッチコピーはテナント説明文の「上」。
            スマホは2行・PCは1行（改行の扱いはPortalHome.tsx側のコメント参照）。
            サイズはルート(text-lg/xl)より1段小さい text-base/lg。テナントはロゴが主役なので
            コピーを一段落とす、というmtさんの指定（2026-08-22）。 */}
        <p className="whitespace-pre-line sm:whitespace-normal text-base sm:text-lg font-medium text-gray-800 leading-snug mb-1.5">
          {tBrand('catchcopy')}
        </p>
        {tagline && (
          <p className="text-gray-500 text-xs sm:text-[13px] mb-4">{tagline}</p>
        )}

        {/* 【2026-08-22】top を固定値からヘッダー実測値(--header-h)に変更。
            73pxは開発デフォルトのBUG DEBUGの高さで、ロゴが大きいテナントでは
            この行がヘッダーの下に潜り「+質問する」と検索欄が隠れていた（guitarで32px）。
            変数はHeader.tsxがResizeObserverで流し込む。JS実行前とSSR時のために73pxを既定値に残す。 */}
        <div className="sticky top-[var(--header-h,73px)] z-[9] bg-white py-2 flex flex-wrap gap-3 mb-3 border-b border-gray-200">
          <Link
            prefetch={false}
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
                prefetch={false}
                key={keyword}
                href={`/?q=${encodeURIComponent(keywordLabel(keyword))}`}
                className="px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                {keywordLabel(keyword)}
              </Link>
            ))}
          </div>
        )}

        <Suspense key={`${tenantId}-${q}-${tag}-${page}`} fallback={<QuestionListSkeleton />}>
          <QuestionResults tenantId={tenantId} q={q} tag={tag} page={page} locale={locale} t={t} />
        </Suspense>
      </main>
    </>
  )
}

async function QuestionResults({
  tenantId,
  q,
  tag,
  page,
  locale,
  t,
}: {
  tenantId: string
  q: string
  tag: string
  page: number
  locale: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('questions')
    .select('id, title, title_i18n, slug, status, user_id, tags, matched_b_id, matched_c_id, created_at, view_count, profiles!questions_user_id_fkey(username, display_name)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q.trim()) {
    // PostgRESTのor()はカンマで条件を区切り、括弧でグループ化するため、
    // 検索語にこれらが入ると条件が壊れる。空白に潰してから埋め込む。
    const safeQ = q.trim().replace(/[,()]/g, ' ')
    // 閲覧中の言語の翻訳も検索対象にする。
    // これが無いと、投稿された元言語（seedは全部日本語）でしか当たらず、
    // 英語UIで英語の語を検索しても必ず0件になっていた（2026-08-15に実データで確認）。
    // 全言語をまとめて検索すると他言語の質問まで拾ってしまうため、現在のロケールだけに絞る。
    const conds = [`title.ilike.%${safeQ}%`, `body.ilike.%${safeQ}%`]
    // localeはフィルタ文字列にそのまま埋まるので、既知のロケール以外は絶対に通さない
    if ((routing.locales as readonly string[]).includes(locale)) {
      conds.push(`title_i18n->>${locale}.ilike.%${safeQ}%`)
      conds.push(`body_i18n->>${locale}.ilike.%${safeQ}%`)
    }
    query = query.or(conds.join(','))
  }
  if (tag.trim()) {
    // タグ配列に指定タグを含む質問だけ（No.34タグフィルター）
    query = query.contains('tags', [tag.trim()])
  }

  const { data: questions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // 表示名は tenant_profiles を正とする（マイページの編集を反映）。
  // questions に埋め込んだ profiles.username は既定名のフォールバックとして使う。
  const posterIds = [...new Set((questions ?? []).map((qq: any) => (qq as any).user_id).filter(Boolean))]
  const displayNameByUser: Record<string, string> = {}
  if (posterIds.length > 0) {
    const { data: tpRows } = await supabase
      .from('tenant_profiles')
      .select('user_id, display_name')
      .eq('tenant_id', tenantId)
      .in('user_id', posterIds)
    for (const row of tpRows ?? []) {
      if (row.display_name) displayNameByUser[row.user_id] = row.display_name
    }
  }

  return (
    <>
      {q && (
        <p className="text-sm text-gray-500 mb-4">
          {t('searchResult', { query: q, count: count ?? 0 })}
          <Link prefetch={false} href="/" className="ml-2 underline text-gray-400 hover:text-gray-600 text-xs">
            {t('clear')}
          </Link>
        </p>
      )}

      {tag && (
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs">#{tag}</span>
          <Link prefetch={false} href="/" className="underline text-gray-400 hover:text-gray-600 text-xs">
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
                  prefetch={false}
                  href={`/questions/${question.slug}`}
                  className="block py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(question.title_i18n as Record<string, string> | null)?.[locale] ?? question.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {displayNameByUser[(question as any).user_id] ?? (question.profiles as any)?.username} ·{' '}
                        <LocalDate iso={question.created_at} locale={locale} />
                      </p>
                    </div>
                    <StatusBadge status={question.status} matchedBId={(question as any).matched_b_id} myId={user?.id} matchedCId={(question as any).matched_c_id} t={t} />
                  </div>
                </Link>
                {Array.isArray((question as any).tags) && (question as any).tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5 mb-1.5 px-2">
                    {(question as any).tags.slice(0, 3).map((tg: string) => (
                      <Link
                        prefetch={false}
                        key={tg}
                        href={`/?tag=${encodeURIComponent(tg)}`}
                        className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                      >
                        {tg}
                      </Link>
                    ))}
                  </div>
                )}
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
          prefetch={false}
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
          prefetch={false}
          href={params(currentPage + 1)}
          className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          {t('nextPage')}
        </Link>
      )}
    </div>
  )
}
