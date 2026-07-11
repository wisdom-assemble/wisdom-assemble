import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server'
import { TENANT_NAME_MAP, getPublicSubdomain, LIVE_TENANT_IDS, TENANT_SEARCH_TAGS } from '@/lib/tenantNames'
import PortalGenreGrid from '@/components/PortalGenreGrid'

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

  return (
    <main className="max-w-3xl mx-auto px-4 py-16 w-full">
      <div className="text-center mb-12">
        <h1
          className="mb-3"
          style={{
            display: 'inline-block',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 800,
            fontSize: '32px',
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, #929292 50%, #606060 50%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('title')}
          <span
            style={{
              display: 'inline-block',
              fontFamily: '-apple-system, sans-serif',
              fontWeight: 400,
              fontSize: '11px',
              letterSpacing: 'normal',
              verticalAlign: 'super',
              marginLeft: '-1px',
              color: '#929292',
              WebkitTextFillColor: '#929292',
              background: 'none',
            }}
          >
            ™
          </span>
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">{t('subtitle')}</p>
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
        {t('chooseGenre')}
      </p>

      <PortalGenreGrid
        tenants={Object.entries(TENANT_NAME_MAP).map(([tenantId, label]) => {
          const subdomain = getPublicSubdomain(tenantId)
          const tags = [label.toLowerCase(), tenantId.toLowerCase(), ...(TENANT_SEARCH_TAGS[tenantId] ?? []).map((tag) => tag.toLowerCase())]
          return {
            id: tenantId,
            label,
            href: `https://${subdomain}.wisdomassemble.com`,
            isLive: LIVE_TENANT_IDS.includes(tenantId),
            tags,
          }
        })}
        searchPlaceholder={t('searchPlaceholder')}
        comingSoonLabel={t('comingSoon')}
        noResultsLabel={t('noResults')}
      />

      <div className="mt-16 pt-10 border-t border-gray-100">
        <h2 className="text-sm font-bold tracking-tight text-gray-800 mb-3">{t('aboutTitle')}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{t('aboutBody')}</p>
      </div>
    </main>
  )
}
