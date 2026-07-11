'use client'

import { useState } from 'react'

type Tenant = {
  id: string
  label: string
  href: string
  isLive: boolean
  tags: string[]
}

type Props = {
  tenants: Tenant[]
  searchPlaceholder: string
  comingSoonLabel: string
  noResultsLabel: string
}

export default function PortalGenreGrid({ tenants, searchPlaceholder, comingSoonLabel, noResultsLabel }: Props) {
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
            if (!tenant.isLive) {
              return (
                <div
                  key={tenant.id}
                  className="relative border border-gray-100 rounded-lg p-4 text-center bg-gray-50 text-gray-300 cursor-not-allowed select-none"
                >
                  <span className="text-sm font-bold tracking-tight">{tenant.label}</span>
                  <span className="block text-[10px] mt-1 text-gray-300">{comingSoonLabel}</span>
                </div>
              )
            }

            return (
              <a
                key={tenant.id}
                href={tenant.href}
                className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-bold tracking-tight text-gray-800">{tenant.label}</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
