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
  guitar: 'GUITAR & PEDALS',
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
// ※ポータル掲載の実体は PortalHome.tsx の REVIEW_TENANT_IDS。この定数はどこからも
//   参照されていない（2026-07-14に判明）。掲載の切り替えは PortalHome.tsx 側で行う。
export const LIVE_TENANT_IDS = ['debug', 'dtm']

// 休眠テナント（サブドメイン・DBは残すが、検索結果から消す）。
//
// ここに入れると次の2つが同時に効く:
//   1. 全ページに noindex, follow（[locale]/layout.tsx の generateMetadata）
//   2. sitemap.xml が空になる（sitemap.ts）
// あわせて PortalHome.tsx の REVIEW_TENANT_IDS からも外すことで、
// ルートポータルのカードも消える＝人からの入口が無くなる。
//
// ⚠️ robots.txt では絶対にブロックしないこと（2026-08-08に一度やって取り消した）。
//    robots.txtでブロックするとGooglebotがページを取得できず、HTML内のnoindexを
//    読めないため、既にインデックスされたURLが消えずに残る＝noindexが無効化される。
//    インデックスから消すには、クロールさせてnoindexを読ませる必要がある。
//
// 復活させるときはこの配列から外して REVIEW_TENANT_IDS に戻すだけでよい。
// URL・DBのデータ・Cloudflareのドメイン設定は一切壊さない。
//
// 【用途】
//   - リリース前のジャンル（中身が薄いままインデックスされるのを防ぐ）
//   - 質問数が開設ラインに達していないテナント
//   Googleは中身の薄いページを「低品質」と見なし、ドメイン全体の評価を下げるため、
//   出せる状態になるまでは検索結果に載せない方が安全。
export const DORMANT_TENANT_IDS = ['debug']

export function isDormantTenant(tenantId: string): boolean {
  return DORMANT_TENANT_IDS.includes(tenantId)
}

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
  },
  guitar: {
    fontFamily: "'American Typewriter', 'Courier New', monospace",
    fontWeight: 800,
    letterSpacingEm: -0.08,
    fontSizePx: 34,
    gradientFrom: '#a96800',
    gradientTo: '#F97316',
    treatment: 'diagsplit',
    widthEmPerChar: 0.6599,
  },
}

// ルートポータルのジャンル検索用タグ（表示名に加えて、関連キーワードで検索できるようにする）
// 対応8言語（en/ja/zh/id/vi/ko/es/pt）どの言語で検索してもヒットするようにキーワードを用意
export const TENANT_SEARCH_TAGS: Record<string, string[]> = {
  // 【2026-08-23】guitar はここに1件も登録が無く、日本語「ギター」で検索しても
  // ヒットしなかった（英語で出ていたのは、テナントIDの 'guitar' がたまたま
  // 一致していただけ）。新テナント追加時はここへの登録を忘れやすいので、
  // PortalHome.tsx 側で「カードの説明文」も検索対象に入れる保険をかけてある。
  guitar: [
    'guitar', 'guitars', 'pedal', 'pedals', 'pedalboard', 'effects', 'effector',
    'amp', 'amplifier', 'tube amp', 'fuzz', 'distortion', 'overdrive', 'reverb',
    'pickup', 'humbucker', 'single coil', 'vintage', 'recording', 'repair', 'setup',
    'fender', 'gibson', 'stratocaster', 'telecaster', 'les paul', 'acoustic', 'electric',
    'ギター', 'ギタリスト', 'エフェクター', 'ペダル', 'アンプ', 'フェンダー', 'ギブソン', '弦',
    'ファズ', '歪み', 'オーバードライブ', 'リバーブ', 'ストラト', 'テレキャス', 'レスポール',
    '吉他', '效果器', '音箱',
    'gitar', 'efek', 'amplifier',
    'ghi ta', 'bàn đạp', 'hiệu ứng',
    '기타', '이펙터', '앰프',
    'guitarra', 'pedales', 'amplificador',
    'pedais',
  ],
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
    'music production', 'music', 'dtm', 'daw', 'ableton', 'logic', 'cubase', 'pro tools',
    'mixing', 'mastering', 'recording', 'vocal', 'vocals', 'synth', 'synthesizer',
    'midi', 'sampling', 'arrangement', 'composition', 'music theory', 'plugin',
    'audio interface', 'monitor', 'speaker', 'microphone', 'mic', 'studio',
    '音楽', '音楽制作', '作曲', '編曲', 'ミックス', 'ミキシング', 'マスタリング', 'レコーディング', '録音', '打ち込み', 'エイブルトン', 'シンセ', 'プラグイン', 'マイク', 'モニター',
    '音乐制作', '音乐', '混音', '母带', '录音', '人声',
    'produksi musik', 'musik', 'rekaman', 'vokal',
    'sản xuất âm nhạc', 'âm nhạc', 'phối khí', 'thu âm', 'giọng hát',
    '음악 제작', '음악', '믹싱', '마스터링', '녹음', '보컬',
    'producción musical', 'música', 'mezcla', 'masterización', 'grabación', 'voz',
    'produção musical', 'música', 'mixagem', 'masterização', 'gravação', 'voz',
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

/* 【2026-08-23】ジャンル検索用の正規化。小文字化に加えてアクセント記号（ダイアクリティカルマーク）を落とす。
   理由：スペイン語で「música」と打っても0件だった。説明文に入っているのは「producción musical」＝
   形容詞形の "musical" で、"música" は部分一致しない。記号を落とすと "musica" となり
   "musical" に含まれるので一致する。ベトナム語は記号なしで打つ利用者が多く（âm nhạc → am nhac）、
   ポルトガル語も música/musical の同じ問題があるため、全言語まとめてここで吸収する。
   日本語・韓国語・中国語は分解対象の記号を持たないので影響しない。 */
export function normalizeForSearch(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
