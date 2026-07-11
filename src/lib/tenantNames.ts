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

// ルートポータルのジャンル検索用タグ（表示名に加えて、関連キーワードで検索できるようにする）
export const TENANT_SEARCH_TAGS: Record<string, string[]> = {
  debug: ['bug', 'debug', 'programming', 'code', 'engineer', 'プログラミング', 'デバッグ', 'コード', 'バグ', 'エンジニア'],
  'tax-japan': ['tax', 'japan', 'finance', '税金', '確定申告', '日本'],
  'australia-whv': ['work holiday', 'australia', 'visa', 'ワーホリ', 'ワーキングホリデー', 'オーストラリア', 'ビザ'],
  bali: ['bali', 'indonesia', 'nomad', 'life', 'バリ', 'インドネシア', '移住', 'ノマド'],
  chiangmai: ['chiang mai', 'thailand', 'nomad', 'チェンマイ', 'タイ', '移住', 'ノマド'],
  portugal: ['portugal', 'europe', 'nomad', 'visa', 'ポルトガル', '移住', 'ビザ'],
  dtm: ['music production', 'music', 'dtm', 'daw', 'ableton', 'mixing', 'mastering', '音楽', '作曲', 'ミキシング', 'マスタリング'],
  keyboard: ['keyboard', 'mechanical keyboard', 'キーボード', '自作キーボード'],
  philippines: ['philippines', 'study', 'english', 'フィリピン', '留学', '英語'],
  canada: ['canada', 'study', 'カナダ', '留学'],
}
