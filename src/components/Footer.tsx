'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useTenantId } from './TenantProvider'

const ROOT_TENANT_ID = 'root'

type Props = {
  // ルートドメイン(wisdomassemble.com)でのみ渡される。他テナントでは常にundefined
  about?: { linkLabel: string; title: string; body: string }
}

export default function Footer({ about }: Props) {
  const t = useTranslations('footer')
  const [aboutOpen, setAboutOpen] = useState(false)
  const isRoot = useTenantId() === ROOT_TENANT_ID

  return (
    <>
      <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap">
          {about && (
            <button type="button" onClick={() => setAboutOpen(true)} className="hover:text-gray-600 transition-colors">
              {about.linkLabel}
            </button>
          )}
          <Link prefetch={false} href="/terms" className="hover:text-gray-600 transition-colors">{t('terms')}</Link>
          <Link prefetch={false} href="/privacy" className="hover:text-gray-600 transition-colors">{t('privacy')}</Link>
          <Link prefetch={false} href="/contact" className="hover:text-gray-600 transition-colors">{t('contact')}</Link>
          {!isRoot && (
            <a href="https://wisdomassemble.com" className="hover:text-gray-600 transition-colors">Wisdom Assemble</a>
          )}
        </div>
      </footer>

      {about && aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setAboutOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAboutOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
            <h2 className="text-sm font-bold tracking-tight text-gray-800 mb-3 pr-6">{about.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{about.body}</p>
          </div>
        </div>
      )}
    </>
  )
}
