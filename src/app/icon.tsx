import { ImageResponse } from 'next/og'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { getTenantDisplayName } from '@/lib/tenantNames'
import { getLogoShadowShades } from '@/lib/logoColor'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const tenantId = await getTenantId()
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, color_theme')
    .eq('id', tenantId)
    .maybeSingle()

  const label = getTenantDisplayName(tenantId, tenant?.name ?? 'Wisdom Assemble')
  const letter = label.trim().charAt(0) || 'W'
  const primary = tenant?.color_theme ?? '#4F46E5'
  const shadows = getLogoShadowShades(primary)

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          borderRadius: 6,
        }}
      >
        {/* 3D push-out shadow layers */}
        {shadows.map((color, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              fontSize: 26,
              fontWeight: 900,
              color,
              left: 4 + (5 - i),
              top: 2 + (5 - i),
              fontFamily: 'sans-serif',
            }}
          >
            {letter}
          </div>
        ))}
        {/* Main letter */}
        <div
          style={{
            position: 'absolute',
            fontSize: 26,
            fontWeight: 900,
            color: primary,
            left: 4,
            top: 2,
            fontFamily: 'sans-serif',
          }}
        >
          {letter}
        </div>
      </div>
    ),
    { ...size }
  )
}
