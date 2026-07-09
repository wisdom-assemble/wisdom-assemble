import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Geist } from 'next/font/google'
import '../globals.css'
import { routing } from '@/i18n/routing'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { TenantProvider } from '@/components/TenantProvider'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

const OG_LOCALE_MAP: Record<string, string> = { en: 'en_US', ja: 'ja_JP' }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const tenantId = await getTenantId()
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description, description_en')
    .eq('id', tenantId)
    .single()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://debug.wisdomassemble.com'
  const fallbackDescription = locale === 'en'
    ? "A Q&A service connecting questions AI can't confidently answer with real human experts."
    : 'AIが答えられない・不確かな質問を、人間のエキスパートに繋げるQ&Aサービス'
  const description = (locale === 'en' ? (tenant?.description_en ?? tenant?.description) : tenant?.description) ?? fallbackDescription
  return {
    title: tenant?.name ?? 'Wisdom Assemble',
    description,
    openGraph: {
      title: tenant?.name ?? 'Wisdom Assemble',
      description,
      url: siteUrl,
      siteName: tenant?.name ?? 'Wisdom Assemble',
      locale: OG_LOCALE_MAP[locale] ?? 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tenant?.name ?? 'Wisdom Assemble',
      description,
    },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const tenantId = await getTenantId()
  const supabase = await createClient()

  const [{ data: tenant }, messages] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', tenantId).single(),
    getMessages(),
  ])

  return (
    <html lang={locale} className={geist.variable}>
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <TenantProvider tenant={tenant}>
            {children}
            <Footer />
          </TenantProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
