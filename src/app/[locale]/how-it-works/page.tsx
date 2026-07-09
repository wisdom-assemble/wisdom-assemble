import { getTranslations } from 'next-intl/server'
import Header from '@/components/Header'
import { Link } from '@/i18n/navigation'

export default async function HowItWorksPage() {
  const t = await getTranslations('howItWorksPage')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-500 text-sm mb-2">
          {t('intro1')}
        </p>
        <p className="text-gray-500 text-sm mb-2">
          {t('intro2')}
        </p>
        <p className="text-xs text-gray-400 mb-10">{t('loginNote')}</p>

        <div className="space-y-10">
          <Step number={1} title={t('step1Title')} description={t('step1Description')} icon="●" />
          <Step number={2} title={t('step2Title')} description={t('step2Description')} note={t('step2Note')} icon="●" />
          <Step number={3} title={t('step3Title')} description={t('step3Description')} icon="●" />
          <Step number={4} title={t('step4Title')} description={t('step4Description')} icon="●" />
          <Step number={5} title={t('step5Title')} description={t('step5Description')} icon="▲" />
          <Step number={6} title={t('step6Title')} description={t('step6Description')} icon="●" />
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <h2 className="font-bold text-base mb-2">{t('expertHeading')}</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>{t('expertStep1')}</li>
            <li>{t('expertStep2')}</li>
            <li>{t('expertStep3')}</li>
            <li>{t('expertStep4')}</li>
          </ol>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/questions/new"
            className="flex-1 text-center py-2.5 rounded font-medium text-white text-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('tryButton')}
          </Link>
          <Link
            href="/"
            className="flex-1 text-center py-2.5 rounded font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('listButton')}
          </Link>
        </div>
      </main>
    </>
  )
}

function Step({
  number,
  title,
  description,
  icon,
  note,
}: {
  number: number
  title: string
  description: string
  icon: string
  note?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 flex items-start justify-start text-xl font-bold text-gray-400">
        {number}
      </div>
      <div>
        <h2 className="font-semibold text-base mb-1">{title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        {note && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{note}</p>
        )}
      </div>
    </div>
  )
}
