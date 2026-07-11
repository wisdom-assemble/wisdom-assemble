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
    const fontSize = override.fontSizePx
    const tmFontSize = fontSize * 0.32
    const svgWidth = label.length * (fontSize * 0.62) + tmFontSize * 2 + 10
    const svgHeight = fontSize + 10
    const gradientId = `logo-grad-${tenantId}`

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
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
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
            letterSpacing={`${override.letterSpacingEm}em`}
            fill={`url(#${gradientId})`}
          >
            {label}
            <tspan dx="2" dy={-fontSize * 0.35} fontSize={tmFontSize} fontWeight="700">™</tspan>
          </text>
        </svg>
      </span>
    )
  }

  const shadowShades = getLogoShadowShades(colorTheme)

  const fontSize = label.length > 10 ? 26 : label.length > 8 ? 30 : 34
  const tmFontSize = fontSize * 0.32
  // 影が右下に5px分はみ出る＋TM表記ぶんの余白を確保
  const svgWidth = label.length * (fontSize * 0.68) + tmFontSize * 2 + 10
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
