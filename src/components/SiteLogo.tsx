import { getTenantDisplayName, LOGO_STYLE_OVERRIDES } from '@/lib/tenantNames'
import { getLogoShadowShades } from '@/lib/logoColor'

type Props = {
  name: string
  tenantId?: string
  colorTheme?: string
}

export default function SiteLogo({ name, tenantId, colorTheme = '#4F46E5' }: Props) {
  const label = getTenantDisplayName(tenantId, name)
  const override = tenantId ? LOGO_STYLE_OVERRIDES[tenantId] : undefined

  if (override) {
    // override系ロゴもSVG＋viewBox＋maxWidth:100%でレンダリングし、コンテナ幅に応じて
    // 自動で縮むようにする（旧実装はCSSテキスト＋固定pxで、長い表示名がカードや狭い画面で
    // 溢れていた＝MUSIC PRODUCTIONの崩れ）。gradientはSVGのlinearGradientで再現する。
    const fontSize = override.fontSizePx
    const tmFontSize = Math.round(fontSize * 0.34)
    const lsPx = override.letterSpacingEm * fontSize
    // 1文字あたりの幅(em)。ロゴビルダーが実測した値(widthEmPerChar)があればそれを使い、
    // 無ければ0.70(Century Gothic系の近似)。実測値を渡せばどのフォントでもviewBoxが
    // ぴったり合い、右切れ・中央ズレが起きない。
    const perCharEm = override.widthEmPerChar ?? 0.70
    const textWidth = label.length * fontSize * perCharEm + (label.length - 1) * lsPx

    // treatment指定時：globals.cssのfx-*をforeignObjectで適用（ロゴビルダーとピクセル一致）。
    // treatment未指定（既存dtm等）は従来のSVG平面グラデ描画のまま（後方互換・見た目不変）。
    const treatment = override.treatment
    if (treatment && treatment !== 'gradient') {
      const shades = getLogoShadowShades(override.gradientFrom)
      const PAD = 16
      const isBox = treatment === 'pill' || treatment === 'emblem'
      const hasRule = treatment === 'underline' || treatment === 'dotted' || treatment === 'doublerule' || treatment === 'varsity'
      const fw = Math.max(1, textWidth + tmFontSize * 1.3 + PAD * 2 + (isBox ? 40 : 0))
      const fh = fontSize + PAD * 2 + (hasRule ? 12 : 0) + (isBox ? 16 : 0)
      const boxStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 8,
        '--c': override.gradientFrom,
        '--c2': override.gradientTo,
        '--sh1': shades[0],
        '--sh2': shades[1],
        '--sh3': shades[2],
        '--sh4': shades[3],
        '--sh5': shades[4],
      } as React.CSSProperties

      return (
        <span className="inline-flex items-center justify-center select-none">
          <svg
            width={fw}
            height={fh}
            viewBox={`0 0 ${fw} ${fh}`}
            xmlns="http://www.w3.org/2000/svg"
            aria-label={name}
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <foreignObject x="0" y="0" width={fw} height={fh}>
              <div {...{ xmlns: 'http://www.w3.org/1999/xhtml' }} style={boxStyle}>
                <span
                  className={`fx-${treatment}`}
                  data-text={label}
                  style={{
                    fontFamily: override.fontFamily,
                    fontSize,
                    fontWeight: override.fontWeight,
                    letterSpacing: lsPx,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                  <sup style={{ fontSize: tmFontSize, fontWeight: 700, marginLeft: 2 }}>™</sup>
                </span>
              </div>
            </foreignObject>
          </svg>
        </span>
      )
    }

    const svgWidth = Math.max(1, textWidth + tmFontSize * 1.3 + 6)
    const svgHeight = fontSize + 10
    const gradId = `logo-grad-${tenantId ?? 'x'}`

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
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={override.gradientFrom} />
              <stop offset="100%" stopColor={override.gradientTo} />
            </linearGradient>
          </defs>
          <text
            x="0"
            y={fontSize - 1}
            fontFamily={override.fontFamily}
            fontSize={fontSize}
            fontWeight={override.fontWeight}
            letterSpacing={lsPx}
            fill={`url(#${gradId})`}
          >
            {label}
            <tspan dx="2" dy={-fontSize * 0.35} fontSize={tmFontSize} fontWeight="700" fill={override.gradientFrom}>™</tspan>
          </text>
        </svg>
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
