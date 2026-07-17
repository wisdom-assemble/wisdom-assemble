import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { TENANT_NAME_MAP } from '@/lib/tenantNames'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// テナント別のロゴ色（サイトのcolor_themeに準拠）。未定義テナントは既定色。
const OG_COLORS: Record<string, string> = {
  debug: '#10B981',
  dtm: '#4A90E2',
  root: '#9ca3af',
}
const DEFAULT_COLOR = '#4F46E5'

// hexを暗くする（3D押し出しの影用）
function darken(hex: string, factor: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.round(((n >> 16) & 0xff) * factor)
  const g = Math.round(((n >> 8) & 0xff) * factor)
  const b = Math.round((n & 0xff) * factor)
  return `rgb(${r},${g},${b})`
}

export default async function OgImage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? 'debug'
  const label =
    tenantId === 'root' ? 'WISDOM ASSEMBLE' : TENANT_NAME_MAP[tenantId] ?? 'WISDOM ASSEMBLE'
  const primary = OG_COLORS[tenantId] ?? DEFAULT_COLOR
  const shadows = [0.4, 0.5, 0.6, 0.7, 0.8].map((f) => darken(primary, f))

  // 長い名前(例 MUSIC PRODUCTION)がはみ出さないよう、文字数に応じてサイズを調整
  const fontSize = Math.min(120, Math.floor((1120 / label.length) * 1.35))

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
        }}
      >
        {/* Logo with 3D push-out effect */}
        <div style={{ position: 'relative', display: 'flex', marginBottom: 32 }}>
          {shadows.map((color, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                fontSize,
                fontWeight: 900,
                color,
                left: 5 - i,
                top: 5 - i,
                fontFamily: 'sans-serif',
                letterSpacing: 4,
              }}
            >
              {label}
            </div>
          ))}
          <div
            style={{
              position: 'relative',
              fontSize,
              fontWeight: 900,
              color: primary,
              fontFamily: 'sans-serif',
              letterSpacing: 4,
            }}
          >
            {label}
          </div>
        </div>

        {/* Tagline（全ロケールで確実に描画されるようLatinで統一） */}
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            fontFamily: 'sans-serif',
            letterSpacing: 1,
          }}
        >
          AI answers first — humans fill the gaps
        </div>
      </div>
    ),
    { ...size }
  )
}
