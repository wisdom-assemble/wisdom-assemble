import { ImageResponse } from 'next/og'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { getTenantDisplayName, LOGO_STYLE_OVERRIDES } from '@/lib/tenantNames'
import { getLogoShadowShades } from '@/lib/logoColor'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// next/og(Satori)はシステムフォントを使えない（実フォントデータが要る）ため、
// Google Fontsから実データを取得して埋め込む。text=で必要な文字だけサブセット取得。
async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error('google font url not found: ' + family)
  return (await fetch(match[1])).arrayBuffer()
}

// LOGO_STYLE_OVERRIDES.fontFamily（システムフォント名）を、埋め込み可能な近いGoogle Fontへ対応付ける。
// ファビコンをロゴのフォントに「似せる」ため（Century Gothic→Jost=Futura系 等）。
function faviconFont(fontFamily: string): { family: string; weight: number } {
  const f = fontFamily.toLowerCase()
  if (f.includes('century gothic') || f.includes('futura')) return { family: 'Jost', weight: 700 }
  if (f.includes('georgia') || f.includes('times') || f.includes('serif')) return { family: 'Lora', weight: 700 }
  if (f.includes('courier') || f.includes('mono')) return { family: 'Roboto Mono', weight: 700 }
  if (f.includes('impact') || f.includes('arial black')) return { family: 'Anton', weight: 400 }
  return { family: 'Jost', weight: 700 }
}

export default async function Icon() {
  const tenantId = await getTenantId()

  // ルートドメイン(wisdomassemble.com)専用のfavicon。トップロゴ(WISDOM ASSEMBLE)
  // のグレー基調に合わせた明朝体の「W」。
  if (tenantId === 'root') {
    const minchoFont = await loadGoogleFont('Shippori Mincho', 800, 'W')
    return new ImageResponse(
      (
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFFFF',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: '#5B5B5B', fontFamily: 'Mincho Icon' }}>W</div>
        </div>
      ),
      { ...size, fonts: [{ name: 'Mincho Icon', data: minchoFont, weight: 800, style: 'normal' }] }
    )
  }

  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, color_theme')
    .eq('id', tenantId)
    .maybeSingle()

  const label = getTenantDisplayName(tenantId, tenant?.name ?? 'Wisdom Assemble')
  const letter = label.trim().charAt(0) || 'W'
  const override = LOGO_STYLE_OVERRIDES[tenantId]

  // 独自ロゴ(override)のテナントは、ロゴが「平面グラデ」なのでファビコンも
  // 平面グラデ＋ロゴのフォント＋センターにする（ロゴのスタイルに合わせる）。
  if (override) {
    const font = faviconFont(override.fontFamily)
    const fontData = await loadGoogleFont(font.family, font.weight, letter)
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
          <div
            style={{
              fontSize: 23,
              fontWeight: font.weight,
              fontFamily: 'FaviconFont',
              lineHeight: 1,
              backgroundImage: `linear-gradient(90deg, ${override.gradientFrom}, ${override.gradientTo})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {letter}
          </div>
        </div>
      ),
      { ...size, fonts: [{ name: 'FaviconFont', data: fontData, weight: font.weight as 400 | 700, style: 'normal' }] }
    )
  }

  // デフォルトロゴ(Impact 3D押し出し)のテナントは、ロゴが3Dなのでファビコンも3D。
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
