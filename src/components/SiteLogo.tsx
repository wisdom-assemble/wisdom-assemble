import { getTenantDisplayName, LOGO_STYLE_OVERRIDES } from '@/lib/tenantNames'
import { getLogoShadowShades, darkenHex } from '@/lib/logoColor'

type Props = {
  name: string
  tenantId?: string
  colorTheme?: string
}

export default function SiteLogo({ name, tenantId, colorTheme = '#4F46E5' }: Props) {
  const label = getTenantDisplayName(tenantId, name)
  const override = tenantId ? LOGO_STYLE_OVERRIDES[tenantId] : undefined

  if (override) {
    const treatment = override.treatment ?? 'gradient'
    const fontSize = override.fontSizePx
    const tmFontSize = Math.round(fontSize * 0.34)

    // Sample Logo builderと同じCSS(globals.cssの.fx-*)を、テナントの色・フォントを
    // CSSカスタムプロパティで渡して適用する。treatmentが変わっても計算式は共通。
    const cssVars: Record<string, string> = {
      '--c': override.gradientFrom,
      '--c2': override.gradientTo,
    }
    if (treatment === '3d') {
      // Sample Logoのdarken(color, 0.14*(i+1))を1色版として移植（--c1〜--c5は使わず --sh1〜--sh5)
      ;[1, 2, 3, 4, 5].forEach((i) => {
        cssVars[`--sh${i}`] = darkenHex(override.gradientFrom, 0.14 * i)
      })
    }

    return (
      <span
        className={`fx-${treatment} inline-block select-none`}
        aria-label={name}
        style={{
          ...(cssVars as React.CSSProperties),
          fontFamily: override.fontFamily,
          fontWeight: override.fontWeight,
          fontSize: `${fontSize}px`,
          letterSpacing: `${override.letterSpacingEm}em`,
        }}
      >
        {label}
        <span
          style={{
            display: 'inline-block',
            fontFamily: '-apple-system, sans-serif',
            fontWeight: 400,
            fontSize: `${tmFontSize}px`,
            letterSpacing: 'normal',
            verticalAlign: 'super',
            marginLeft: '1px',
            color: override.gradientFrom,
            WebkitTextFillColor: override.gradientFrom,
            background: 'none',
          }}
        >
          ™
        </span>
      </span>
    )
  }

  const shadowShades = getLogoShadowShades(colorTheme)

  const fontSize = label.length > 10 ? 26 : label.length > 8 ? 30 : 34
  const tmFontSize = fontSize * 0.32
  // 実測値(Impact, canvas measureText): 1文字あたり約0.494em＋letterSpacing(1px)分
  const svgWidth = label.length * (fontSize * 0.494) + (label.length - 1) * 1 + tmFontSize * 1.3 + 5
  const svgHeight = fontSize + 10

  return (
    <span className="inline-flex items-center justify-center select-none">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={name}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* 3D押し出し効果（影を右下方向に、メインテキストはx=0で左端揃え） */}
        {[5, 4, 3, 2, 1].map(i => (
          <text
            key={i}
            x={i}
            y={fontSize - 1 + i}
            fontFamily="'Impact', 'Arial Black', 'Haettenschweiler', sans-serif"
            fontSize={fontSize}
            fontWeight="900"
            letterSpacing="1"
            fill={shadowShades[5 - i]}
          >
            {label}
          </text>
        ))}

        {/* メインテキスト（左端x=0、プライマリカラー）＋TM表記（tspanで実際の文字幅の直後に配置、影なし） */}
        <text
          x="0"
          y={fontSize - 1}
          fontFamily="'Impact', 'Arial Black', 'Haettenschweiler', sans-serif"
          fontSize={fontSize}
          fontWeight="900"
          letterSpacing="1"
          fill={colorTheme}
        >
          {label}
          <tspan dx="2" dy={-fontSize * 0.35} fontSize={tmFontSize} fontWeight="700">™</tspan>
        </text>
      </svg>
    </span>
  )
}
