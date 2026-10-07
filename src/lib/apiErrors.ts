import { cookies, headers } from 'next/headers'
import { routing } from '@/i18n/routing'

// /api配下はnext-intlのミドルウェア対象外（[locale]配下に存在しないため）で
// 通常のgetTranslations()が使えない。next-intlミドルウェアが設定する
// NEXT_LOCALEクッキーを直接読み、APIレスポンスのエラーメッセージだけを
// 手動でロケール対応させる。
// 【2026-10-07】クッキーが無いときはブラウザの Accept-Language で決める。
// next-intl は「URLの言語＝ブラウザの言語」のときクッキーを書かないため、日本語ブラウザで /ja を見ている人には
// クッキーが無く、エラーが既定の英語で返っていた（クッキーが無い＝URLの言語とブラウザの言語が同じ、なので正しい）。
function localeFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null
  const supported = routing.locales as readonly string[]
  for (const part of header.split(',')) {
    const tag = part.split(';')[0].trim().toLowerCase()
    const primary = tag.split('-')[0]
    if (supported.includes(primary)) return primary
  }
  return null
}

export async function getApiErrors(): Promise<Record<string, string>> {
  const [store, headerList] = await Promise.all([cookies(), headers()])
  const raw = store.get('NEXT_LOCALE')?.value
  const supported = routing.locales as readonly string[]
  const locale = raw && supported.includes(raw)
    ? raw
    : (localeFromAcceptLanguage(headerList.get('accept-language')) ?? routing.defaultLocale)
  const messages = (await import(`../../messages/${locale}.json`)).default
  return messages.apiErrors ?? {}
}
