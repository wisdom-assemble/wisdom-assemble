import { cookies } from 'next/headers'
import { routing } from '@/i18n/routing'

// /api配下はnext-intlのミドルウェア対象外（[locale]配下に存在しないため）で
// 通常のgetTranslations()が使えない。next-intlミドルウェアが設定する
// NEXT_LOCALEクッキーを直接読み、APIレスポンスのエラーメッセージだけを
// 手動でロケール対応させる。
export async function getApiErrors(): Promise<Record<string, string>> {
  const store = await cookies()
  const raw = store.get('NEXT_LOCALE')?.value
  const locale = (routing.locales as readonly string[]).includes(raw ?? '') ? raw! : routing.defaultLocale
  const messages = (await import(`../../messages/${locale}.json`)).default
  return messages.apiErrors ?? {}
}
