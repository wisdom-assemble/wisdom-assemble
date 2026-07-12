import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { routing } from '@/i18n/routing'
import { getTenantId } from '@/lib/tenant'

const STATIC_PATHS = ['', '/how-it-works', '/hard', '/terms', '/privacy', '/contact']

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'wisdomassemble.com'
  const baseUrl = `https://${host}`
  const tenantId = await getTenantId()

  const entries: MetadataRoute.Sitemap = []

  // 静的ページ（ルートポータルには質問投稿・使い方・高難度などテナント固有ページがないため、
  // トップ＋利用規約・プライバシーポリシー・お問い合わせの共通ページのみに絞る）
  const staticPaths = tenantId === 'root' ? ['', '/about', '/terms', '/privacy', '/contact'] : STATIC_PATHS
  for (const path of staticPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency: path === '' ? 'daily' : 'monthly',
        priority: path === '' ? 1 : 0.5,
      })
    }
  }

  // ルートポータル以外は、質問詳細ページも含める
  if (tenantId !== 'root') {
    const admin = getAdminClient()
    const { data: questions } = await admin
      .from('questions')
      .select('slug, updated_at, source_locale, title_i18n')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(1000)

    for (const q of questions ?? []) {
      // 未翻訳のロケールを含めると、原文がそのまま出るだけの重複コンテンツに
      // なってしまうため、実際に翻訳が存在するロケール（＋投稿時の原文ロケール）
      // のみをサイトマップに含める
      const titleI18n = (q.title_i18n as Record<string, string> | null) ?? {}
      const availableLocales = routing.locales.filter(
        (locale) => locale === q.source_locale || !!titleI18n[locale]
      )
      for (const locale of availableLocales) {
        entries.push({
          url: `${baseUrl}/${locale}/questions/${encodeURIComponent(q.slug)}`,
          lastModified: q.updated_at ? new Date(q.updated_at) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  }

  return entries
}
