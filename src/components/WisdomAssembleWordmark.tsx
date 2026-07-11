// ルートドメイン(wisdomassemble.com)専用のワードマーク。トップページの見出しと
// Header（/terms /privacy /contact 等の全ページ共通ヘッダー）の両方で使う。
// Sample Logo builderの仕様: Georgia serif・Two-tone split・letter-spacing 0.20em
type Props = {
  fontSize: number
  className?: string
}

export default function WisdomAssembleWordmark({ fontSize, className }: Props) {
  const tmFontSize = Math.round(fontSize * 0.34)

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 800,
        fontSize: `${fontSize}px`,
        letterSpacing: '0.20em',
        textTransform: 'uppercase',
        background: 'linear-gradient(90deg, #929292 50%, #606060 50%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
      }}
    >
      WISDOM ASSEMBLE
      <span
        style={{
          display: 'inline-block',
          fontFamily: '-apple-system, sans-serif',
          fontWeight: 400,
          fontSize: `${tmFontSize}px`,
          letterSpacing: 'normal',
          verticalAlign: 'super',
          marginLeft: '-1px',
          color: '#929292',
          WebkitTextFillColor: '#929292',
          background: 'none',
        }}
      >
        ™
      </span>
    </span>
  )
}
