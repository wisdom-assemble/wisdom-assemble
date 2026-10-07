// 【2026-10-07】日付は表示言語ごとの「代表のタイムゾーン」で出す（mtさん指定）。
// 以前は timeZone 指定なしで、サーバー描画（Cloudflare Workers＝UTC）とブラウザ（閲覧者のタイムゾーン）で
// 日付が食い違い、深夜の投稿がJSを実行しないクローラーには前日の日付に見えていた。
// 言語で固定すればサーバーとブラウザで同じ値になる。言語＝住んでいる国ではないので、話者が最も多い／
// 主なターゲットの地域を代表にしている（en＝アメリカ東部、es＝メキシコ、pt＝ブラジル）。保存は今まで通り（UTC）。
const LOCALE_TIME_ZONES: Record<string, string> = {
  ja: 'Asia/Tokyo',
  en: 'America/New_York',
  zh: 'Asia/Shanghai',
  ko: 'Asia/Seoul',
  id: 'Asia/Jakarta',
  vi: 'Asia/Ho_Chi_Minh',
  es: 'America/Mexico_City',
  pt: 'America/Sao_Paulo',
}

export function formatLocalDate(iso: string | Date, locale?: string): string {
  const timeZone = LOCALE_TIME_ZONES[locale ?? ''] ?? 'Asia/Tokyo'
  return new Date(iso).toLocaleDateString(locale, { timeZone })
}
