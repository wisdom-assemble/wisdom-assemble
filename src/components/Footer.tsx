'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useTenantId } from './TenantProvider'

const ROOT_TENANT_ID = 'root'

export default function Footer() {
  const t = useTranslations('footer')
  const tPortal = useTranslations('portalPage')
  const isRoot = useTenantId() === ROOT_TENANT_ID

  return (
    <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap">
        {isRoot && (
          <Link prefetch={false} href="/about" className="hover:text-gray-600 transition-colors">
            {tPortal('aboutLinkLabel')}
          </Link>
        )}
        <Link prefetch={false} href="/terms" className="hover:text-gray-600 transition-colors">{t('terms')}</Link>
        <Link prefetch={false} href="/privacy" className="hover:text-gray-600 transition-colors">{t('privacy')}</Link>
        <Link prefetch={false} href="/contact" className="hover:text-gray-600 transition-colors">{t('contact')}</Link>
        {!isRoot && (
          <a href="https://wisdomassemble.com" className="hover:text-gray-600 transition-colors">Wisdom Assemble</a>
        )}
      </div>
    </footer>
  )
}
