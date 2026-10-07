import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getTenantId } from '@/lib/tenant'
import { getTenantDisplayName, getPublicSubdomain } from '@/lib/tenantNames'
import { INDEXABLE_LOCALES } from '@/i18n/routing'

/* 【2026-10-07】規約・About・お問い合わせ等の固定ページ用の metadata。
   それまで固定ページの <title> がすべてサイト名だけ（ルートの10ページが全部「WISDOM ASSEMBLE」）で重複し、
   canonical/hreflang も無かった（AdSense再申請前の点検で発見）。
   title は「ページ名 | サイト名」。layout の title は文字列のままにして、質問ページの title は変えない
   （質問ページのタイトル調整はGSCの実データを見てから、という方針のため）。
   robots は layout 側の設定（en/ja以外は noindex）がそのまま継承される。
   ページ名は既存の8言語訳（namespace.key）をそのまま使う。 */
// 【2026-10-07】description もページごとに分ける（それまでは全ページがサイト共通の説明文で重複していた）。
// descriptionKey は同じ名前空間の、そのページの本文の冒頭にあたる文言。長いものは160字で切る。
const DESCRIPTION_MAX = 160

export async function buildStaticPageMetadata(
  locale: string,
  path: string,
  namespace: string,
  key: string,
  descriptionKey?: string
): Promise<Metadata> {
  const [tenantId, t] = await Promise.all([getTenantId(), getTranslations({ locale, namespace })])
  const siteName = getTenantDisplayName(tenantId, 'Wisdom Assemble')
  const languages: Record<string, string> = {}
  for (const l of INDEXABLE_LOCALES) languages[l] = `/${l}${path}`
  languages['x-default'] = `/en${path}`
  const title = `${t(key)} | ${siteName}`
  let description: string | undefined
  if (descriptionKey) {
    const text = t(descriptionKey).replace(/\s+/g, ' ').trim()
    description = text.length > DESCRIPTION_MAX ? `${text.slice(0, DESCRIPTION_MAX)}…` : text
  }
  // 【2026-10-07】SNS用のカードもこのページのものにする（以前は layout のサイトトップのカードを引き継いでいた）。
  // openGraph は子で指定すると丸ごと置き換わるので、画像（layout と同じテナント画像）もここで指定する。
  const siteUrl = tenantId === 'root' ? 'https://wisdomassemble.com' : `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com`
  const ogImage = `${siteUrl}/og/${tenantId}.png`
  const url = `${siteUrl}/${locale}${path}`
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/${locale}${path}`, languages },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: { card: 'summary_large_image', title, ...(description ? { description } : {}), images: [ogImage] },
  }
}

// 【2026-10-07】トップページの title。サイト名だけだと en と ja が同じ title になっていたので、
// 表示言語のキャッチコピー（正典・言い換えない）を後ろに付ける。改行は日中では詰め、他言語では空白にする。
export async function buildHomeTitle(locale: string): Promise<string> {
  const [tenantId, tBrand] = await Promise.all([getTenantId(), getTranslations({ locale, namespace: 'brand' })])
  const siteName = getTenantDisplayName(tenantId, 'Wisdom Assemble')
  const copy = tBrand('catchcopy').replace(/\n/g, ['ja', 'zh'].includes(locale) ? '' : ' ')
  return `${siteName} | ${copy}`
}
