'use client'

import { formatLocalDate } from '@/lib/dateFormat'

// 日付は表示言語ごとの代表タイムゾーンで出す（src/lib/dateFormat.ts）。サーバーとブラウザで同じ値になる。
export default function LocalDate({ iso, locale }: { iso: string; locale?: string }) {
  return <span>{formatLocalDate(iso, locale)}</span>
}
