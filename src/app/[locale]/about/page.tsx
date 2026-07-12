import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/Header'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portalPage')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">{t('aboutTitle')}</h1>
        <div className="prose prose-sm max-w-none text-sm text-gray-600 leading-relaxed">
          <p>{t('aboutBody')}</p>
        </div>
      </main>
    </>
  )
}
