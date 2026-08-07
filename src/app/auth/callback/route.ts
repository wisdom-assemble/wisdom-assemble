import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ログインしたテナントの「住人」として tenant_profiles に行を作る。
 *
 * なぜ必要か:
 *   マッチング(src/lib/matching.ts)は tenant_profiles の行がある人だけを候補にする。
 *   従来この行は「マイページ保存」「質問投稿」「回答」でしか作られなかったため、
 *   ログインしただけの人は候補に入らず、他に候補がいないと質問が誰にも割り当て
 *   られないまま高難度へ落ちていた（＝答えられる人がいるのに機会を奪っていた）。
 *
 * なぜログイン時か（テナント横断にしない理由）:
 *   認証アカウント(auth.users)は同一メールなら全テナントで1つなので、「ログイン済み
 *   ユーザー」を条件にすると、一度も見たことがないジャンルの質問が割り当てられ通知まで
 *   届いてしまう。各テナントは独立したサービスとして見せる方針なので、
 *   「そのテナントでログインした」という行為をもって、そのテナントの住人とする。
 *   （セッションCookieはdomain未指定＝ホスト個別なので、テナントごとにログインが
 *    必要になり、この判定が自然に成立する。ログアウトも scope:'local' で
 *    そのテナントのみ終了させている＝Header.tsx）
 *
 * 安全性:
 *   - ignoreDuplicates で既存行は一切書き換えない
 *     （is_available=false にしている人を勝手に有効へ戻さないため）
 *   - 失敗してもログインは成功させる（この登録は付随処理であり、認証の妨げにしない）
 */
async function ensureTenantMembership(userId: string, tenantId: string) {
  if (!tenantId || tenantId === 'root') return
  try {
    const admin = createAdminClient()
    await admin
      .from('tenant_profiles')
      .upsert(
        { tenant_id: tenantId, user_id: userId },
        { onConflict: 'tenant_id,user_id', ignoreDuplicates: true }
      )
  } catch (e) {
    console.error('ensureTenantMembership error:', e)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // オープンリダイレクト防止: 自サイト内の相対パスのみ許可する。
  // "//evil.com"（プロトコル相対）・"/\evil.com"・"http://..." 等の外部誘導を弾く。
  const rawNext = searchParams.get('next') ?? '/'
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')
      ? rawNext
      : '/'

  if (code) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(new URL(next, request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // middleware が検証済みのテナントIDを request ヘッダーに載せている
      // （/auth/callback は UNLOCALIZED_PREFIXES だが、x-tenant-id はその前に
      //  設定されるので届く。middleware.ts:116）
      const tenantId = request.headers.get('x-tenant-id')
      const userId = data?.user?.id
      if (userId && tenantId) {
        await ensureTenantMembership(userId, tenantId)
      }
      return response
    }
  }

  return NextResponse.redirect(new URL('/?error=auth', request.url))
}
