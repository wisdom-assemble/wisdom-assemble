import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server'
import { TENANT_NAME_MAP, getPublicSubdomain, LIVE_TENANT_IDS } from '@/lib/tenantNames'

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
        <h1 className="text-3xl font-bold tracking-tight mb-3">{t('title')}</h1>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">{t('subtitle')}</p>
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
        {t('chooseGenre')}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(TENANT_NAME_MAP).map(([tenantId, label]) => {
          const isLive = LIVE_TENANT_IDS.includes(tenantId)
          const subdomain = getPublicSubdomain(tenantId)
          const href = `https://${subdomain}.wisdomassemble.com`

          if (!isLive) {
            return (
              <div
                key={tenantId}
                className="relative border border-gray-100 rounded-lg p-4 text-center bg-gray-50 text-gray-300 cursor-not-allowed select-none"
              >
                <span className="text-sm font-bold tracking-tight">{label}</span>
                <span className="block text-[10px] mt-1 text-gray-300">{t('comingSoon')}</span>
              </div>
            )
          }

          return (
            <a
              key={tenantId}
              href={href}
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-bold tracking-tight text-gray-800">{label}</span>
            </a>
          )
        })}
      </div>
    </main>
  )
}
