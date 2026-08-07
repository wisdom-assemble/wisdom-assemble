import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

// テナント（サブドメイン）ごとに自ホストのsitemapを宣言する。
// x-tenant-idではなくhostヘッダーから公開ホストを取得して絶対URLにする。
//
// 【休眠テナント(DORMANT_TENANT_IDS)でも Disallow: / にしてはいけない】
//   2026-08-08に一度 Disallow: / を入れたが誤りだったので取り消した。
//   Googleの公式ガイダンスどおり、robots.txtでブロックすると Googlebot が
//   ページを取得できず、HTML内の noindex を読めない。その結果
//   「既にインデックスされているURLが消えないまま残る」（説明文だけ取得できず
//   タイトルとURLが検索結果に残る状態）になり、noindex を打ち消してしまう。
//   インデックスから消すには、逆にクロールさせて noindex を読ませる必要がある。
//   休眠化は「全ページ noindex（layout.tsx）＋ sitemapから除外（sitemap.ts）＋
//   ルートポータル非掲載（PortalHome.tsx）」の3つで行う。
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? 'wisdomassemble.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 管理画面・API・認証はクロール不要（各ページは/{locale}/配下のためワイルドカード）
      disallow: ['/api/', '/auth/', '/*/admin', '/*/auth/', '/*/profile'],
    },
    sitemap: `https://${host}/sitemap.xml`,
  }
}
