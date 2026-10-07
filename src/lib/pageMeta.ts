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
  const meta: Metadata = {
    title: `${t(key)} | ${siteName}`,
    alternates: { canonical: `/${locale}${path}`, languages },
  }
  if (descriptionKey) {
    const text = t(descriptionKey).replace(/\s+/g, ' ').trim()
    meta.description = text.length > DESCRIPTION_MAX ? `${text.slice(0, DESCRIPTION_MAX)}…` : text
  }
  return meta
}

// 【2026-10-07】トップページの title。サイト名だけだと en と ja が同じ title になっていたので、
// 表示言語のキャッチコピー（正典・言い換えない）を後ろに付ける。改行は日中では詰め、他言語では空白にする。
export async function buildHomeTitle(locale: string): Promise<string> {
  const [tenantId, tBrand] = await Promise.all([getTenantId(), getTranslations({ locale, namespace: 'brand' })])
  const siteName = getTenantDisplayName(tenantId, 'Wisdom Assemble')
  const copy = tBrand('catchcopy').replace(/\n/g, ['ja', 'zh'].includes(locale) ? '' : ' ')
  return `${siteName} | ${copy}`
}
