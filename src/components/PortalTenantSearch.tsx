'use client'

import { useState } from 'react'
import SiteLogo from '@/components/SiteLogo'
import { normalizeForSearch } from '@/lib/tenantNames'

type Tenant = {
  tenantId: string
  name: string
  colorTheme: string
  theme?: string | null
  bgColor?: string | null
  href: string
  tagline: string
  tags: string[]
}

type Props = {
  tenants: Tenant[]
  searchPlaceholder: string
  noResultsLabel: string
}

export default function PortalTenantSearch({ tenants, searchPlaceholder, noResultsLabel }: Props) {
  const [query, setQuery] = useState('')
  // tags側は PortalHome で同じ関数を通してある。両側を必ず同じ正規化に通すこと。
  const normalizedQuery = normalizeForSearch(query.trim())

  const visibleTenants = normalizedQuery
    ? tenants.filter((tenant) => tenant.tags.some((tag) => tag.includes(normalizedQuery)))
    : tenants

  return (
    <div>
      {/* 【2026-08-23】検索欄をスクロール追従にする（mtさん指定）。
          top はヘッダーの実測値 --header-h を参照する。Header.tsx が ResizeObserver で
          流し込んでいる値で、ロゴの大きさが違ってもズレない（テナント一覧と同じ方式）。
          ⚠️既定値は 0px。ルートポータルには Header コンポーネントが無く --header-h が
          セットされないため、テナント一覧と同じ 73px を既定にすると「ヘッダーが無いのに
          73px下に貼り付く」＝上に死角ができて、そこを中身が流れていく（実際そうなっていた）。
          将来ルートにヘッダーを付けた場合は --header-h がセットされるので自動で追従する。
          ⚠️ここに数値をベタ書きしないこと。8/22に一覧ページで同じ事故が起きている。
          背景を白で塗らないと、下のカードが透けて文字が重なる。 */}
      <div className="sticky top-[var(--header-h,0px)] z-[9] bg-white pt-1 pb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
        />
      </div>

      {visibleTenants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{noResultsLabel}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visibleTenants.map((tenant) => {
            // ダークテナントのカードは data-theme="dark" を付けるだけで、内部の
            // text-gray/border-gray/hover が globals.css のダーク層で自動追従する。
            // 背景は bg_color（未指定なら既定の暗色）。100テナント時の見た目の変化用。
            const isDark = tenant.theme === 'dark'
            const cardBg = isDark ? (tenant.bgColor || '#14161a') : tenant.bgColor
            return (
              <a
                key={tenant.tenantId}
                href={tenant.href}
                data-theme={isDark ? 'dark' : undefined}
                style={cardBg ? { backgroundColor: cardBg } : undefined}
                className="aspect-square sm:aspect-auto flex flex-col items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-4 sm:px-4 sm:py-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <SiteLogo name={tenant.name} tenantId={tenant.tenantId} colorTheme={tenant.colorTheme} />
                <span className="text-xs text-gray-500 leading-relaxed">{tenant.tagline}</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
