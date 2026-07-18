// テナントID（middleware.tsのVALID_SUBDOMAINSと一致）を英語表記に変換
// テナント名（DBのnameカラム）は「確定申告（日本）」のように補足が付くことがあり
// 完全一致しないため、キーは変わらないテナントIDにする
export const TENANT_NAME_MAP: Record<string, string> = {
  debug: 'BUG DEBUG',
  'tax-japan': 'TAX JAPAN',
  'australia-whv': 'WORK HOLIDAY',
  bali: 'BALI LIFE',
  chiangmai: 'CHIANGMAI',
  portugal: 'PORTUGAL',
  dtm: 'MUSIC PRODUCTION',
  keyboard: 'KEYBOARDS',
  philippines: 'PH STUDY',
  canada: 'CA STUDY',
}

export function getTenantDisplayName(tenantId: string | undefined, name: string): string {
  if (tenantId && TENANT_NAME_MAP[tenantId]) return TENANT_NAME_MAP[tenantId]
  return name.toUpperCase()
}

// 内部テナントIDに対する公開URL用サブドメイン（middleware.tsのSUBDOMAIN_ALIASESの逆引き）
// ルール: 公開ドメイン名はテナント表示名（TENANT_NAME_MAP）に合わせる
// debugの公開サブドメインはbug.wisdomassemble.com、dtmはmusic-prod.wisdomassemble.com
export const PUBLIC_SUBDOMAIN_MAP: Record<string, string> = {
  debug: 'bug',
  dtm: 'music-prod',
}

export function getPublicSubdomain(tenantId: string): string {
  return PUBLIC_SUBDOMAIN_MAP[tenantId] ?? tenantId
}

// ルートポータルに掲載する、実際にサブドメインが稼働済みのテナントID
export const LIVE_TENANT_IDS = ['debug', 'dtm']

// テナントごとのロゴスタイル上書き（Sample Logo builderで作った組み合わせをそのまま反映する用途）。
// 未指定のテナントは SiteLogo.tsx のデフォルト（Impact系・3D押し出し）のまま。
// treatment省略時は既存互換のため'gradient'扱い。対応済みtreatment一覧はSiteLogo.tsx参照
// （globals.cssのfx-*クラス。Sample Logo builderの30種のうち15種のCSSのみ処理を移植済み）。
export type LogoTreatment =
  | 'flat' | '3d' | 'outline' | 'neon' | 'gradient' | 'stripe' | 'split'
  | 'underline' | 'shadow' | 'duo' | 'longshadow' | 'vertgradient' | 'fade'
  | 'dotted' | 'doublerule' | 'diagsplit' | 'skew' | 'glitch' | 'engrave'
  | 'deboss' | 'varsity' | 'duplicate' | 'bracket' | 'marker' | 'pill' | 'emblem'

export type LogoStyleOverride = {
  fontFamily: string
  fontWeight: number
  letterSpacingEm: number
  fontSizePx: number
  gradientFrom: string
  gradientTo: string
  treatment?: LogoTreatment
  // ロゴビルダーが canvas.measureText で実測した「1文字あたりの幅（em単位）」。
  // = measureText(表示名).width / 表示名.length / fontSizePx
  // SVGのviewBox幅をこの実測値でぴったり合わせると、フォントが変わっても
  // 右切れ・左寄り(中央ズレ)が起きない。未指定時は 0.70（Century Gothic系の実測近似）。
  widthEmPerChar?: number
}

export const LOGO_STYLE_OVERRIDES: Record<string, LogoStyleOverride> = {
  dtm: {
    fontFamily: "'Century Gothic', Futura, 'Segoe UI', sans-serif",
    fontWeight: 800,
    letterSpacingEm: -0.05,
    fontSizePx: 32,
    gradientFrom: '#74a7fe',
    gradientTo: '#606060',
    treatment: '3d', // [一時] foreignObject方式の本番実証用。確認後にgradientへ戻す
  },
}

