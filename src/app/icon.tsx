import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const primary = '#10B981'
  const shadows = ['#0a4a30', '#0d5c3a', '#106e45', '#138050', '#16925b']

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
            B
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
          B
        </div>
      </div>
    ),
    { ...size }
  )
}
