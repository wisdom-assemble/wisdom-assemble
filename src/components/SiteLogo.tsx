type Props = {
  name: string
}

// テナント名を英語表記に変換（DBに英語名がなければフォールバック）
const NAME_MAP: Record<string, string> = {
  'バグ・デバッグ': 'BUG DEBUG',
  'バグデバッグ': 'BUG DEBUG',
  '確定申告': 'TAX JAPAN',
  'ワーホリ': 'WORK HOLIDAY',
  'バリ島移住': 'BALI LIFE',
  'チェンマイ移住': 'CHIANGMAI',
  'ポルトガル移住': 'PORTUGAL',
  'DTM・音楽制作': 'MUSIC PROD',
  '自作キーボード': 'KEYBOARDS',
  'フィリピン留学': 'PH STUDY',
  'カナダ留学': 'CA STUDY',
}

export default function SiteLogo({ name }: Props) {
  const label = NAME_MAP[name] ?? name.toUpperCase()

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
            fill={`hsl(152, 60%, ${8 + i * 4}%)`}
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
