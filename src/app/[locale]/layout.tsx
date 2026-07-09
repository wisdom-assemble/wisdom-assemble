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

const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_US', ja: 'ja_JP', zh: 'zh_CN', id: 'id_ID',
  vi: 'vi_VN', ko: 'ko_KR', es: 'es_ES', pt: 'pt_PT',
}

const FALLBACK_DESCRIPTION_MAP: Record<string, string> = {
  en: "A Q&A service connecting questions AI can't confidently answer with real human experts.",
  ja: 'AIが答えられない・不確かな質問を、人間のエキスパートに繋げるQ&Aサービス',
  zh: '一个将AI无法确定回答的问题连接给真正人类专家的问答服务。',
  id: 'Layanan tanya jawab yang menghubungkan pertanyaan yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  vi: 'Dịch vụ hỏi đáp kết nối những câu hỏi mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  ko: 'AI가 자신 있게 답변하지 못하는 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  es: 'Un servicio de preguntas y respuestas que conecta preguntas que la IA no puede responder con confianza con expertos humanos reales.',
  pt: 'Um serviço de perguntas e respostas que conecta perguntas que a IA não consegue responder com confiança a especialistas humanos reais.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const tenantId = await getTenantId()
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description, description_i18n')
    .eq('id', tenantId)
    .single()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://debug.wisdomassemble.com'
  const fallbackDescription = FALLBACK_DESCRIPTION_MAP[locale] ?? FALLBACK_DESCRIPTION_MAP.en
  const description = tenant?.description_i18n?.[locale] ?? tenant?.description ?? fallbackDescription
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
