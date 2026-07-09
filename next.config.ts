import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // サブドメインをすべて同一Next.jsアプリで受ける
  // Vercel側でワイルドカードドメイン設定が必要
  experimental: {
    // クライアント側ルーターキャッシュが動的ページのRSCペイロードを
    // 再利用してしまい、言語切替後にページ遷移すると一部の文言（サーバー
    // コンポーネントで描画される部分）が古いロケールのまま残る不具合が
    // あったため、動的ページのキャッシュを無効化して毎回再取得させる
    staleTimes: {
      dynamic: 0,
    },
  },
}

export default withNextIntl(nextConfig)

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
