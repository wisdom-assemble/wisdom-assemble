import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'

type Props = { params: Promise<{ locale: string }> }

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('termsPage')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-xs text-gray-400 mb-1">{t('disclaimerNotice')}</p>
        <p className="text-xs text-gray-400 mb-6">{t('translationDisclaimer')}</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
          <Section title={t('section1Title')}>
            <p>{t('section1Body')}</p>
          </Section>

          <Section title={t('section2Title')}>
            <p>{t('section2Intro')}</p>
            <ul>
              <li>{t('section2Item1')}</li>
              <li>{t('section2Item2')}</li>
              <li>{t('section2Item3')}</li>
              <li>{t('section2Item4')}</li>
              <li>{t('section2Item5')}</li>
              <li>{t('section2Item6')}</li>
              <li>{t('section2Item7')}</li>
              <li>{t('section2Item8')}</li>
            </ul>
          </Section>

          <Section title={t('section3Title')}>
            <p>{t('section3Body')}</p>
          </Section>

          <Section title={t('section4Title')}>
            <p>{t('section4Body')}</p>
          </Section>

          <Section title={t('section5Title')}>
            <p>{t('section5Body')}</p>
          </Section>

          <Section title={t('section6Title')}>
            <p>{t('section6Body')}</p>
          </Section>

          <Section title={t('section7Title')}>
            <p>{t('section7Body')}</p>
          </Section>

          <Section title={t('section8Title')}>
            <p>
              {t('section8ContactPrefix')}{' '}
              <Link href="/contact" className="underline text-gray-900 hover:opacity-70">{t('section8ContactLink')}</Link>
              {t('section8ContactSuffix')}
            </p>
          </Section>
        </div>
      </main>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-base mb-2 text-gray-900">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}
