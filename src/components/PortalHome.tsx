import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPublicSubdomain, TENANT_SEARCH_TAGS, TENANT_NAME_MAP } from '@/lib/tenantNames'
import PortalTenantSearch from '@/components/PortalTenantSearch'
import PortalLanguageSwitcher from '@/components/PortalLanguageSwitcher'
import WisdomAssembleWordmark from '@/components/WisdomAssembleWordmark'

// AdSense/Stripe Connect審査用バージョンでは、審査を混乱させないよう
// 実際に稼働中の2テナントのみをカード表示する（他ジャンルへの言及なし）。
// 検索バー自体はPortalTenantSearchで維持しつつ、対象を2テナントに絞っている。
// 審査通過後、残りのテナントを追加していく際はこの配列に追加していくだけでよい。
const REVIEW_TENANT_IDS = ['debug', 'dtm']

// DB取得が万一失敗した場合の保険（本来はtenants.color_themeが正）
const FALLBACK_COLOR_THEME: Record<string, string> = {
  debug: '#10B981',
  dtm: '#2563EB',
}

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// wisdomassemble.com（ルートドメイン）専用のポータルページ。
// 各ジャンル別サブドメインへの入口。まだCloudflareのCustom Domain設定が
// 済んでいないテナントは「準備中」バッジを表示し、リンクを無効化する。
export default async function PortalHome() {
  // このコンポーネント単体では動的APIを呼ばないため、呼び出し元次第では
  // 静的レンダリング扱いになりgetTranslations()がdefaultLocaleにフォール
  // バックする可能性がある（既知のnext-intlの罠）。明示的にlocaleを確定させる。
  const locale = await getLocale()
  setRequestLocale(locale)
  const t = await getTranslations('portalPage')
  const tProfile = await getTranslations('profilePage')

  const admin = getAdminClient()
  // page.tsxのタグライン取得と同じ .eq(...).single() の形に揃える
  // （.in()での一括取得だと本番で稀に color_theme が取得できないことがあったため）
  const results = await Promise.all(
    REVIEW_TENANT_IDS.map((tenantId) =>
      admin.from('tenants').select('id, name, color_theme').eq('id', tenantId).single()
    )
  )

  const cards = REVIEW_TENANT_IDS.map((tenantId, i) => {
    const { data: tenant, error } = results[i]
    if (error) {
      console.error(`[PortalHome] tenants fetch failed for ${tenantId}:`, error.message)
    }
    const label = TENANT_NAME_MAP[tenantId] ?? tenantId
    const tags = [label.toLowerCase(), tenantId.toLowerCase(), ...(TENANT_SEARCH_TAGS[tenantId] ?? []).map((tag) => tag.toLowerCase())]
    return {
      tenantId,
      name: tenant?.name ?? tenantId,
      colorTheme: tenant?.color_theme ?? FALLBACK_COLOR_THEME[tenantId],
      href: `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com`,
      tagline: t(tenantId === 'debug' ? 'debugCardTagline' : 'dtmCardTagline'),
      tags,
    }
  })

  return (
    <main className="max-w-3xl mx-auto px-4 pt-5 pb-16 sm:py-16 w-full">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="mb-3">
          <WisdomAssembleWordmark fontSize={32} />
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">{t('subtitle')}</p>
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
        {t('chooseGenre')}
      </p>

      <PortalTenantSearch
        tenants={cards}
        searchPlaceholder={t('searchPlaceholder')}
        noResultsLabel={t('noResults')}
      />

      <div className="mt-16 pt-10 border-t border-gray-100">
        <PortalLanguageSwitcher currentLocale={locale} label={tProfile('languageLabel')} />
      </div>
    </main>
  )
}
