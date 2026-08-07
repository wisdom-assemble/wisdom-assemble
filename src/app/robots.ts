import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getTenantId } from '@/lib/tenant'
import { isDormantTenant } from '@/lib/tenantNames'

// テナント（サブドメイン）ごとに自ホストのsitemapを宣言する。
// x-tenant-idではなくhostヘッダーから公開ホストを取得して絶対URLにする。
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? 'wisdomassemble.com'

  // 休眠テナントはクロール自体を止める（noindex・sitemap除外と合わせて三重に塞ぐ）
  if (isDormantTenant(await getTenantId())) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

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
