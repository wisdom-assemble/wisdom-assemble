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
  dtm: 'MUSIC PROD',
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
export const LIVE_TENANT_IDS = ['debug']
