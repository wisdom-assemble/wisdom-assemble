import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_SUBDOMAINS = [
  'debug', 'tax-japan', 'australia-whv', 'bali',
  'chiangmai', 'portugal', 'dtm', 'keyboard',
  'philippines', 'canada',
]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // --- テナント解決 ---
  const host = request.headers.get('host') ?? ''
  let tenantId = 'debug' // 開発デフォルト

  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    const subdomain = host.split('.')[0]
    if (VALID_SUBDOMAINS.includes(subdomain)) {
      tenantId = subdomain
    }
  } else {
    // 開発用: ?tenant=xxx or x-tenant-id header
    const paramTenant = request.nextUrl.searchParams.get('tenant')
    const headerTenant = request.headers.get('x-tenant-id')
    if (paramTenant && VALID_SUBDOMAINS.includes(paramTenant)) {
      tenantId = paramTenant
    } else if (headerTenant && VALID_SUBDOMAINS.includes(headerTenant)) {
      tenantId = headerTenant
    }
  }

  response.headers.set('x-tenant-id', tenantId)

  // --- Supabase セッション更新 ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションをリフレッシュ（期限切れトークン対応）
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
