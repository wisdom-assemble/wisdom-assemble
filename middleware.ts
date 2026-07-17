import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

// ロケールプレフィックスの対象外（[locale]配下に存在しないルート）
const UNLOCALIZED_PREFIXES = ['/api', '/auth/callback', '/icon', '/opengraph-image', '/sitemap.xml', '/robots.txt']

const VALID_SUBDOMAINS = [
  'debug', 'tax-japan', 'australia-whv', 'bali',
  'chiangmai', 'portugal', 'dtm', 'keyboard',
  'philippines', 'canada',
]

// 公開URL用のサブドメインエイリアス（内部のテナントID・DB主キーは変更しない）
// ルール: 公開ドメイン名はテナント表示名（TENANT_NAME_MAP）に合わせる
const SUBDOMAIN_ALIASES: Record<string, string> = {
  bug: 'debug',
  'music-prod': 'dtm',
}

// 内部ID → 公開サブドメインの逆引き。内部ID(debug/dtm)へ直アクセスされた場合に
// 公開URL(bug/music-prod)へ301で寄せ、重複コンテンツ（別ホストで同一内容）を防ぐ。
const PUBLIC_ALIAS_BY_INTERNAL: Record<string, string> = Object.fromEntries(
  Object.entries(SUBDOMAIN_ALIASES).map(([pub, internal]) => [internal, pub])
)

// ルートドメイン（サブドメインなし）はテナントQ&Aではなく、
// 各ジャンル別サブドメインへの入口ポータルを表示する特別扱いのID
const ROOT_TENANT_ID = 'root'
const ROOT_HOSTS = ['wisdomassemble.com', 'www.wisdomassemble.com']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isUnlocalized = UNLOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // --- テナント解決 ---
  const host = request.headers.get('host') ?? ''

  // 内部ID直アクセス(debug./dtm.)は公開エイリアス(bug./music-prod.)へ301リダイレクト。
  // 同一内容が2ホストでインデックスされる重複コンテンツを防ぐ。
  if (!host.includes('localhost') && !host.includes('127.0.0.1') && !ROOT_HOSTS.includes(host)) {
    const rawSub = host.split('.')[0]
    const publicSub = PUBLIC_ALIAS_BY_INTERNAL[rawSub]
    if (publicSub) {
      const newHost = `${publicSub}.${host.split('.').slice(1).join('.')}`
      return NextResponse.redirect(
        `https://${newHost}${request.nextUrl.pathname}${request.nextUrl.search}`,
        301
      )
    }
  }

  let tenantId = 'debug' // 開発デフォルト・未知のホストのフォールバック

  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    if (ROOT_HOSTS.includes(host)) {
      tenantId = ROOT_TENANT_ID
    } else {
      const subdomain = SUBDOMAIN_ALIASES[host.split('.')[0]] ?? host.split('.')[0]
      if (VALID_SUBDOMAINS.includes(subdomain)) {
        tenantId = subdomain
      }
    }
  } else {
    // 開発用: ?tenant=xxx or x-tenant-id header（rootポータルのテストも可能にする）
    const paramTenant = request.nextUrl.searchParams.get('tenant')
    const headerTenant = request.headers.get('x-tenant-id')
    const isValidOrRoot = (v: string | null): v is string =>
      v === ROOT_TENANT_ID || (!!v && VALID_SUBDOMAINS.includes(v))
    if (isValidOrRoot(paramTenant)) {
      tenantId = paramTenant
    } else if (isValidOrRoot(headerTenant)) {
      tenantId = headerTenant
    }
  }

  // next-intlミドルウェアを呼ぶ前にrequest.headersへ直接書き込んでおく。
  // next-intlは内部で`new Headers(request.headers)`により現在のヘッダーを
  // 複製した上でX-NEXT-INTL-LOCALEを追加してNextResponse.next/rewriteに渡すため、
  // ここで先にx-tenant-idを設定しておけば、next-intlが生成するレスポンスの
  // 書き換え済みrequestヘッダーに両方とも含まれ、下流のServer Componentsに届く。
  // （以前はここでintl呼び出し後に全く別のNextResponse.nextを作り直しており、
  // next-intlが設定したX-NEXT-INTL-LOCALEが失われ、ソフトナビゲーションで
  // レイアウトが再実行されない場合にgetLocale()がdefaultLocaleへフォールバック
  // してしまう不具合の原因だった）
  request.headers.set('x-tenant-id', tenantId)

  // --- ロケール解決（next-intl） ---
  // /api・/auth/callbackは[locale]配下に存在しないルートなのでスキップする
  let response: NextResponse
  if (!isUnlocalized) {
    response = intlMiddleware(request)
    // ロケール未指定URLへのアクセスはプレフィックス付きURLへリダイレクトする
    if (response.status >= 300 && response.status < 400) {
      return response
    }
  } else {
    response = NextResponse.next({
      request: { headers: request.headers },
    })
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
