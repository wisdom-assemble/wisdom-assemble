'use client'

import { useState } from 'react'
import SiteLogo from '@/components/SiteLogo'

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
  const normalizedQuery = query.trim().toLowerCase()

  const visibleTenants = normalizedQuery
    ? tenants.filter((tenant) => tenant.tags.some((tag) => tag.includes(normalizedQuery)))
    : tenants

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
      />

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
