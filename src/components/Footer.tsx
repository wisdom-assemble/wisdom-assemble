import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-6 flex-wrap">
        <Link prefetch={false} href="/terms" className="hover:text-gray-600 transition-colors">{t('terms')}</Link>
        <Link prefetch={false} href="/privacy" className="hover:text-gray-600 transition-colors">{t('privacy')}</Link>
        <Link prefetch={false} href="/contact" className="hover:text-gray-600 transition-colors">{t('contact')}</Link>
      </div>
    </footer>
  )
}
