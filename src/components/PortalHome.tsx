import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPublicSubdomain } from '@/lib/tenantNames'
import SiteLogo from '@/components/SiteLogo'

// AdSense/Stripe Connect審査用バージョンでは、審査を混乱させないよう
// 実際に稼働中の2テナントのみをカード表示する（他ジャンルへの言及なし）。
// 審査通過後、残りのテナントを追加していく段階で PortalGenreGrid（検索付きグリッド）
// に戻す想定。コンポーネント自体は src/components/PortalGenreGrid.tsx に残してある。
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
    return {
      tenantId,
      name: tenant?.name ?? tenantId,
      colorTheme: tenant?.color_theme ?? FALLBACK_COLOR_THEME[tenantId],
      href: `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com`,
      tagline: t(tenantId === 'debug' ? 'debugCardTagline' : 'dtmCardTagline'),
    }
  })

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <a
            key={card.tenantId}
            href={card.href}
            className="flex flex-col items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <SiteLogo name={card.name} tenantId={card.tenantId} colorTheme={card.colorTheme} />
            <span className="text-xs text-gray-500 leading-relaxed">{card.tagline}</span>
          </a>
        ))}

        <div className="flex items-center justify-center border border-gray-100 rounded-lg px-4 py-8 text-center bg-gray-50 text-gray-300 select-none">
          <span className="text-sm font-medium">{t('comingSoon')}</span>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t border-gray-100">
        <h2 className="text-sm font-bold tracking-tight text-gray-800 mb-3">{t('aboutTitle')}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{t('aboutBody')}</p>
      </div>
    </main>
  )
}
