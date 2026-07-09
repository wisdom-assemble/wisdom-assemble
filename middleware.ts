import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

// ロケールプレフィックスの対象外（[locale]配下に存在しないルート）
const UNLOCALIZED_PREFIXES = ['/api', '/auth/callback']

const VALID_SUBDOMAINS = [
  'debug', 'tax-japan', 'australia-whv', 'bali',
  'chiangmai', 'portugal', 'dtm', 'keyboard',
  'philippines', 'canada',
]

// 公開URL用のサブドメインエイリアス（内部のテナントID・DB主キーは変更しない）
const SUBDOMAIN_ALIASES: Record<string, string> = {
  bug: 'debug',
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isUnlocalized = UNLOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // --- ロケール解決（next-intl） ---
  // /api・/auth/callbackは[locale]配下に存在しないルートなのでスキップする
  let intlResponse: NextResponse | null = null
  if (!isUnlocalized) {
    intlResponse = intlMiddleware(request)
    // ロケール未指定URLへのアクセスはプレフィックス付きURLへリダイレクトする
    if (intlResponse.status >= 300 && intlResponse.status < 400) {
      return intlResponse
    }
  }

  // --- テナント解決 ---
  const host = request.headers.get('host') ?? ''
  let tenantId = 'debug' // 開発デフォルト・未知のホストのフォールバック

  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    const subdomain = SUBDOMAIN_ALIASES[host.split('.')[0]] ?? host.split('.')[0]
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

  // ダウンストリーム（Server Components）にも実際に伝わるよう、
  // request.headers自体を書き換えてからNextResponse.nextに渡す
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenantId)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  if (intlResponse) {
    intlResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
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
