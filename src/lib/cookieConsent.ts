export const COOKIE_CONSENT_KEY = 'wa-cookie-consent-v1'

export type CookieConsentValue = 'accepted' | 'rejected'

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  return value === 'accepted' || value === 'rejected' ? value : null
}

export function setCookieConsent(value: CookieConsentValue): void {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  window.dispatchEvent(new CustomEvent('wa-cookie-consent-change', { detail: value }))
}

// 広告/解析タグ(AdSense, GA等)を導入する際は、これがtrueの場合のみ読み込む。
export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted'
}
