import { headers } from 'next/headers'

/**
 * リクエストのテナントIDを解決する。
 * middleware.ts がホスト名（本番はサブドメイン、開発は?tenant=/x-tenant-idヘッダー）から
 * 有効なテナントか検証した上で x-tenant-id ヘッダーにセットしているので、それをそのまま信頼する。
 */
export async function getTenantId(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-tenant-id') ?? 'debug'
}
