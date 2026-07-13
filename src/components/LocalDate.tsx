'use client'

// サーバーサイド(Cloudflare Workers=UTC)ではなく閲覧者のブラウザのタイムゾーンで日付を表示する。
// SSR結果とクライアント初回レンダリングの差異はハイドレーション後にクライアント側の値が採用される。
export default function LocalDate({ iso, locale }: { iso: string; locale?: string }) {
  return <span suppressHydrationWarning>{new Date(iso).toLocaleDateString(locale)}</span>
}
