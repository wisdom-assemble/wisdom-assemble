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
// ファビコンは小さいので完全一致でなく「雰囲気」で似せる（Century Gothic→Jost=Futura系 等）。
function faviconFont(fontFamily: string): { family: string; weight: number } {
  const f = fontFamily.toLowerCase()
  // 手書き・スクリプト・カジュアル
  if (f.includes('brush') || f.includes('snell') || f.includes('bradley') || f.includes('marker felt') || f.includes('chalkboard') || f.includes('comic') || f.includes('script') || f.includes('cursive')) return { family: 'Caveat', weight: 700 }
  // 等幅
  if (f.includes('courier') || f.includes('mono') || f.includes('menlo') || f.includes('consolas') || f.includes('typewriter')) return { family: 'Roboto Mono', weight: 700 }
  // スラブ
  if (f.includes('rockwell') || f.includes('slab')) return { family: 'Roboto Slab', weight: 700 }
  // 極太・圧縮・Impact系
  if (f.includes('impact') || f.includes('arial black') || f.includes('franklin gothic heavy') || f.includes('haettenschweiler') || f.includes('arial narrow') || f.includes('condensed')) return { family: 'Anton', weight: 400 }
  // 丸ゴシック
  if (f.includes('rounded')) return { family: 'Baloo 2', weight: 700 }
  // ディドネ・エレガントセリフ
  if (f.includes('didot') || f.includes('bodoni') || f.includes('big caslon') || f.includes('baskerville')) return { family: 'Playfair Display', weight: 700 }
  // セリフ全般
  if (f.includes('georgia') || f.includes('times') || f.includes('palatino') || f.includes('garamond') || f.includes('book antiqua') || f.includes('copperplate') || f.includes('serif')) return { family: 'Lora', weight: 700 }
  // 幾何学サンセリフ
  if (f.includes('century gothic') || f.includes('futura') || f.includes('optima') || f.includes('eurostile')) return { family: 'Jost', weight: 700 }
  // 既定サンセリフ
  return { family: 'Jost', weight: 700 }
}

// treatment を faviconの近似カテゴリ（gradient / 3d / solid）に振り分ける
function faviconStyleKind(treatment: string | undefined): 'gradient' | '3d' | 'solid' {
  if (!treatment) return 'gradient'
  if (['3d', 'longshadow', 'shadow', 'duplicate', 'varsity', 'glitch'].includes(treatment)) return '3d'
  if (['gradient', 'vertgradient', 'diagsplit', 'split', 'fade', 'stripe'].includes(treatment)) return 'gradient'
  return 'solid'
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
    const kind = faviconStyleKind(override.treatment)
    const base = { fontSize: 23, fontWeight: font.weight, fontFamily: 'FaviconFont', lineHeight: 1 }
    let letterStyle: React.CSSProperties
    if (kind === '3d') {
      const sh = getLogoShadowShades(override.gradientFrom)
      letterStyle = {
        ...base,
        color: override.gradientFrom,
        textShadow: sh.map((c, idx) => `${idx + 1}px ${idx + 1}px 0 ${c}`).join(', '),
        marginRight: 3,
        marginBottom: 2,
      }
    } else if (kind === 'gradient') {
      letterStyle = {
        ...base,
        backgroundImage: `linear-gradient(90deg, ${override.gradientFrom}, ${override.gradientTo})`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }
    } else {
      letterStyle = { ...base, color: override.gradientFrom }
    }
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
          <div style={letterStyle}>{letter}</div>
        </div>
      ),
      { ...size, fonts: [{ name: 'FaviconFont', data: fontData, weight: font.weight as 400 | 700, style: 'normal' }] }
    )
  }

  // デフォルトロゴ(Impact 3D押し出し)のテナントは、ロゴが3Dなのでファビコンも
  // 3D＋ロゴのImpact書体に近いGoogle Font(Anton)＋センターにする。
  // 3DはtextShadowの多層(近い影ほど明・遠い影ほど暗)で表現し、flexでセンター配置。
  const primary = tenant?.color_theme ?? '#4F46E5'
  const shadows = getLogoShadowShades(primary) // [L28,L24,L20,L16,L12]（近→遠）
  const impactFont = await loadGoogleFont('Anton', 400, letter)
  const shadowCss = shadows.map((c, idx) => `${idx + 1}px ${idx + 1}px 0 ${c}`).join(', ')

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
            fontSize: 24,
            fontWeight: 400,
            fontFamily: 'ImpactFont',
            color: primary,
            lineHeight: 1,
            textShadow: shadowCss,
            marginRight: 3,
            marginBottom: 2,
          }}
        >
          {letter}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'ImpactFont', data: impactFont, weight: 400, style: 'normal' }] }
  )
}
