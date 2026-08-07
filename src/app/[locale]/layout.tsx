import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Geist } from 'next/font/google'
import '../globals.css'
import { routing, INDEXABLE_LOCALES } from '@/i18n/routing'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { TenantProvider } from '@/components/TenantProvider'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import { getTenantDisplayName, getPublicSubdomain, isDormantTenant } from '@/lib/tenantNames'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

// middleware.tsのROOT_TENANT_IDと一致。ルートドメイン(wisdomassemble.com)
// でのみフッターに「About Wisdom Assemble」オーバーレイを表示する
const ROOT_TENANT_ID = 'root'

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

// 【2026-07-30】generateMetadata と layout 本体が同じ tenants 行を別々に取得していて、
// 1リクエストでDB往復とCPUが二重になっていた。Reactのcache()でリクエスト内メモ化し1回にする。
const getTenantRecord = cache(async (tenantId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
  return data
})

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const tenantId = await getTenantId()
  const tenant = await getTenantRecord(tenantId)
  const siteUrl = tenantId === ROOT_TENANT_ID
    ? 'https://wisdomassemble.com'
    : `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com`
  const fallbackDescription = FALLBACK_DESCRIPTION_MAP[locale] ?? FALLBACK_DESCRIPTION_MAP.en
  const description = tenantId === ROOT_TENANT_ID
    ? (await getTranslations('portalPage')).raw('subtitle')
    : (tenant?.description_i18n?.[locale] ?? tenant?.description ?? fallbackDescription)
  // タブタイトル・OGPはロゴ表記に合わせて常に英語表記（DBのnameは日本語の場合があるため）
  const displayName = getTenantDisplayName(tenantId, tenant?.name ?? 'Wisdom Assemble')
  return {
    // metadataBaseが無いとNext.jsがOGP/Twitter画像の相対URLを解決できず、
    // Cloudflareログに警告が出続ける（SNSシェア時のサムネイルにも影響）。
    // テナントごとに公開URLが違うので、ここで動的に指定する。
    metadataBase: new URL(siteUrl),
    title: displayName,
    description,
    // 【2026-07-30】ファビコンを静的ファイルへ。実測で「Workerが生成したレスポンスは
    // Cache-Controlを付けてもエッジにキャッシュされない」（/icon に s-maxage を付けても
    // cf-cache-status が付かない）一方、public/配下の静的ファイルは Asset Worker が返し
    // MISS→HIT する＝Workerを一切通らない。よって src/app/icon.tsx を廃止し、
    // テナントごとのPNGを public/icons/ に置いて指す方式に変更した。
    // ※ファイル規約(app/icon.tsx)はこの指定を上書きするため、必ず併存させないこと。
    // ※新テナント追加時は public/icons/<id>.png と public/og/<id>.png を用意する
    //   （生成手順は scripts/image-templates/ とテナント追加チェックリスト参照）
    icons: { icon: [{ url: `/icons/${tenantId}.png`, type: 'image/png', sizes: '32x32' }] },
    // このrobotsはlayout配下の全ページ（トップ・質問詳細・利用規約等）に継承される。
    // ページ側でrobotsを上書きしていないため、ここ1箇所で全体を制御できる。
    //   ・休眠テナント → 全ロケールでnoindex
    //   ・en/ja以外の機械翻訳ロケール → noindex
    // 休眠判定を先に評価し、休眠テナントでは言語に関係なく確実に外す。
    //
    // どちらも follow:true にする理由: 既にインデックスされているURLを消すには、
    // Googlebotに各ページを取得させて noindex を読ませる必要がある。nofollow に
    // するとトップから下層ページへ辿らなくなり、noindex の認識が遅れる。
    // 同じ理由で robots.txt でのブロックもしない（robots.ts のコメント参照）。
    ...(isDormantTenant(tenantId) || !INDEXABLE_LOCALES.includes(locale)
      ? { robots: { index: false, follow: true } }
      : {}),
    openGraph: {
      title: displayName,
      description,
      url: siteUrl,
      siteName: displayName,
      locale: OG_LOCALE_MAP[locale] ?? 'en_US',
      type: 'website',
      // 【2026-07-28】og:image を明示指定する。src/app/opengraph-image.tsx は
      // [locale]より1つ上のセグメントにあるため、ここで設定したmetadataBaseが
      // 解決に使われず「metadataBase ... is not set for resolving social open graph
      // or twitter images」の警告とともに og:image / twitter:image が
      // 出力から丸ごと落ちていた（実測: og:titleやog:urlは出るのに画像だけ無い＝
      // SNSにURLを貼ってもサムネイルが出ない）。絶対URLで直接指定して解消する。
      images: [{ url: `${siteUrl}/og/${tenantId}.png`, width: 1200, height: 630, alt: displayName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description,
      images: [`${siteUrl}/og/${tenantId}.png`],
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

  // getTenantRecord は cache() 済みなので、generateMetadata で取得済みなら再取得しない
  const [tenant, messages] = await Promise.all([
    getTenantRecord(tenantId),
    getMessages(),
  ])

  // テナント別ダークモード。theme='dark'なら<html data-theme="dark">、
  // bg_colorがあれば --page-bg で背景色を個別上書き（globals.css参照）。
  const isDark = tenant?.theme === 'dark'
  const htmlStyle = tenant?.bg_color
    ? ({ '--page-bg': tenant.bg_color } as React.CSSProperties)
    : undefined

  return (
    <html lang={locale} className={geist.variable} data-theme={isDark ? 'dark' : undefined} style={htmlStyle}>
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <TenantProvider tenant={tenant} tenantId={tenantId}>
            {children}
            <Footer />
            <CookieConsentBanner />
          </TenantProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
