import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { TenantProvider } from '@/components/TenantProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Wisdom Assemble',
  description: 'AIが答えられない専門知識を持つ人とマッチングできる知識コミュニティ',
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
        </TenantProvider>
      </body>
    </html>
  )
}
