import { getTranslations, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { buildStaticPageMetadata } from '@/lib/pageMeta'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'
import HardQuestionList from '@/components/HardQuestionList'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // ルートでは本体が notFound() で「見つかりません」を出すが、このルートには loading.tsx があり
  // 200 を送った後になるのでステータスは404にできない（質問詳細で起きたソフト404と同じ・2026-08-08参照）。
  // どこからもリンクしていないページなので、noindex を付けて検索に出ないようにしておく。
  if ((await getTenantId()) === 'root') return { robots: { index: false, follow: true } }
  return buildStaticPageMetadata(locale, '/hard', 'hardPage', 'title', 'subtitle')
}

export default async function HardQuestPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'unsolved' } = await searchParams
  const t = await getTranslations('hardPage')
  const locale = await getLocale()
  const tenantId = await getTenantId()
  // 【2026-10-07】ルートには高難度が無い（質問はサブドメインにだけある）。空の一覧ページを出さない
  if (tenantId === 'root') notFound()
  const supabase = await createClient()

  const [{ data: unsolved }, { data: solved }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, title, title_i18n, slug, user_id, created_at, view_count, profiles!questions_user_id_fkey(username, display_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'hard')
      .order('created_at', { ascending: false }),
    supabase
      .from('questions')
      .select('id, title, title_i18n, slug, user_id, created_at, updated_at, solved_at, view_count, profiles!questions_user_id_fkey(username, display_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'solved')
      .not('matched_c_id', 'is', null)
      // 解決した時刻で並べる（updated_at は閲覧数の加算や質問者の確認でも変わるため・2026-10-07）
      .order('solved_at', { ascending: false, nullsFirst: false })
      .limit(50),
  ])

  // 表示名は tenant_profiles を正とする（マイページの編集を反映）。
  // 埋め込んだ profiles.display_name を tenant_profiles の値で上書きし、
  // HardQuestionList 側は変更せずに反映させる。
  const allRows = [...(unsolved ?? []), ...(solved ?? [])]
  // 【2026-10-07】タイトルを表示言語に合わせる（それまで /en/hard でも日本語の原文タイトルが出ていた）
  for (const r of allRows as any[]) {
    r.title = r.title_i18n?.[locale] ?? r.title
  }
  const posterIds = [...new Set(allRows.map((r: any) => r.user_id).filter(Boolean))]
  if (posterIds.length > 0) {
    const { data: tpRows } = await supabase
      .from('tenant_profiles')
      .select('user_id, display_name')
      .eq('tenant_id', tenantId)
      .in('user_id', posterIds)
    const nameByUser: Record<string, string> = {}
    for (const row of tpRows ?? []) {
      if (row.display_name) nameByUser[row.user_id] = row.display_name
    }
    for (const r of allRows as any[]) {
      const name = nameByUser[r.user_id]
      if (name) r.profiles = { ...(r.profiles ?? { username: '' }), display_name: name }
    }
  }

  const questions = tab === 'solved' ? (solved ?? []) : (unsolved ?? [])

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
          <p className="text-sm text-gray-500">
            {t('subtitle')}
          </p>
        </div>

        {/* タブ */}
        <div className="flex gap-4 border-b mb-6">
          <Link
            prefetch={false}
            href="/hard?tab=unsolved"
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'unsolved' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabUnsolved')} {unsolved && unsolved.length > 0 && <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{unsolved.length}</span>}
          </Link>
          <Link
            prefetch={false}
            href="/hard?tab=solved"
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'solved' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabSolved')} {solved && solved.length > 0 && <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{solved.length}</span>}
          </Link>
        </div>

        {questions.length > 0 ? (
          <HardQuestionList questions={questions as any} tab={tab as 'unsolved' | 'solved'} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            {tab === 'solved' ? (
              <p>{t('noSolvedYet')}</p>
            ) : (
              <>
                <p>{t('noneYet')}</p>
                <p className="text-sm mt-1">{t('allSolved')}</p>
              </>
            )}
          </div>
        )}
      </main>
    </>
  )
}
