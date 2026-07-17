import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('privacyPage')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-xs text-gray-400 mb-1">{t('operatorNotice')}</p>
        <p className="text-xs text-gray-400 mb-6">{t('disclaimerNotice')}</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
          <Section title={t('section1Title')}>
            <p>{t('section1Intro')}</p>
            <ul>
              <li>{t('section1Item1')}</li>
              <li>{t('section1Item2')}</li>
              <li>{t('section1Item3')}</li>
              <li>{t('section1Item4')}</li>
            </ul>
            <p>{t('section1Outro')}</p>
            <p>{t('section1AiNote')}</p>
          </Section>

          <Section title={t('section2Title')}>
            <ul>
              <li>{t('section2Item1')}</li>
              <li>{t('section2Item2')}</li>
              <li>{t('section2Item3')}</li>
            </ul>
          </Section>

          <Section title={t('section3Title')}>
            <p>{t('section3Body')}</p>
            <ul>
              <li>{t('section3Item1')}</li>
              <li>{t('section3Item2')}</li>
              <li>{t('section3Item3')}</li>
              <li>{t('section3Item5')}</li>
              <li>{t('section3Item6')}</li>
              <li>{t('section3Item4')}</li>
            </ul>
            <p>{t('section3Outro')}</p>
            <p>
              {t('section3AdsBody')}{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-gray-900 hover:opacity-70"
              >
                {t('section3AdsLink')}
              </a>
            </p>
            <p>{t('section3EeaConsent')}</p>
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
            <p>{t('section8Body1')}</p>
            <p>{t('section8Body2')}</p>
          </Section>

          <Section title={t('section9Title')}>
            <p>
              {t('section9ContactPrefix')}{' '}
              <Link href="/contact" className="underline text-gray-900 hover:opacity-70">{t('section9ContactLink')}</Link>
              {t('section9ContactSuffix')}
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
