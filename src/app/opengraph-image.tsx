import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  const primary = '#10B981'
  const shadows = ['#0a4a30', '#0d5c3a', '#106e45', '#138050', '#16925b']
  const label = 'BUG DEBUG'

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
                fontSize: 120,
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
              fontSize: 120,
              fontWeight: 900,
              color: primary,
              fontFamily: 'sans-serif',
              letterSpacing: 4,
            }}
          >
            {label}
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            fontFamily: 'sans-serif',
            letterSpacing: 1,
          }}
        >
          AIの隙間を人間が埋める
        </div>
      </div>
    ),
    { ...size }
  )
}
