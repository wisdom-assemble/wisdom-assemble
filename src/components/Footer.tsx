'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useTenantId } from './TenantProvider'

const ROOT_TENANT_ID = 'root'

export default function Footer() {
  const t = useTranslations('footer')
  const tPortal = useTranslations('portalPage')
  const isRoot = useTenantId() === ROOT_TENANT_ID
  const locale = useLocale()

  return (
    <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap">
        {/* 【2026-10-07】テナントからも運営者情報（ルートのAbout）へたどれるようにした。
            それまでテナントのフッターにはAboutが無く、質問ページから運営者が見えなかった。 */}
        {isRoot ? (
          <Link prefetch={false} href="/about" className="hover:text-gray-600 transition-colors">
            {tPortal('aboutLinkLabel')}
          </Link>
        ) : (
          <a href={`https://wisdomassemble.com/${locale}/about`} className="hover:text-gray-600 transition-colors">
            {tPortal('aboutLinkLabel')}
          </a>
        )}
        <Link prefetch={false} href="/terms" className="hover:text-gray-600 transition-colors">{t('terms')}</Link>
        <Link prefetch={false} href="/privacy" className="hover:text-gray-600 transition-colors">{t('privacy')}</Link>
        <Link prefetch={false} href="/contact" className="hover:text-gray-600 transition-colors">{t('contact')}</Link>
        {!isRoot && (
          // 表示中の言語のまま戻る（以前は /ja からでも307で /en に飛んでいた）
          <a href={`https://wisdomassemble.com/${locale}`} className="hover:text-gray-600 transition-colors">Wisdom Assemble</a>
        )}
      </div>
    </footer>
  )
}
