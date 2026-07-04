import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { TenantProvider } from '@/components/TenantProvider'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantId()
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description')
    .eq('id', tenantId)
    .single()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://debug.wisdom-assemble.com'
  return {
    title: tenant?.name ?? 'Wisdom Assemble',
    description: tenant?.description ?? 'AIが答えられない専門知識を持つ人とマッチングできる知識コミュニティ',
    openGraph: {
      title: tenant?.name ?? 'Wisdom Assemble',
      description: tenant?.description ?? 'AIが答えられない専門知識を持つ人とマッチングできる知識コミュニティ',
      url: siteUrl,
      siteName: tenant?.name ?? 'Wisdom Assemble',
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tenant?.name ?? 'Wisdom Assemble',
      description: tenant?.description ?? 'AIが答えられない専門知識を持つ人とマッチングできる知識コミュニティ',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  return (
    <html lang={tenant?.language ?? 'ja'} className={geist.variable}>
      <body className="min-h-full flex flex-col antialiased">
        <TenantProvider tenant={tenant}>
          {children}
          <Footer />
        </TenantProvider>
      </body>
    </html>
  )
}
