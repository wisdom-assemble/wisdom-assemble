'use client'

import { useState } from 'react'
import SiteLogo from '@/components/SiteLogo'

type Tenant = {
  tenantId: string
  name: string
  colorTheme: string
  href: string
  tagline: string
  tags: string[]
}

type Props = {
  tenants: Tenant[]
  searchPlaceholder: string
  comingSoonLabel: string
  noResultsLabel: string
}

export default function PortalTenantSearch({ tenants, searchPlaceholder, comingSoonLabel, noResultsLabel }: Props) {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visibleTenants.map((tenant) => (
            <a
              key={tenant.tenantId}
              href={tenant.href}
              className="flex flex-col items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <SiteLogo name={tenant.name} tenantId={tenant.tenantId} colorTheme={tenant.colorTheme} />
              <span className="text-xs text-gray-500 leading-relaxed">{tenant.tagline}</span>
            </a>
          ))}

          {!normalizedQuery && (
            <div className="flex items-center justify-center border border-gray-100 rounded-lg px-4 py-8 text-center bg-gray-50 text-gray-300 select-none">
              <span className="text-sm font-medium">{comingSoonLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
