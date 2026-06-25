import { headers } from 'next/headers'

/**
 * リクエストのホスト名からテナントIDを解決する
 * - debug.wisdom-assemble.com → 'debug'
 * - localhost:3000?tenant=debug → 'debug' (開発用)
 */
export async function getTenantId(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''

  // 開発環境: クエリパラメータまたはデフォルト
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // middleware で x-tenant-id ヘッダーをセット済みの場合
    const tenantHeader = headersList.get('x-tenant-id')
    if (tenantHeader) return tenantHeader
    return 'debug' // デフォルトテナント
  }

  // 本番: サブドメインを取得
  // debug.wisdom-assemble.com → 'debug'
  const subdomain = host.split('.')[0]
  return subdomain
}
