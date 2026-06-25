'use client'

import { createContext, useContext } from 'react'
import type { Tenant } from '@/lib/supabase/types'

const TenantContext = createContext<Tenant | null>(null)

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant | null
  children: React.ReactNode
}) {
  return (
    <TenantContext.Provider value={tenant}>
      {/* テナントのカラーテーマをCSS変数で注入 */}
      <style>{`
        :root {
          --color-primary: ${tenant?.color_theme ?? '#4F46E5'};
        }
      `}</style>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
