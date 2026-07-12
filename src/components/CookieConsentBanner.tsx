'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getCookieConsent, setCookieConsent } from '@/lib/cookieConsent'

export default function CookieConsentBanner() {
  const t = useTranslations('cookieConsent')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true)
  }, [])

  if (!visible) return null

  const handleChoice = (value: 'accepted' | 'rejected') => {
    setCookieConsent(value)
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 leading-relaxed">
          {t('message')}{' '}
          <Link href="/privacy" className="underline hover:text-gray-700">
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="px-4 py-2 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t('reject')}
          </button>
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="px-4 py-2 rounded text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
