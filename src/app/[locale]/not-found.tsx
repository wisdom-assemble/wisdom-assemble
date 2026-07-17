import { cookies } from 'next/headers'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'
import { routing } from '@/i18n/routing'

// テナント別の404。Headerが現テナントのロゴを表示し、「トップへ戻る」は/（＝同じ
// サブドメイン＝同じテナントのトップ）へ。別テナントや共通ポータルへは飛ばさない（ステルス維持）。
//
// 注: not-found.tsx は[locale]セグメントのリクエスト文脈外でレンダリングされるため、
// getTranslations()がロケールを解決できずキー名を返してしまう（next-intl既知の挙動）。
// apiErrors.ts と同じく NEXT_LOCALE クッキーからロケールを読み、messagesを直接参照する。
export default async function NotFound() {
  const raw = (await cookies()).get('NEXT_LOCALE')?.value
  const locale = (routing.locales as readonly string[]).includes(raw ?? '')
    ? raw!
    : routing.defaultLocale
  const messages = (await import(`../../../messages/${locale}.json`)).default as {
    notFound: { title: string; body: string; backHome: string }
  }
  const nf = messages.notFound

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-24 w-full text-center flex-1">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="text-xl font-semibold mt-4 mb-2 text-gray-900">{nf.title}</h1>
        <p className="text-sm text-gray-500 mb-8">{nf.body}</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {nf.backHome}
        </Link>
      </main>
    </>
  )
}
