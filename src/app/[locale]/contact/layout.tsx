import { buildStaticPageMetadata } from '@/lib/pageMeta'

// page.tsx が 'use client' で metadata を書き出せないため、title/canonical はこのセグメントの layout で出す（2026-10-07）
type Props = { params: Promise<{ locale: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  return buildStaticPageMetadata(locale, '/contact', 'contactPage', 'title')
}

export default function ContactLayout({ children }: Props) {
  return children
}
