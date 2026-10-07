import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getTenantId } from '@/lib/tenant'
import { getTenantDisplayName } from '@/lib/tenantNames'
import { INDEXABLE_LOCALES } from '@/i18n/routing'

/* 【2026-10-07】規約・About・お問い合わせ等の固定ページ用の metadata。
   それまで固定ページの <title> がすべてサイト名だけ（ルートの10ページが全部「WISDOM ASSEMBLE」）で重複し、
   canonical/hreflang も無かった（AdSense再申請前の点検で発見）。
   title は「ページ名 | サイト名」。layout の title は文字列のままにして、質問ページの title は変えない
   （質問ページのタイトル調整はGSCの実データを見てから、という方針のため）。
   robots は layout 側の設定（en/ja以外は noindex）がそのまま継承される。
   ページ名は既存の8言語訳（namespace.key）をそのまま使う。 */
export async function buildStaticPageMetadata(
  locale: string,
  path: string,
  namespace: string,
  key: string
): Promise<Metadata> {
  const [tenantId, t] = await Promise.all([getTenantId(), getTranslations({ locale, namespace })])
  const siteName = getTenantDisplayName(tenantId, 'Wisdom Assemble')
  const languages: Record<string, string> = {}
  for (const l of INDEXABLE_LOCALES) languages[l] = `/${l}${path}`
  languages['x-default'] = `/en${path}`
  return {
    title: `${t(key)} | ${siteName}`,
    alternates: { canonical: `/${locale}${path}`, languages },
  }
}
