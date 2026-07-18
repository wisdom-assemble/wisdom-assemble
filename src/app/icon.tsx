import { ImageResponse } from 'next/og'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { getTenantDisplayName, LOGO_STYLE_OVERRIDES } from '@/lib/tenantNames'
import { getLogoShadowShades } from '@/lib/logoColor'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// next/ogはシステムフォントを使えない（Satoriが実際のフォントデータを要求する）ため、
// 明朝体で描画するにはGoogle Fontsから実データを取得して埋め込む必要がある
async function loadMinchoFont() {
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@800&text=W'
  const css = await (await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error('mincho font url not found in Google Fonts CSS')
  const fontRes = await fetch(match[1])
  return fontRes.arrayBuffer()
}

export default async function Icon() {
  const tenantId = await getTenantId()

  // ルートドメイン(wisdomassemble.com)専用のfavicon。トップロゴ(WISDOM ASSEMBLE)
  // のグレー基調に合わせた明朝体の「W」。他テナントの3D押し出し風とは別デザイン
  if (tenantId === 'root') {
    const minchoFont = await loadMinchoFont()
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
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#5B5B5B',
              fontFamily: 'Mincho Icon',
            }}
          >
            W
          </div>
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
  // ロゴ(SiteLogo)がLOGO_STYLE_OVERRIDESを持つテナントは、そのロゴの主色(gradientFrom)を
  // ファビコンの文字色に使い、ロゴと色を一致させる（例: MUSIC PRODUCTION=#74a7fe）。
  // 未指定テナントは従来通りcolor_themeを使う（既定の3Dロゴがcolor_themeで描かれ一致するため）。
  const primary = LOGO_STYLE_OVERRIDES[tenantId]?.gradientFrom ?? tenant?.color_theme ?? '#4F46E5'
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
