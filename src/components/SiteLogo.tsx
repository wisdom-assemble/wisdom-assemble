import { getTenantDisplayName } from '@/lib/tenantNames'
import { getLogoShadowShades } from '@/lib/logoColor'

type Props = {
  name: string
  tenantId?: string
  colorTheme?: string
}

export default function SiteLogo({ name, tenantId, colorTheme = '#4F46E5' }: Props) {
  const label = getTenantDisplayName(tenantId, name)
  const shadowShades = getLogoShadowShades(colorTheme)

  const fontSize = label.length > 10 ? 26 : label.length > 8 ? 30 : 34
  // 影が右下に5px分はみ出るのでwidthに余裕を持たせる
  const svgWidth = label.length * (fontSize * 0.68) + 10
  const svgHeight = fontSize + 10

  return (
    <span className="flex items-center select-none">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={name}
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

        {/* メインテキスト（左端x=0、プライマリカラー） */}
        <text
          x="0"
          y={fontSize - 1}
          fontFamily="'Impact', 'Arial Black', 'Haettenschweiler', sans-serif"
          fontSize={fontSize}
          fontWeight="900"
          letterSpacing="1"
          fill="var(--color-primary)"
        >
          {label}
        </text>
      </svg>
    </span>
  )
}
