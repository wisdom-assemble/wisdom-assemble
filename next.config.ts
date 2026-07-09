import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // サブドメインをすべて同一Next.jsアプリで受ける
  // Vercel側でワイルドカードドメイン設定が必要
}

export default withNextIntl(nextConfig)

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