// ルートポータルのジャンル検索用タグ（表示名に加えて、関連キーワードで検索できるようにする）
// 対応8言語（en/ja/zh/id/vi/ko/es/pt）どの言語で検索してもヒットするようにキーワードを用意
export const TENANT_SEARCH_TAGS: Record<string, string[]> = {
  debug: [
    'bug', 'debug', 'programming', 'code', 'engineer',
    'プログラミング', 'デバッグ', 'コード', 'バグ', 'エンジニア',
    '编程', '调试', '代码',
    'pemrograman', 'kode',
    'lập trình', 'gỡ lỗi', 'mã',
    '프로그래밍', '디버그', '코드',
    'programación', 'depuración', 'código',
    'programação', 'depuração', 'código',
  ],
  'tax-japan': [
    'tax', 'japan', 'finance',
    '税金', '確定申告', '日本',
    '税务', '日本',
    'pajak', 'jepang',
    'thuế', 'nhật bản',
    '세금', '일본',
    'impuestos', 'japón',
    'impostos', 'japão',
  ],
  'australia-whv': [
    'work holiday', 'australia', 'visa',
    'ワーホリ', 'ワーキングホリデー', 'オーストラリア', 'ビザ',
    '打工度假', '澳大利亚', '签证',
    'kerja liburan', 'australia',
    'làm việc kỳ nghỉ', 'úc',
    '워킹홀리데이', '호주', '비자',
    'vacaciones de trabajo', 'australia',
    'férias de trabalho', 'austrália', 'visto',
  ],
  bali: [
    'bali', 'indonesia', 'nomad', 'life',
    'バリ', 'インドネシア', '移住', 'ノマド',
    '巴厘岛', '印度尼西亚', '游牧',
    'bali', 'indonesia', 'nomaden',
    'bali', 'indonesia', 'du mục',
    '발리', '인도네시아', '노마드',
    'bali', 'indonesia', 'nómada',
    'bali', 'indonésia', 'nômade',
  ],
  chiangmai: [
    'chiang mai', 'thailand', 'nomad',
    'チェンマイ', 'タイ', '移住', 'ノマド',
    '清迈', '泰国',
    'chiang mai', 'thailand',
    'chiang mai', 'thái lan',
    '치앙마이', '태국',
    'chiang mai', 'tailandia',
    'chiang mai', 'tailândia',
  ],
  portugal: [
    'portugal', 'europe', 'nomad', 'visa',
    'ポルトガル', '移住', 'ビザ',
    '葡萄牙', '欧洲',
    'portugal', 'eropa',
    'bồ đào nha', 'châu âu',
    '포르투갈', '유럽',
    'portugal', 'europa',
    'portugal', 'europa',
  ],
  dtm: [
    'music production', 'music', 'dtm', 'daw', 'ableton', 'mixing', 'mastering',
    '音楽', '作曲', 'ミキシング', 'マスタリング',
    '音乐制作', '混音', '母带',
    'produksi musik', 'mixing', 'mastering',
    'sản xuất âm nhạc', 'phối khí', 'mastering',
    '음악 제작', '믹싱', '마스터링',
    'producción musical', 'mezcla', 'masterización',
    'produção musical', 'mixagem', 'masterização',
  ],
  keyboard: [
    'keyboard', 'mechanical keyboard',
    'キーボード', '自作キーボード',
    '机械键盘', '键盘',
    'keyboard mekanikal',
    'bàn phím cơ',
    '기계식 키보드', '키보드',
    'teclado mecánico',
    'teclado mecânico',
  ],
  philippines: [
    'philippines', 'study', 'english',
    'フィリピン', '留学', '英語',
    '菲律宾', '留学', '英语',
    'filipina', 'belajar', 'bahasa inggris',
    'philippines', 'du học', 'tiếng anh',
    '필리핀', '유학', '영어',
    'filipinas', 'estudiar', 'inglés',
    'filipinas', 'estudar', 'inglês',
  ],
  canada: [
    'canada', 'study',
    'カナダ', '留学',
    '加拿大', '留学',
    'kanada', 'belajar',
    'canada', 'du học',
    '캐나다', '유학',
    'canadá', 'estudiar',
    'canadá', 'estudar',
  ],
}
