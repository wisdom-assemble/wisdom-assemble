import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

// x-tenant-idをSupabaseへのリクエストヘッダーとして転送し、RLS側の
// テナント絞り込み（current_tenant_id()）が機能するようにする。
// アプリ側のクエリでtenant_idの絞り込みを書き忘れても、DB側で
// 別テナントの行が返らないようにするための保険。
export async function createClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: tenantId ? { headers: { 'x-tenant-id': tenantId } } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component から呼ばれた場合は無視
          }
        },
      },
    }
  )
}
