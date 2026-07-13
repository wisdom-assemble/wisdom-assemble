import { createBrowserClient } from '@supabase/ssr'

// tenantIdを渡すと、RLS側のテナント絞り込み（current_tenant_id()）が
// 効くようにx-tenant-idヘッダーを付与する。questions/answers/tenant_profiles/
// user_titlesを扱うクライアントコンポーネントでは useTenantId() の値を渡すこと。
export function createClient(tenantId?: string) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    tenantId ? { global: { headers: { 'x-tenant-id': tenantId } } } : undefined
  )
}
