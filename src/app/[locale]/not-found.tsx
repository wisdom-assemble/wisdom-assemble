import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'

// テナント別の404。Headerが現テナントのロゴを表示し、「トップへ戻る」は/（＝同じ
// サブドメイン＝同じテナントのトップ）へ。別テナントや共通ポータルへは飛ばさない（ステルス維持）。
export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-24 w-full text-center flex-1">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="text-xl font-semibold mt-4 mb-2 text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mb-8">{t('body')}</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {t('backHome')}
        </Link>
      </main>
    </>
  )
}
