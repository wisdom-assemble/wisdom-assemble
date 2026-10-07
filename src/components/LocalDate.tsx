'use client'

import { formatLocalDate } from '@/lib/dateFormat'

// 日付は表示言語ごとの代表タイムゾーンで出す（src/lib/dateFormat.ts）。サーバーとブラウザで同じ値になる。
export default function LocalDate({ iso, locale }: { iso: string; locale?: string }) {
  // 書式はサーバー（Workers の ICU）とブラウザで同じになる想定だが、万一1文字違っても描画し直しにならないよう保険を残す
  return <span suppressHydrationWarning>{formatLocalDate(iso, locale)}</span>
}
