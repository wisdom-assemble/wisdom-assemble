'use client'

import { createContext, useContext } from 'react'
import type { Tenant } from '@/lib/supabase/types'

const TenantContext = createContext<Tenant | null>(null)
// middleware.tsが解決した生のテナントID（'root'かどうかの判定用。
// tenantがnullになるケース（DB取得失敗等）と区別するため別コンテキストにしてある）
const TenantIdContext = createContext<string>('debug')

export function TenantProvider({
  tenant,
  tenantId,
  children,
}: {
  tenant: Tenant | null
  tenantId: string
  children: React.ReactNode
}) {
  return (
    <TenantContext.Provider value={tenant}>
      <TenantIdContext.Provider value={tenantId}>
        {/* テナントのカラーテーマをCSS変数で注入 */}
        <style>{`
          :root {
            --color-primary: ${tenantId === 'root' ? '#000000' : (tenant?.color_theme ?? '#4F46E5')};
          }
        `}</style>
        {children}
      </TenantIdContext.Provider>
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}

export function useTenantId() {
  return useContext(TenantIdContext)
}
