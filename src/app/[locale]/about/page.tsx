import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/Header'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portalPage')
  const tBrand = await getTranslations('brand')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-3">{t('aboutTitle')}</h1>
        {/* 【2026-08-22】キャッチコピーはタイトルの直下。ルートポータルと同じ扱い・同じサイズ。
            スマホは2行・PCは1行（改行の扱いはPortalHome.tsx側のコメント参照）。 */}
        <p className="whitespace-pre-line sm:whitespace-normal text-lg sm:text-xl font-medium text-gray-800 leading-snug mb-5">
          {tBrand('catchcopy')}
        </p>
        <div className="prose prose-sm max-w-none text-sm text-gray-600 leading-relaxed">
          <p>{t('aboutBody')}</p>
        </div>
      </main>
    </>
  )
}
